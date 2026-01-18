"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Users, Copy, Check, LogIn, Plus, Crown, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCollaboration } from "@/lib/collaboration-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface GroupModalProps {
    isOpen: boolean
    onClose: () => void
}

export function GroupModal({ isOpen, onClose }: GroupModalProps) {
    const { session, isConnected, currentMember, createGroup, joinGroup, leaveGroup } = useCollaboration()
    const [mode, setMode] = useState<"menu" | "create" | "join">("menu")
    const [groupName, setGroupName] = useState("")
    const [memberName, setMemberName] = useState("")
    const [teamCode, setTeamCode] = useState("")
    const [copied, setCopied] = useState(false)

    const handleCreateGroup = () => {
        if (!groupName.trim() || !memberName.trim()) {
            toast.error("Please fill in all fields")
            return
        }
        createGroup(groupName.trim(), memberName.trim())
        toast.success("Group created!")
        // setMode("menu") - Removed to show Connected view

    }

    const handleJoinGroup = () => {
        if (!teamCode.trim() || !memberName.trim()) {
            toast.error("Please fill in all fields")
            return
        }
        const success = joinGroup(teamCode.trim().toUpperCase(), memberName.trim())
        if (success) {
            toast.success("Joined group!")
            // Keep modal open to confirm or let user close
            // setMode("menu") // Remove this too if we want them to see the group info immediately upon joining?
            // Usually joining is fast.
            setMode("menu")
        } else {
            toast.error("Group not found. Check the code and try again.")
        }
    }

    const handleLeaveGroup = () => {
        leaveGroup()
        toast.success("Left the group")
        setMode("menu")
        setGroupName("")
        setMemberName("")
        setTeamCode("")
    }

    const copyCode = () => {
        if (session?.code) {
            navigator.clipboard.writeText(session.code)
            setCopied(true)
            toast.success("Code copied!")
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const resetAndClose = () => {
        setMode("menu")
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                >
                    <motion.div
                        className="absolute inset-0 bg-background/80 backdrop-blur-md"
                        onClick={resetAndClose}
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative z-10 w-full max-w-md"
                    >
                        <div className="glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    <h2 className="font-semibold">
                                        {isConnected ? "Group Session" : "Collaborate"}
                                    </h2>
                                </div>
                                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={resetAndClose}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                {/* Connected State - Show Session Info */}
                                {isConnected && session && currentMember && (
                                    <div className="space-y-4">
                                        {/* Session Badge */}
                                        <div className="bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl p-4 border border-primary/30">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-muted-foreground">Team Code</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 gap-1.5 text-xs"
                                                    onClick={copyCode}
                                                >
                                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    {copied ? "Copied!" : "Copy"}
                                                </Button>
                                            </div>
                                            <div className="font-mono text-2xl font-bold tracking-widest text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                                {session.code}
                                            </div>
                                            <p className="text-center text-xs text-muted-foreground mt-2">
                                                Share this code with your teammates
                                            </p>
                                        </div>

                                        {/* Group Info */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">{session.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {session.members.length} member{session.members.length !== 1 ? "s" : ""}
                                                </span>
                                            </div>

                                            {/* Member List */}
                                            <div className="bg-secondary/50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                                                {session.members.map(member => (
                                                    <div
                                                        key={member.id}
                                                        className={cn(
                                                            "flex items-center gap-2 text-sm",
                                                            member.id === currentMember.id && "font-medium"
                                                        )}
                                                    >
                                                        <span
                                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                                            style={{ backgroundColor: member.color + "30", color: member.color }}
                                                        >
                                                            {member.avatarEmoji}
                                                        </span>
                                                        <span className="flex-1">{member.name}</span>
                                                        {member.isHost && (
                                                            <Crown className="w-3 h-3 text-yellow-500" />
                                                        )}
                                                        {member.id === currentMember.id && (
                                                            <span className="text-[10px] text-muted-foreground">(you)</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Leave Button */}
                                        <Button
                                            variant="outline"
                                            className="w-full text-destructive hover:text-destructive"
                                            onClick={handleLeaveGroup}
                                        >
                                            Leave Group
                                        </Button>
                                    </div>
                                )}

                                {/* Disconnected State - Menu */}
                                {!isConnected && mode === "menu" && (
                                    <div className="space-y-3">
                                        <p className="text-sm text-muted-foreground text-center mb-4">
                                            Collaborate with your team in real-time
                                        </p>
                                        <Button
                                            className="w-full gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                                            onClick={() => setMode("create")}
                                        >
                                            <Plus className="w-4 h-4" />
                                            Create New Group
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full gap-2"
                                            onClick={() => setMode("join")}
                                        >
                                            <LogIn className="w-4 h-4" />
                                            Join with Code
                                        </Button>
                                    </div>
                                )}

                                {/* Create Group Form */}
                                {!isConnected && mode === "create" && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="groupName">Group Name</Label>
                                            <Input
                                                id="groupName"
                                                placeholder="e.g., Design Team"
                                                value={groupName}
                                                onChange={(e) => setGroupName(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="memberName">Your Display Name</Label>
                                            <Input
                                                id="memberName"
                                                placeholder="e.g., John"
                                                value={memberName}
                                                onChange={(e) => setMemberName(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" className="flex-1" onClick={() => setMode("menu")}>
                                                Back
                                            </Button>
                                            <Button
                                                className="flex-1 bg-gradient-to-r from-primary to-accent"
                                                onClick={handleCreateGroup}
                                            >
                                                Create
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Join Group Form */}
                                {!isConnected && mode === "join" && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="teamCode">Team Code</Label>
                                            <Input
                                                id="teamCode"
                                                placeholder="e.g., ABC123"
                                                value={teamCode}
                                                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                                                className="font-mono text-center tracking-widest text-lg"
                                                maxLength={6}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="joinMemberName">Your Display Name</Label>
                                            <Input
                                                id="joinMemberName"
                                                placeholder="e.g., John"
                                                value={memberName}
                                                onChange={(e) => setMemberName(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" className="flex-1" onClick={() => setMode("menu")}>
                                                Back
                                            </Button>
                                            <Button
                                                className="flex-1 bg-gradient-to-r from-primary to-accent"
                                                onClick={handleJoinGroup}
                                            >
                                                Join
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
