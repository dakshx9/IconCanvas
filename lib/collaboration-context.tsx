"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import type {
    GroupSession, GroupMember, ChatMessage, PermissionLevel, SyncEvent,
    SyncedCanvasState
} from "@/types/collaboration"
import {
    generateTeamCode, generateMemberIdentity, MEMBER_COLORS, AVATAR_EMOJIS
} from "@/types/collaboration"
import {
    syncChannel, saveSessionToStorage, getSessionFromStorage, clearSessionStorage,
    getSharedState, setSharedState
} from "@/lib/sync-channel"
import type { CanvasIcon, TextElement, DrawingPath } from "@/types/icon"

interface CollaborationContextType {
    // Session state
    session: GroupSession | null
    isConnected: boolean
    currentMember: GroupMember | null

    // Actions
    createGroup: (name: string, memberName: string) => void
    joinGroup: (code: string, memberName: string) => boolean
    leaveGroup: () => void

    // Chat
    messages: ChatMessage[]
    sendMessage: (text: string) => void

    // Cursor sync
    updateCursor: (x: number, y: number) => void
    remoteCursors: Map<string, { x: number; y: number; name: string; color: string }>

    // Canvas sync
    broadcastCanvasUpdate: (state: Partial<SyncedCanvasState>) => void
    onCanvasUpdate: ((state: Partial<SyncedCanvasState>) => void) | null
    setOnCanvasUpdate: (cb: ((state: Partial<SyncedCanvasState>) => void) | null) => void

    // Permissions
    setMemberPermission: (memberId: string, permission: PermissionLevel) => void
}

const CollaborationContext = createContext<CollaborationContextType | null>(null)

export function useCollaboration() {
    const ctx = useContext(CollaborationContext)
    if (!ctx) {
        throw new Error("useCollaboration must be used within CollaborationProvider")
    }
    return ctx
}

// Safe hook that returns null when not in provider
export function useCollaborationSafe() {
    return useContext(CollaborationContext)
}

interface CollaborationProviderProps {
    children: React.ReactNode
}

export function CollaborationProvider({ children }: CollaborationProviderProps) {
    const [session, setSession] = useState<GroupSession | null>(null)
    const [currentMember, setCurrentMember] = useState<GroupMember | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [remoteCursors, setRemoteCursors] = useState<Map<string, { x: number; y: number; name: string; color: string }>>(new Map())

    const onCanvasUpdateRef = useRef<((state: Partial<SyncedCanvasState>) => void) | null>(null)

    const isConnected = session !== null && currentMember !== null

    // Handle incoming sync events
    const handleSyncEvent = useCallback((event: SyncEvent) => {
        switch (event.type) {
            case "MEMBER_JOIN": {
                const newMember = event.payload as GroupMember
                setSession(prev => {
                    if (!prev) return null
                    // Don't add if already exists
                    if (prev.members.find(m => m.id === newMember.id)) return prev
                    const updated = { ...prev, members: [...prev.members, newMember] }
                    setSharedState(`session-${prev.code}`, updated)
                    return updated
                })
                break
            }

            case "MEMBER_LEAVE": {
                const memberId = event.payload as string
                setSession(prev => {
                    if (!prev) return null
                    const updated = { ...prev, members: prev.members.filter(m => m.id !== memberId) }
                    setSharedState(`session-${prev.code}`, updated)
                    return updated
                })
                setRemoteCursors(prev => {
                    const next = new Map(prev)
                    next.delete(memberId)
                    return next
                })
                break
            }

            case "CURSOR_MOVE": {
                const { x, y, name, color } = event.payload as { x: number; y: number; name: string; color: string }
                setRemoteCursors(prev => {
                    const next = new Map(prev)
                    next.set(event.memberId, { x, y, name, color })
                    return next
                })
                break
            }

            case "CHAT_MESSAGE": {
                const message = event.payload as ChatMessage
                setMessages(prev => [...prev, message])
                break
            }

            case "CANVAS_UPDATE": {
                const state = event.payload as Partial<SyncedCanvasState>
                if (onCanvasUpdateRef.current) {
                    onCanvasUpdateRef.current(state)
                }
                break
            }

            case "FULL_SYNC": {
                // When a new member joins, host sends full state
                const fullSession = event.payload as GroupSession
                setSession(fullSession)
                setMessages(fullSession.messages)
                break
            }
        }
    }, [])

    // Create a new group
    const createGroup = useCallback((name: string, memberName: string) => {
        const code = generateTeamCode()
        const memberId = `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const identity = generateMemberIdentity()

        const host: GroupMember = {
            id: memberId,
            name: memberName,
            color: identity.color,
            avatarEmoji: identity.avatarEmoji,
            isHost: true,
            cursor: null,
            lastSeen: Date.now(),
            permission: "host"
        }

        const newSession: GroupSession = {
            id: `session-${Date.now()}`,
            code,
            name,
            hostId: memberId,
            members: [host],
            messages: [],
            createdAt: Date.now()
        }

        setSession(newSession)
        setCurrentMember(host)
        setMessages([])

        // Save to storage and init sync
        saveSessionToStorage({ code, memberId, memberName })
        setSharedState(`session-${code}`, newSession)
        syncChannel.init(code, memberId)
        syncChannel.subscribe(handleSyncEvent)
    }, [handleSyncEvent])

    // Join existing group
    const joinGroup = useCallback((code: string, memberName: string): boolean => {
        // Check if session exists in shared state
        const existingSession = getSharedState<GroupSession>(`session-${code}`)

        if (!existingSession) {
            return false
        }

        const memberId = `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const identity = generateMemberIdentity()

        const member: GroupMember = {
            id: memberId,
            name: memberName,
            color: identity.color,
            avatarEmoji: identity.avatarEmoji,
            isHost: false,
            cursor: null,
            lastSeen: Date.now(),
            permission: "editor"
        }

        // Add self to session
        const updatedSession = {
            ...existingSession,
            members: [...existingSession.members, member]
        }

        setSession(updatedSession)
        setCurrentMember(member)
        setMessages(existingSession.messages)

        // Save and init sync
        saveSessionToStorage({ code, memberId, memberName })
        setSharedState(`session-${code}`, updatedSession)
        syncChannel.init(code, memberId)
        syncChannel.subscribe(handleSyncEvent)

        // Broadcast join
        syncChannel.broadcast("MEMBER_JOIN", member)

        return true
    }, [handleSyncEvent])

    // Leave group
    const leaveGroup = useCallback(() => {
        if (!session || !currentMember) return

        syncChannel.broadcast("MEMBER_LEAVE", currentMember.id)
        syncChannel.disconnect()
        clearSessionStorage()

        setSession(null)
        setCurrentMember(null)
        setMessages([])
        setRemoteCursors(new Map())
    }, [session, currentMember])

    // Send chat message
    const sendMessage = useCallback((text: string) => {
        if (!currentMember || !text.trim()) return

        const message: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            memberId: currentMember.id,
            memberName: currentMember.name,
            memberColor: currentMember.color,
            text: text.trim(),
            timestamp: Date.now()
        }

        setMessages(prev => [...prev, message])
        syncChannel.broadcast("CHAT_MESSAGE", message)

        // Update shared session
        if (session) {
            const updated = { ...session, messages: [...session.messages, message] }
            setSharedState(`session-${session.code}`, updated)
        }
    }, [currentMember, session])

    // Update cursor position
    const updateCursor = useCallback((x: number, y: number) => {
        if (!currentMember) return
        syncChannel.broadcast("CURSOR_MOVE", {
            x, y,
            name: currentMember.name,
            color: currentMember.color
        })
    }, [currentMember])

    // Broadcast canvas update
    const broadcastCanvasUpdate = useCallback((state: Partial<SyncedCanvasState>) => {
        if (!isConnected) return
        syncChannel.broadcast("CANVAS_UPDATE", state)
    }, [isConnected])

    // Set permission for a member (host only)
    const setMemberPermission = useCallback((memberId: string, permission: PermissionLevel) => {
        if (!currentMember?.isHost || !session) return

        setSession(prev => {
            if (!prev) return null
            const updated = {
                ...prev,
                members: prev.members.map(m =>
                    m.id === memberId ? { ...m, permission } : m
                )
            }
            setSharedState(`session-${prev.code}`, updated)
            syncChannel.broadcast("MEMBER_UPDATE", updated.members.find(m => m.id === memberId))
            return updated
        })
    }, [currentMember, session])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (syncChannel.isConnected()) {
                syncChannel.disconnect()
            }
        }
    }, [])

    const value: CollaborationContextType = {
        session,
        isConnected,
        currentMember,
        createGroup,
        joinGroup,
        leaveGroup,
        messages,
        sendMessage,
        updateCursor,
        remoteCursors,
        broadcastCanvasUpdate,
        onCanvasUpdate: onCanvasUpdateRef.current,
        setOnCanvasUpdate: (cb) => { onCanvasUpdateRef.current = cb },
        setMemberPermission
    }

    return (
        <CollaborationContext.Provider value={value}>
            {children}
        </CollaborationContext.Provider>
    )
}
