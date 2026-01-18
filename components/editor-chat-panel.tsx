"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, ChevronLeft, ChevronRight, Users, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCollaborationSafe } from "@/lib/collaboration-context"
import { cn } from "@/lib/utils"

interface EditorChatPanelProps {
    isOpen: boolean
    onToggle: () => void
}

export function EditorChatPanel({ isOpen, onToggle }: EditorChatPanelProps) {
    const collab = useCollaborationSafe()
    const [inputValue, setInputValue] = useState("")
    const [unreadCount, setUnreadCount] = useState(0)
    const scrollRef = useRef<HTMLDivElement>(null)
    const lastMessageCount = useRef(collab?.messages.length || 0)

    const messages = collab?.messages || []
    const session = collab?.session
    const currentMember = collab?.currentMember
    const isConnected = collab?.isConnected || false

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }

        // Track unread if chat is closed
        if (!isOpen && messages.length > lastMessageCount.current) {
            setUnreadCount(prev => prev + (messages.length - lastMessageCount.current))
        }
        lastMessageCount.current = messages.length
    }, [messages.length, isOpen])

    // Clear unread when opening
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0)
        }
    }, [isOpen])

    const handleSend = () => {
        if (!inputValue.trim() || !collab) return
        collab.sendMessage(inputValue)
        setInputValue("")
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    // Toggle button (always visible when connected)
    if (!isConnected) {
        return null
    }

    return (
        <>
            {/* Toggle Tab */}
            <button
                onClick={onToggle}
                className={cn(
                    "fixed right-0 top-1/2 -translate-y-1/2 z-[50] px-1 py-4 rounded-l-lg",
                    "bg-neutral-800 hover:bg-neutral-700 border border-r-0 border-neutral-700",
                    "transition-all duration-200",
                    isOpen && "translate-x-80"
                )}
            >
                <div className="flex flex-col items-center gap-2">
                    {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    <MessageCircle className="w-4 h-4 text-primary" />
                    {unreadCount > 0 && !isOpen && (
                        <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                    <span className="text-[9px] text-neutral-400 writing-mode-vertical" style={{ writingMode: "vertical-rl" }}>
                        Chat
                    </span>
                </div>
            </button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: 320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 320, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-80 z-[45] bg-neutral-900 border-l border-neutral-800 flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-neutral-800 shrink-0">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-primary" />
                                <span className="font-medium text-sm">Team Chat</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-500">{session?.code}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-neutral-800 text-neutral-400" onClick={onToggle} title="Close Chat">
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Members Bar */}
                        <div className="flex items-center gap-2 p-2 border-b border-neutral-800 overflow-x-auto shrink-0">
                            {session?.members.map(m => (
                                <div
                                    key={m.id}
                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs shrink-0"
                                    style={{ backgroundColor: m.color + "20", color: m.color }}
                                >
                                    <span>{m.avatarEmoji}</span>
                                    <span className="max-w-[60px] truncate">{m.name}</span>
                                    {m.isHost && <Crown className="w-3 h-3 text-yellow-500" />}
                                </div>
                            ))}
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                                    <Users className="w-10 h-10 mb-2 opacity-50" />
                                    <p className="text-sm">No messages yet</p>
                                    <p className="text-[10px]">Say hi to your team! 👋</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex gap-2",
                                            msg.memberId === currentMember?.id && "flex-row-reverse"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[85%] rounded-2xl px-3 py-2",
                                                msg.memberId === currentMember?.id
                                                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                    : "bg-neutral-800 rounded-tl-sm"
                                            )}
                                        >
                                            {msg.memberId !== currentMember?.id && (
                                                <p className="text-[10px] font-medium mb-0.5" style={{ color: msg.memberColor }}>
                                                    {msg.memberName}
                                                </p>
                                            )}
                                            <p className="text-sm break-words">{msg.text}</p>
                                            <p className={cn(
                                                "text-[9px] mt-1",
                                                msg.memberId === currentMember?.id ? "text-primary-foreground/70" : "text-neutral-500"
                                            )}>
                                                {formatTime(msg.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-neutral-800 flex gap-2 shrink-0">
                            <Input
                                placeholder="Type a message..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 bg-neutral-800 border-neutral-700"
                            />
                            <Button size="icon" onClick={handleSend} disabled={!inputValue.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
