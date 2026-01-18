// Real-time Sync Layer using BroadcastChannel API
// Works across browser tabs on the same device - perfect for hackathon demos!

import type { SyncEvent, SyncEventType } from "@/types/collaboration"

type SyncCallback = (event: SyncEvent) => void

class SyncChannel {
    private channel: BroadcastChannel | null = null
    private callbacks: Set<SyncCallback> = new Set()
    private memberId: string = ""
    private sessionCode: string = ""

    init(sessionCode: string, memberId: string) {
        this.sessionCode = sessionCode
        this.memberId = memberId

        // Create channel named after session code
        this.channel = new BroadcastChannel(`icony-studio-${sessionCode}`)

        this.channel.onmessage = (event: MessageEvent<SyncEvent>) => {
            // Don't process our own messages
            if (event.data.memberId === this.memberId) return

            this.callbacks.forEach(cb => cb(event.data))
        }
    }

    broadcast(type: SyncEventType, payload: unknown) {
        if (!this.channel) return

        const event: SyncEvent = {
            type,
            memberId: this.memberId,
            sessionCode: this.sessionCode,
            timestamp: Date.now(),
            payload
        }

        this.channel.postMessage(event)
    }

    subscribe(callback: SyncCallback) {
        this.callbacks.add(callback)
        return () => this.callbacks.delete(callback)
    }

    disconnect() {
        if (this.channel) {
            this.channel.close()
            this.channel = null
        }
        this.callbacks.clear()
    }

    isConnected() {
        return this.channel !== null
    }
}

// Singleton instance
export const syncChannel = new SyncChannel()

// Storage helpers for session persistence
const SESSION_STORAGE_KEY = "icony-studio-session"

export function saveSessionToStorage(session: { code: string; memberId: string; memberName: string }) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function getSessionFromStorage(): { code: string; memberId: string; memberName: string } | null {
    try {
        const data = localStorage.getItem(SESSION_STORAGE_KEY)
        return data ? JSON.parse(data) : null
    } catch {
        return null
    }
}

export function clearSessionStorage() {
    localStorage.removeItem(SESSION_STORAGE_KEY)
}

// Shared state storage (for syncing between tabs)
export function getSharedState<T>(key: string): T | null {
    try {
        const data = localStorage.getItem(`icony-shared-${key}`)
        return data ? JSON.parse(data) : null
    } catch {
        return null
    }
}

export function setSharedState<T>(key: string, value: T) {
    localStorage.setItem(`icony-shared-${key}`, JSON.stringify(value))
}
