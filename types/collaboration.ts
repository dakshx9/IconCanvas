// Collaboration Types for Real-time Group Work

export interface GroupMember {
    id: string
    name: string
    color: string
    avatarEmoji: string
    isHost: boolean
    cursor: { x: number; y: number } | null
    lastSeen: number
    permission: PermissionLevel
}

export type PermissionLevel = "viewer" | "editor" | "host"

export interface ChatMessage {
    id: string
    memberId: string
    memberName: string
    memberColor: string
    text: string
    timestamp: number
}

export interface GroupSession {
    id: string
    code: string
    name: string
    hostId: string
    members: GroupMember[]
    messages: ChatMessage[]
    createdAt: number
}

// Canvas state that gets synced
// Canvas state that gets synced
export interface SyncedCanvasState {
    icons: import("./icon").CanvasIcon[]
    textElements: import("./icon").TextElement[]
    imageElements: import("./icon").ImageElement[]
    shapes: import("./icon").ShapeElement[]
    drawings: import("./icon").DrawingPath[]
    canvasSize: { width: number; height: number }
    backgroundColor: string
    layerOrder: string[]
    slides: import("./slide").CanvasSlide[]
    currentSlideIndex: number
}

// Sync events
export type SyncEventType =
    | "MEMBER_JOIN"
    | "MEMBER_LEAVE"
    | "MEMBER_UPDATE"
    | "CURSOR_MOVE"
    | "CHAT_MESSAGE"
    | "CANVAS_UPDATE"
    | "ELEMENT_LOCK"
    | "FULL_SYNC"

export interface SyncEvent {
    type: SyncEventType
    memberId: string
    sessionCode: string
    timestamp: number
    payload: unknown
}

// Avatar emoji options
export const AVATAR_EMOJIS = [
    "🦊", "🐻", "🐼", "🐨", "🦁", "🐯", "🐸", "🐵",
    "🦄", "🐲", "🦋", "🐝", "🦈", "🐙", "🦜", "🦩"
]

// Member colors
export const MEMBER_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
    "#f43f5e", "#06b6d4", "#84cc16", "#a855f7"
]

// Generate 6-character team code
export function generateTeamCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // No O/0/I/1 for clarity
    let code = ""
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
}

// Generate random member identity
export function generateMemberIdentity() {
    return {
        color: MEMBER_COLORS[Math.floor(Math.random() * MEMBER_COLORS.length)],
        avatarEmoji: AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)]
    }
}
