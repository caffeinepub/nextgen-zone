import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Crown,
  Hash,
  Lock,
  MessageCircle,
  MessageSquare,
  Send,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChatRoom } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllRooms,
  usePostMessage,
  useRecentMessages,
} from "../hooks/useQueries";
import { useCallerProfile } from "../hooks/useQueries";

export default function ChatPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: profile } = useCallerProfile();
  const { data: rooms, isLoading: roomsLoading } = useAllRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<bigint | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading: messagesLoading } =
    useRecentMessages(selectedRoomId);
  const postMessage = usePostMessage();

  // Select first room by default
  useEffect(() => {
    if (rooms && rooms.length > 0 && selectedRoomId === null) {
      setSelectedRoomId(rooms[0].roomId);
    }
  }, [rooms, selectedRoomId]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll-to-bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedRoom = rooms?.find((r) => r.roomId === selectedRoomId);
  const isVIPLocked =
    selectedRoom?.isVIP &&
    !profile?.isVIP &&
    !profile?.role?.toString().includes("admin");

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedRoomId) return;
    if (!isAuthenticated) {
      toast.error("Please login to send messages");
      return;
    }
    if (isVIPLocked) {
      toast.error("This is a VIP-only room. Upgrade to access!");
      return;
    }
    try {
      await postMessage.mutateAsync({
        roomId: selectedRoomId,
        content: messageInput.trim(),
      });
      setMessageInput("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const formatTime = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-12rem)]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-neon-purple">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-black text-3xl gradient-text">
                Chat Rooms
              </h1>
              <p className="text-muted-foreground text-sm">
                Real-time community chat
              </p>
            </div>
          </div>
          <Link to="/chat/private">
            <Button
              variant="outline"
              className="neon-btn text-primary border-primary/40"
              size="sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Private Messages
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="flex gap-4 h-full">
        {/* Rooms Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Card className="glass-card h-full">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Rooms
                </span>
              </div>
              <ScrollArea className="h-[calc(100%-40px)]">
                <div className="space-y-1">
                  {roomsLoading ? (
                    (["cr1", "cr2", "cr3", "cr4"] as const).map((k) => (
                      <Skeleton key={k} className="h-10 w-full rounded-lg" />
                    ))
                  ) : rooms && rooms.length > 0 ? (
                    rooms.map((room: ChatRoom, i: number) => {
                      const isLocked =
                        room.isVIP &&
                        !profile?.isVIP &&
                        !profile?.role?.toString().includes("admin");
                      const isSelected = selectedRoomId === room.roomId;
                      return (
                        <button
                          type="button"
                          key={room.roomId.toString()}
                          onClick={() => setSelectedRoomId(room.roomId)}
                          data-ocid={`chat.room.item.${i + 1}`}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-sm ${
                            isSelected
                              ? "bg-primary/20 text-primary border border-primary/30"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                        >
                          {room.isVIP ? (
                            <Crown
                              className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-neon-gold" : "text-neon-gold/60"}`}
                            />
                          ) : (
                            <Hash className="w-4 h-4 flex-shrink-0" />
                          )}
                          <span className="flex-1 truncate">{room.name}</span>
                          {isLocked && (
                            <Lock className="w-3 h-3 flex-shrink-0 opacity-50" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div
                      className="text-center py-4 text-muted-foreground text-sm"
                      data-ocid="chat.room.empty_state"
                    >
                      No rooms yet
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Card className="glass-card flex-1 flex flex-col overflow-hidden">
            {/* Room Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
              {selectedRoom ? (
                <>
                  {selectedRoom.isVIP ? (
                    <Crown className="w-5 h-5 text-neon-gold" />
                  ) : (
                    <Hash className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <h3 className="font-semibold text-sm">
                      {selectedRoom.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedRoom.description}
                    </p>
                  </div>
                  {selectedRoom.isVIP && (
                    <Badge className="ml-auto bg-neon-gold/20 text-neon-gold border-neon-gold/30 text-xs">
                      VIP Only
                    </Badge>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a room to start chatting
                </p>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {isVIPLocked ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Crown className="w-16 h-16 text-neon-gold mb-4 animate-float" />
                  <h3 className="font-display font-bold text-xl mb-2">
                    VIP Exclusive Room
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    This room is only accessible to VIP members. Upgrade your
                    membership to join the conversation!
                  </p>
                  <Link to="/vip">
                    <Button className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold border-0">
                      <Crown className="w-4 h-4 mr-2" />
                      Get VIP Access
                    </Button>
                  </Link>
                </div>
              ) : messagesLoading ? (
                <div
                  className="space-y-4"
                  data-ocid="chat.message.loading_state"
                >
                  {(["m1", "m2", "m3", "m4", "m5"] as const).map((k) => (
                    <div key={k} className="flex gap-3">
                      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-10 w-3/4 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.messageId.toString()}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                        {msg.senderName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {msg.senderName || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        <div className="glass-card rounded-2xl rounded-tl-none px-4 py-2.5 text-sm max-w-lg">
                          {msg.content}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div
                  className="h-full flex flex-col items-center justify-center text-muted-foreground"
                  data-ocid="chat.message.empty_state"
                >
                  <Users className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border/30 flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={
                  !isAuthenticated
                    ? "Login to send messages..."
                    : isVIPLocked
                      ? "VIP only room"
                      : `Message #${selectedRoom?.name ?? "..."}`
                }
                data-ocid="chat.message.input"
                disabled={!isAuthenticated || isVIPLocked || !selectedRoomId}
                className="bg-secondary/50 border-border/50 focus:border-primary/50"
              />
              <Button
                onClick={handleSend}
                disabled={
                  !isAuthenticated ||
                  isVIPLocked ||
                  !selectedRoomId ||
                  !messageInput.trim() ||
                  postMessage.isPending
                }
                data-ocid="chat.message.submit_button"
                className="neon-btn text-primary border-primary/40 flex-shrink-0"
                variant="outline"
              >
                {postMessage.isPending ? (
                  <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
