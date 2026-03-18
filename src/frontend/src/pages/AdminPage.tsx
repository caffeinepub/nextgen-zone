import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Crown,
  Gamepad2,
  Loader2,
  Lock,
  MessageSquare,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { GameId } from "../backend.d";
import type { ChatRoom, StripeConfiguration, UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import {
  useAllRooms,
  useAllUsers,
  useAssignAdmin,
  useAssignVIP,
  useBanUser,
  useCreateRoom,
  useDeleteRoom,
  useIsAdmin,
  usePlatformStats,
  useResetLeaderboard,
  useUnbanUser,
} from "../hooks/useQueries";

export default function AdminPage() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  if (adminLoading) {
    return (
      <div
        className="max-w-6xl mx-auto px-4 py-8"
        data-ocid="admin.loading_state"
      >
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card className="glass-card text-center">
          <CardContent className="py-16">
            <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h2 className="font-display font-bold text-xl mb-2">
              Access Denied
            </h2>
            <p className="text-muted-foreground text-sm">
              You don't have admin privileges.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-neon-purple">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl gradient-text">
            Admin Panel
          </h1>
        </div>
        <p className="text-muted-foreground">
          Platform management and moderation tools
        </p>
      </motion.div>

      <Tabs defaultValue="dashboard">
        <TabsList className="glass-card border border-border/50 p-1 mb-8 flex flex-wrap gap-1 h-auto">
          <TabsTrigger
            value="dashboard"
            className="flex items-center gap-2 data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="users"
            data-ocid="admin.users.tab"
            className="flex items-center gap-2 data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
          >
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="rooms"
            data-ocid="admin.rooms.tab"
            className="flex items-center gap-2 data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
          >
            <MessageSquare className="w-4 h-4" />
            Chat Rooms
          </TabsTrigger>
          <TabsTrigger
            value="games"
            data-ocid="admin.games.tab"
            className="flex items-center gap-2 data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
          >
            <Gamepad2 className="w-4 h-4" />
            Games
          </TabsTrigger>
          <TabsTrigger
            value="stripe"
            data-ocid="admin.stripe.tab"
            className="flex items-center gap-2 data-[state=active]:bg-accent/20 data-[state=active]:text-accent"
          >
            <CreditCard className="w-4 h-4" />
            Stripe
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="rooms">
          <RoomsTab />
        </TabsContent>
        <TabsContent value="games">
          <GamesTab />
        </TabsContent>
        <TabsContent value="stripe">
          <StripeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardTab() {
  const { data: stats, isLoading } = usePlatformStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          (["stat1", "stat2", "stat3"] as const).map((k) => (
            <Skeleton key={k} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats?.totalUsers.toString() ?? "0"}
              color="from-blue-600 to-cyan-500"
            />
            <StatCard
              icon={MessageSquare}
              label="Total Messages"
              value={stats?.totalMessages.toString() ?? "0"}
              color="from-purple-600 to-pink-500"
            />
            <StatCard
              icon={Gamepad2}
              label="Active Games"
              value="3"
              color="from-green-600 to-emerald-500"
            />
          </>
        )}
      </div>

      {stats?.topPlayers && stats.topPlayers.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="w-5 h-5 text-neon-gold" />
              Top Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topPlayers.slice(0, 5).map((p, i) => (
                <div
                  key={p.userId.toString()}
                  className="flex items-center justify-between py-2 border-b border-border/20 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-5">
                      #{i + 1}
                    </span>
                    <span className="font-semibold text-sm">{p.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-secondary text-muted-foreground border-border/30 text-xs">
                      {p.gameId}
                    </Badge>
                    <span className="font-mono font-bold text-primary text-sm">
                      {p.score.toString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: { icon: typeof Users; label: string; value: string; color: string }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <p className="font-display font-black text-3xl gradient-text">
          {value}
        </p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function UsersTab() {
  const { data: users, isLoading } = useAllUsers();
  const _banUser = useBanUser();
  const _unbanUser = useUnbanUser();
  const _assignVIP = useAssignVIP();
  const _assignAdmin = useAssignAdmin();

  if (isLoading) {
    return (
      <Skeleton
        className="h-64 w-full rounded-xl"
        data-ocid="admin.users.loading_state"
      />
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-5 h-5 text-accent" />
          All Users ({users?.length ?? 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!users || users.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="admin.users.empty_state"
          >
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No users registered yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30">
                  <TableHead>User</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: UserProfile, i: number) => (
                  <TableRow
                    key={user.username}
                    className="border-border/20 hover:bg-secondary/30"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                          {user.username[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {user.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.xp.toString()} XP
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                        Lv.{user.level.toString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.isBanned && (
                          <Badge variant="destructive" className="text-xs">
                            Banned
                          </Badge>
                        )}
                        {user.isVIP && (
                          <Badge className="bg-neon-gold/20 text-neon-gold border-neon-gold/30 text-xs">
                            VIP
                          </Badge>
                        )}
                        {user.role === "admin" && (
                          <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          data-ocid={`admin.user.ban.button.${i + 1}`}
                          onClick={() =>
                            toast.info("Ban action requires user principal")
                          }
                          title={user.isBanned ? "Unban user" : "Ban user"}
                        >
                          {user.isBanned ? (
                            <UserCheck className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <UserX className="w-3.5 h-3.5 text-destructive" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          data-ocid={`admin.user.vip.button.${i + 1}`}
                          onClick={() =>
                            toast.info("VIP action requires user principal")
                          }
                          title="Give VIP"
                        >
                          <Crown className="w-3.5 h-3.5 text-neon-gold" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            toast.info("Admin action requires user principal")
                          }
                          title="Make Admin"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RoomsTab() {
  const { data: rooms, isLoading } = useAllRooms();
  const createRoom = useCreateRoom();
  const deleteRoom = useDeleteRoom();
  const [roomName, setRoomName] = useState("");
  const [roomDesc, setRoomDesc] = useState("");
  const [isVIP, setIsVIP] = useState(false);

  const handleCreate = async () => {
    if (!roomName.trim()) {
      toast.error("Room name required");
      return;
    }
    try {
      await createRoom.mutateAsync({
        name: roomName.trim(),
        description: roomDesc.trim(),
        isVIP,
      });
      toast.success("Room created!");
      setRoomName("");
      setRoomDesc("");
      setIsVIP(false);
    } catch {
      toast.error("Failed to create room");
    }
  };

  const handleDelete = async (roomId: bigint) => {
    try {
      await deleteRoom.mutateAsync(roomId);
      toast.success("Room deleted");
    } catch {
      toast.error("Failed to delete room");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="w-5 h-5 text-accent" />
            Create New Room
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="room-name"
                className="text-sm font-medium mb-1.5 block"
              >
                Room Name
              </label>
              <Input
                id="room-name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., Gaming Lounge"
                className="bg-secondary/50 border-border/50"
              />
            </div>
            <div>
              <label
                htmlFor="room-desc"
                className="text-sm font-medium mb-1.5 block"
              >
                Description
              </label>
              <Input
                id="room-desc"
                value={roomDesc}
                onChange={(e) => setRoomDesc(e.target.value)}
                placeholder="Room description..."
                className="bg-secondary/50 border-border/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={isVIP}
              onCheckedChange={setIsVIP}
              id="vip-toggle"
            />
            <label
              htmlFor="vip-toggle"
              className="text-sm cursor-pointer flex items-center gap-1.5"
            >
              <Crown className="w-4 h-4 text-neon-gold" />
              VIP Only Room
            </label>
          </div>
          <Button
            onClick={handleCreate}
            disabled={createRoom.isPending}
            className="neon-btn text-accent border-accent/40 font-semibold"
            variant="outline"
          >
            {createRoom.isPending ? (
              <span className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Room
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent" />
            All Rooms ({rooms?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {(["r1", "r2", "r3"] as const).map((k) => (
                <Skeleton key={k} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : rooms && rooms.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border/30">
                  <TableHead>Room</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room: ChatRoom) => (
                  <TableRow
                    key={room.roomId.toString()}
                    className="border-border/20"
                  >
                    <TableCell>
                      <p className="font-semibold text-sm">{room.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {room.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      {room.isVIP ? (
                        <Badge className="bg-neon-gold/20 text-neon-gold border-neon-gold/30 text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          VIP
                        </Badge>
                      ) : (
                        <Badge className="bg-secondary text-muted-foreground border-border/30 text-xs">
                          Public
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDelete(room.roomId)}
                        disabled={deleteRoom.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="admin.rooms.empty_state"
            >
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No rooms yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GamesTab() {
  const resetLeaderboard = useResetLeaderboard();

  const games = [
    {
      id: GameId.quiz,
      name: "Quiz Master",
      icon: "❓",
      color: "from-blue-600 to-cyan-500",
    },
    {
      id: GameId.racing,
      name: "Turbo Rush",
      icon: "🚗",
      color: "from-green-600 to-emerald-500",
    },
    {
      id: GameId.shooting,
      name: "Target Strike",
      icon: "🎯",
      color: "from-red-600 to-orange-500",
    },
  ];

  const handleReset = async (gameId: GameId, gameName: string) => {
    if (!confirm(`Reset leaderboard for ${gameName}? This cannot be undone.`))
      return;
    try {
      await resetLeaderboard.mutateAsync(gameId);
      toast.success(`${gameName} leaderboard reset!`);
    } catch {
      toast.error("Failed to reset leaderboard");
    }
  };

  return (
    <div className="grid sm:grid-cols-3 gap-6">
      {games.map((game) => (
        <Card key={game.id} className="glass-card">
          <CardContent className="p-6 text-center">
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center mx-auto mb-4 text-2xl`}
            >
              {game.icon}
            </div>
            <h3 className="font-display font-bold text-lg mb-4">{game.name}</h3>
            <Button
              variant="outline"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => handleReset(game.id, game.name)}
              disabled={resetLeaderboard.isPending}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Leaderboard
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StripeTab() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const { data: isConfigured, isLoading } = useQuery({
    queryKey: ["stripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return (actor as any).isStripeConfigured() as Promise<boolean>;
    },
    enabled: !!actor,
  });

  const [secretKey, setSecretKey] = useState("");
  const [countries, setCountries] = useState("US,CA,GB,AU");

  const configureMutation = useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error("Not authenticated");
      return (actor as any).setStripeConfiguration(config) as Promise<void>;
    },
    onSuccess: () => {
      toast.success("Stripe configured successfully!");
      setSecretKey("");
      void queryClient.invalidateQueries({ queryKey: ["stripeConfigured"] });
    },
    onError: (err) => {
      toast.error("Failed to configure Stripe", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim()) {
      toast.error("Secret key is required");
      return;
    }
    const allowedCountries = countries
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    configureMutation.mutate({ secretKey: secretKey.trim(), allowedCountries });
  };

  return (
    <div className="max-w-2xl">
      <Card className="glass-card relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="w-5 h-5 text-accent" />
            Stripe Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3" data-ocid="admin.stripe.loading_state">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : isConfigured ? (
            <div
              className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30 mb-6"
              data-ocid="admin.stripe.success_state"
            >
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-400">
                  Stripe is configured
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  VIP payments are active. You can update the configuration by
                  providing new credentials below.
                </p>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-6"
              data-ocid="admin.stripe.error_state"
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-300">
                Stripe is not configured. VIP payments are disabled.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="stripe-secret-key">Stripe Secret Key</Label>
              <Input
                id="stripe-secret-key"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_live_..."
                className="bg-secondary/50 border-border/50 font-mono text-sm"
                data-ocid="admin.stripe.input"
              />
              <p className="text-xs text-muted-foreground">
                Find this in your Stripe Dashboard → Developers → API Keys
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stripe-countries">Allowed Countries</Label>
              <Input
                id="stripe-countries"
                value={countries}
                onChange={(e) => setCountries(e.target.value)}
                placeholder="US,CA,GB,AU"
                className="bg-secondary/50 border-border/50 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated ISO country codes (e.g., US,CA,GB)
              </p>
            </div>

            <Button
              type="submit"
              disabled={configureMutation.isPending}
              className="neon-btn text-accent border-accent/40 font-semibold"
              variant="outline"
              data-ocid="admin.stripe.submit_button"
            >
              {configureMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              {isConfigured
                ? "Update Stripe Configuration"
                : "Save Stripe Configuration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
