"use client"

import { useCollaborationSafe } from "@/lib/collaboration-context"
import { motion } from "framer-motion"

interface MemberCursorsProps {
    containerRef: React.RefObject<HTMLElement | null>
}

export function MemberCursors({ containerRef }: MemberCursorsProps) {
    const collab = useCollaborationSafe()

    if (!collab?.isConnected) return null

    const { remoteCursors, currentMember } = collab

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {Array.from(remoteCursors.entries()).map(([memberId, cursor]) => {
                if (memberId === currentMember?.id) return null

                return (
                    <motion.div
                        key={memberId}
                        className="absolute"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            x: cursor.x,
                            y: cursor.y
                        }}
                        transition={{ type: "spring", damping: 30, stiffness: 500 }}
                        style={{ left: 0, top: 0 }}
                    >
                        {/* Cursor Arrow */}
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
                        >
                            <path
                                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-5.07 3.95 8.99c.1.22.34.36.58.29l2.02-.55c.24-.06.4-.28.39-.52l-.84-9.93 6.89-1.28c.44-.08.57-.64.2-.91L6.36 2.55c-.36-.27-.86.02-.86.66Z"
                                fill={cursor.color}
                                stroke="white"
                                strokeWidth="1.5"
                            />
                        </svg>

                        {/* Name Label */}
                        <div
                            className="absolute left-5 top-4 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
                            style={{
                                backgroundColor: cursor.color,
                                color: "white",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                            }}
                        >
                            {cursor.name}
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
