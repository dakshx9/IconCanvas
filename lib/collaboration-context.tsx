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
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useSelf,
    useOthers,
    useStorage,
    useMutation
} from "@/liveblocks.config"
import { LiveList, LiveObject } from "@liveblocks/client"
import { ClientSideSuspense } from "@liveblocks/react"
import { toast } from "sonner"

// --- Context Definition ---

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

export function useCollaborationSafe() {
    return useContext(CollaborationContext)
}

// --- Provider Component ---

export function CollaborationProvider({ children }: { children: React.ReactNode }) {
    const [roomCode, setRoomCode] = useState<string | null>(null)
    const [sessionName, setSessionName] = useState<string>("")
    const [userName, setUserName] = useState<string>("")
    const [isHost, setIsHost] = useState(false)
    const [identity, setIdentity] = useState<{ color: string, avatarEmoji: string } | null>(null)

    // Actions that set up the connection
    const createGroup = useCallback((name: string, memberName: string) => {
        const code = generateTeamCode()
        const id = generateMemberIdentity()
        setSessionName(name)
        setUserName(memberName)
        setIdentity(id)
        setIsHost(true)
        setRoomCode(code) // This triggers RoomProvider rendering
    }, [])

    const joinGroup = useCallback((code: string, memberName: string) => {
        const id = generateMemberIdentity()
        setSessionName("Team Session") // Default name until synced
        setUserName(memberName)
        setIdentity(id)
        setIsHost(false)
        setRoomCode(code)
        return true
    }, [])

    const leaveGroup = useCallback(() => {
        setRoomCode(null)
        setSessionName("")
        setUserName("")
        setIsHost(false)
        setIdentity(null)
    }, [])

    if (roomCode && identity) {
        return (
            <RoomProvider
                id={roomCode}
                initialPresence={{
                    cursor: null,
                    info: {
                        name: userName,
                        color: identity.color,
                        avatarEmoji: identity.avatarEmoji,
                        isHost: isHost
                    }
                }}
                initialStorage={{
                    messages: new LiveList([]),
                    canvas: new LiveObject({} as SyncedCanvasState) // Initialize empty
                }}
            >
                <ClientSideSuspense fallback={null}>
                    {() => (
                        <ConnectedCollaborationLogic
                            roomCode={roomCode}
                            sessionName={sessionName}
                            userName={userName}
                            identity={identity}
                            leaveGroup={leaveGroup}
                            isHost={isHost}
                        >
                            {children}
                        </ConnectedCollaborationLogic>
                    )}
                </ClientSideSuspense>
            </RoomProvider>
        )
    }

    // Disconnected state
    return (
        <CollaborationContext.Provider value={{
            session: null,
            isConnected: false,
            currentMember: null,
            createGroup,
            joinGroup,
            leaveGroup,
            messages: [],
            sendMessage: () => { },
            updateCursor: () => { },
            remoteCursors: new Map(),
            broadcastCanvasUpdate: () => { },
            onCanvasUpdate: null,
            setOnCanvasUpdate: () => { },
            setMemberPermission: () => { }
        }}>
            {children}
        </CollaborationContext.Provider>
    )
}

// --- Connected Logic ---

interface ConnectedProps {
    children: React.ReactNode
    roomCode: string
    sessionName: string
    userName: string
    identity: { color: string, avatarEmoji: string }
    leaveGroup: () => void
    isHost: boolean
}

function ConnectedCollaborationLogic({ children, roomCode, sessionName, userName, identity, leaveGroup, isHost }: ConnectedProps) {
    const others = useOthers()
    const self = useSelf()
    const [myPresence, updateMyPresence] = useMyPresence()

    // Liveblocks Storage Hooks - Reading
    const messages = useStorage((root: any) => root.messages) || []
    const canvasObj = useStorage((root: any) => root.canvas)

    // Construct "Session" object compatible with app
    // Memoize members to avoid re-render loops if possible, but they depend on others which changes on cursor move.
    // However, we can memoize the session object STRUCTURE.
    const members = React.useMemo<GroupMember[]>(() => [
        // Self
        {
            id: self?.connectionId.toString() || "me",
            name: userName,
            color: identity.color,
            avatarEmoji: identity.avatarEmoji,
            isHost: isHost,
            cursor: myPresence?.cursor || null,
            lastSeen: Date.now(),
            permission: isHost ? "host" : "editor"
        },
        // Others
        ...others.map(other => ({
            id: other.connectionId.toString(),
            name: other.presence.info?.name || "Anonymous",
            color: other.presence.info?.color || "#999",
            avatarEmoji: other.presence.info?.avatarEmoji || "👤",
            isHost: other.presence.info?.isHost || false,
            cursor: other.presence.cursor || null,
            lastSeen: Date.now(),
            permission: (other.presence.info?.isHost ? "host" : "editor") as PermissionLevel
        }))
    ], [others, self, userName, identity, isHost, myPresence])

    const session = React.useMemo<GroupSession>(() => ({
        id: `session-${roomCode}`,
        code: roomCode,
        name: sessionName,
        hostId: members.find(m => m.isHost)?.id || "unknown",
        members,
        messages: messages as ChatMessage[],
        createdAt: Date.now()
    }), [roomCode, sessionName, members, messages])

    // Remote Cursors Map
    const remoteCursors = React.useMemo(() => {
        const map = new Map<string, { x: number; y: number; name: string; color: string }>()
        others.forEach(other => {
            if (other.presence.cursor) {
                map.set(other.connectionId.toString(), {
                    x: other.presence.cursor.x,
                    y: other.presence.cursor.y,
                    name: other.presence.info?.name || "Anonymous",
                    color: other.presence.info?.color || "#999"
                })
            }
        })
        return map
    }, [others])

    // Subscriptions & Callbacks
    const sendMessage = useMutation(({ storage }, text: string) => {
        try {
            if (!text.trim()) return
            const msg: ChatMessage = {
                id: `msg-${Date.now()}`,
                memberId: self?.connectionId.toString() || "me",
                memberName: userName,
                memberColor: identity.color,
                text: text.trim(),
                timestamp: Date.now()
            }

            // Ensure storage exists before pushing
            if (!storage) return
            const messagesHandle = storage.get("messages")
            if (messagesHandle) {
                messagesHandle.push(msg)
            }
        } catch (e) {
            // Storage not loaded yet
        }
    }, [userName, identity])

    const updateCursor = useCallback((x: number, y: number) => {
        updateMyPresence({ cursor: { x, y } })
    }, [updateMyPresence])

    // Canvas Sync
    const onCanvasUpdateRef = useRef<((state: Partial<SyncedCanvasState>) => void) | null>(null)

    // Listen to storage changes for canvas
    useEffect(() => {
        if (canvasObj && onCanvasUpdateRef.current) {
            onCanvasUpdateRef.current(canvasObj as unknown as Partial<SyncedCanvasState>)
        }
    }, [canvasObj])

    const broadcastCanvasUpdate = useMutation((context, state: Partial<SyncedCanvasState>) => {
        try {
            const storage = context.storage;
            if (!storage) return
            const canvas = storage.get("canvas")
            if (canvas) {
                canvas.update(state)
            }
        } catch (e) {
            // Storage not loaded yet
        }
    }, [])

    const contextValue = React.useMemo(() => ({
        session,
        isConnected: true,
        currentMember: members[0], // Self
        createGroup: () => { }, // Already connected
        joinGroup: () => true, // Already connected
        leaveGroup,
        messages: messages as ChatMessage[],
        sendMessage,
        updateCursor,
        remoteCursors,
        broadcastCanvasUpdate,
        onCanvasUpdate: onCanvasUpdateRef.current,
        setOnCanvasUpdate: (cb: any) => { onCanvasUpdateRef.current = cb },
        setMemberPermission: () => { } // simplified
    }), [session, members, leaveGroup, messages, sendMessage, updateCursor, remoteCursors, broadcastCanvasUpdate])

    return (
        <CollaborationContext.Provider value={contextValue}>
            {children}
        </CollaborationContext.Provider>
    )
}
