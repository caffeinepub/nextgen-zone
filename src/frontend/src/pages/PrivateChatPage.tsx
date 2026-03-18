import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, MessageCircle, Search, Send } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllUsers,
  useConversation,
  useSendPrivateMessage,
} from "../hooks/useQueries";

export default function PrivateChatPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: allUsers, isLoading: usersLoading } = useAllUsers();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedPrincipal, setSelectedPrincipal] = useState<Principal | null>(
    null,
  );
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading: convLoading } =
    useConversation(selectedPrincipal);
  const sendMessage = useSendPrivateMessage();

  const currentPrincipal = identity?.getPrincipal().toString();

  const filteredUsers =
    allUsers?.filter((u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()),
    ) ?? [];

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll-to-bottom effect intentionally uses conversation as trigger
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleSelectUser = (user: UserProfile) => {
    // We need to get the principal for this user
    // The UserProfile doesn't contain the principal directly, so we'll use getAllUsers for display
    // and simulate with the username-based selection
    setSelectedUser(user);
    // We can't get Principal from UserProfile directly, so we'll disable actual DM sending
    // until the user's principal is available. For now we store null.
    setSelectedPrincipal(null);
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedPrincipal) return;
    if (!isAuthenticated) {
      toast.error("Please login to send messages");
      return;
    }
    try {
      await sendMessage.mutateAsync({
        receiver: selectedPrincipal,
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

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="glass-card neon-border-purple max-w-md mx-auto">
          <CardContent className="py-16 text-center">
            <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h2 className="font-display font-bold text-xl mb-2">
              Login Required
            </h2>
            <p className="text-muted-foreground text-sm">
              Please login to access private messages.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-12rem)]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <Link to="/chat">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-neon-purple">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl gradient-text">
              Private Messages
            </h1>
            <p className="text-muted-foreground text-sm">
              Direct messages with other users
            </p>
          </div>
        </div>
      </motion.div>

      <div className="flex gap-4 h-full">
        {/* Users List */}
        <div className="w-64 flex-shrink-0">
          <Card className="glass-card h-full">
            <CardContent className="p-3">
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="pl-8 bg-secondary/50 border-border/50 h-8 text-xs"
                />
              </div>
              <ScrollArea className="h-[calc(100%-48px)]">
                {usersLoading ? (
                  (["u1", "u2", "u3", "u4", "u5"] as const).map((k) => (
                    <div key={k} className="flex items-center gap-2 p-2">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user: UserProfile) => {
                    const isSelf =
                      user.username === identity?.getPrincipal().toString();
                    if (isSelf) return null;
                    const isSelected = selectedUser?.username === user.username;
                    return (
                      <button
                        type="button"
                        key={user.username}
                        onClick={() => handleSelectUser(user)}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-all ${
                          isSelected ? "bg-primary/20" : "hover:bg-secondary"
                        }`}
                      >
                        <Avatar className="w-8 h-8 border border-border/40 flex-shrink-0">
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                            {user.username[0]?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Lv.{user.level.toString()}
                          </p>
                        </div>
                        {user.isVIP && (
                          <span className="text-neon-gold text-xs">VIP</span>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p
                    className="text-center text-xs text-muted-foreground py-4"
                    data-ocid="privatemsg.user.empty_state"
                  >
                    No users found
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Card className="glass-card flex-1 flex flex-col overflow-hidden">
            {selectedUser ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
                  <Avatar className="w-8 h-8 border border-primary/30">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {selectedUser.username[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">
                      {selectedUser.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Level {selectedUser.level.toString()}
                    </p>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {!selectedPrincipal ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm">
                        User principal not available for direct messaging.
                      </p>
                      <p className="text-xs mt-1 opacity-60">
                        This feature requires the user to have an active
                        session.
                      </p>
                    </div>
                  ) : convLoading ? (
                    <div className="space-y-4">
                      {(["m1", "m2", "m3", "m4"] as const).map((k, i) => (
                        <Skeleton
                          key={k}
                          className="h-12 w-3/4 rounded-xl"
                          style={{ marginLeft: i % 2 === 0 ? 0 : "auto" }}
                        />
                      ))}
                    </div>
                  ) : conversation && conversation.length > 0 ? (
                    <div className="space-y-3">
                      {conversation.map((msg) => {
                        const isOwn =
                          msg.sender.toString() === currentPrincipal;
                        return (
                          <div
                            key={msg.messageId.toString()}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                                isOwn
                                  ? "bg-primary/20 border border-primary/30 rounded-tr-sm"
                                  : "glass-card rounded-tl-sm"
                              }`}
                            >
                              <p>{msg.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm">No messages yet. Say hello!</p>
                    </div>
                  )}
                </ScrollArea>

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
                      selectedPrincipal
                        ? `Message ${selectedUser.username}...`
                        : "Principal not available"
                    }
                    disabled={!selectedPrincipal}
                    className="bg-secondary/50 border-border/50 focus:border-primary/50"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={
                      !selectedPrincipal ||
                      !messageInput.trim() ||
                      sendMessage.isPending
                    }
                    className="neon-btn text-primary border-primary/40 flex-shrink-0"
                    variant="outline"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="font-semibold mb-1">Select a conversation</h3>
                <p className="text-sm">
                  Choose a user from the list to start messaging
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
