"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCollaboration } from "@/lib/collaboration-context"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface GroupChatProps {
    isMobile?: boolean
}

export function GroupChat({ isMobile }: GroupChatProps) {
    const { isConnected, messages, sendMessage, session, currentMember } = useCollaboration()
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [unreadCount, setUnreadCount] = useState(0)
    const scrollRef = useRef<HTMLDivElement>(null)
    const lastMessageCount = useRef(messages.length)

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
    }, [messages, isOpen])

    // Clear unread when opening
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0)
        }
    }, [isOpen])

    const handleSend = () => {
        if (!inputValue.trim()) return
        sendMessage(inputValue)
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

    if (!isConnected) return null

    // Mobile: Bottom sheet style
    if (isMobile) {
        return (
            <>
                {/* Toggle Button */}
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center",
                        "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                    )}
                    whileTap={{ scale: 0.95 }}
                >
                    <MessageCircle className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </motion.button>

                {/* Chat Sheet */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-[100] h-[60vh] bg-background border-t border-border rounded-t-2xl shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-3 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="w-4 h-4 text-primary" />
                                    <span className="font-medium text-sm">Group Chat</span>
                                    <span className="text-xs text-muted-foreground">
                                        ({session?.members.length} online)
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setIsOpen(false)}>
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Messages */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                                {messages.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground py-8">
                                        No messages yet. Say hi! 👋
                                    </p>
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
                                                    "max-w-[80%] rounded-2xl px-3 py-2",
                                                    msg.memberId === currentMember?.id
                                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                        : "bg-secondary rounded-tl-sm"
                                                )}
                                            >
                                                {msg.memberId !== currentMember?.id && (
                                                    <p className="text-[10px] font-medium mb-0.5" style={{ color: msg.memberColor }}>
                                                        {msg.memberName}
                                                    </p>
                                                )}
                                                <p className="text-sm">{msg.text}</p>
                                                <p className={cn(
                                                    "text-[9px] mt-1",
                                                    msg.memberId === currentMember?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                                                )}>
                                                    {formatTime(msg.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Input */}
                            <div className="p-3 border-t border-border flex gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1"
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

    // Desktop: Sidebar style
    return (
        <div className="fixed right-0 top-12 bottom-0 z-40 flex">
            {/* Toggle Tab */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-fit self-center -mr-px px-1.5 py-3 rounded-l-lg border border-r-0 border-border",
                    "bg-card hover:bg-muted transition-colors"
                )}
            >
                <div className="flex flex-col items-center gap-1">
                    {isOpen ? <ChevronDown className="w-4 h-4 rotate-90" /> : <ChevronUp className="w-4 h-4 rotate-90" />}
                    <MessageCircle className="w-4 h-4 text-primary" />
                    {unreadCount > 0 && !isOpen && (
                        <span className="w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </div>
            </button>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="h-full bg-card border-l border-border shadow-xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-primary" />
                                <span className="font-medium text-sm">Group Chat</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {session?.members.map(m => (
                                    <span
                                        key={m.id}
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                        style={{ backgroundColor: m.color + "30" }}
                                        title={m.name}
                                    >
                                        {m.avatarEmoji}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                            {messages.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-8">
                                    No messages yet. Say hi! 👋
                                </p>
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
                                                    : "bg-secondary rounded-tl-sm"
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
                                                msg.memberId === currentMember?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                                            )}>
                                                {formatTime(msg.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-border flex gap-2 shrink-0">
                            <Input
                                placeholder="Type a message..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1"
                            />
                            <Button size="icon" onClick={handleSend} disabled={!inputValue.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
