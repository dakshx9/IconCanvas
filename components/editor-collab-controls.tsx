"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Users, Copy, Check, LogOut, Crown, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCollaborationSafe } from "@/lib/collaboration-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface EditorCollabControlsProps {
    onOpenGroupModal: () => void
}

export function EditorCollabControls({ onOpenGroupModal }: EditorCollabControlsProps) {
    const collab = useCollaborationSafe()
    const [copied, setCopied] = useState(false)

    const session = collab?.session
    const currentMember = collab?.currentMember
    const isConnected = collab?.isConnected || false

    const copyCode = () => {
        if (session?.code) {
            navigator.clipboard.writeText(session.code)
            setCopied(true)
            toast.success("Code copied!")
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleLeave = () => {
        collab?.leaveGroup()
        toast.success("Left the group")
    }

    // Not connected - show join button
    if (!isConnected) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={onOpenGroupModal}
                className="h-8 gap-1.5 text-xs bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
            >
                <Users className="w-3.5 h-3.5" />
                <span>Collaborate</span>
            </Button>
        )
    }

    // Connected - show group info
    return (
        <div className="flex items-center gap-2">
            {/* Member Avatars */}
            <div className="flex -space-x-2">
                {session?.members.slice(0, 4).map(m => (
                    <motion.div
                        key={m.id}
                        initial={{ scale: 0. }}
                        animate={{ scale: 1 }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 border-neutral-900"
                        style={{ backgroundColor: m.color }}
                        title={m.name}
                    >
                        {m.avatarEmoji}
                    </motion.div>
                ))}
                {(session?.members.length || 0) > 4 && (
                    <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] text-white border-2 border-neutral-900">
                        +{(session?.members.length || 0) - 4}
                    </div>
                )}
            </div>

            {/* Team Code Badge */}
            <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 hover:border-primary/50 transition-colors"
            >
                <span className="text-xs font-mono tracking-widest text-primary">{session?.code}</span>
                {copied ? (
                    <Check className="w-3 h-3 text-green-400" />
                ) : (
                    <Copy className="w-3 h-3 text-neutral-400" />
                )}
            </button>

            {/* More Options */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-7 h-7">
                        <Settings className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        {session?.name}
                    </div>
                    <DropdownMenuSeparator />
                    {session?.members.map(m => (
                        <div
                            key={m.id}
                            className="flex items-center gap-2 px-2 py-1.5 text-xs"
                        >
                            <span
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                                style={{ backgroundColor: m.color }}
                            >
                                {m.avatarEmoji}
                            </span>
                            <span className="flex-1 truncate">{m.name}</span>
                            {m.isHost && <Crown className="w-3 h-3 text-yellow-500" />}
                            {m.id === currentMember?.id && (
                                <span className="text-[9px] text-muted-foreground">(you)</span>
                            )}
                        </div>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleLeave}
                        className="text-red-400 focus:text-red-400 focus:bg-red-900/20"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Leave Group
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
