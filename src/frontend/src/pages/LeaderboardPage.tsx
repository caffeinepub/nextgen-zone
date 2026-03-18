import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Crosshair, Crown, HelpCircle, Medal, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { ReactElement } from "react";
import { GameId } from "../backend.d";
import { useLeaderboard } from "../hooks/useQueries";

const RANK_STYLES: Record<number, string> = {
  1: "text-neon-gold",
  2: "text-gray-300",
  3: "text-amber-600",
};

const RANK_ICONS: Record<number, ReactElement> = {
  1: <Trophy className="w-4 h-4 text-neon-gold" />,
  2: <Medal className="w-4 h-4 text-gray-300" />,
  3: <Medal className="w-4 h-4 text-amber-600" />,
};

function LeaderboardTable({ gameId }: { gameId: GameId }) {
  const { data: entries, isLoading } = useLeaderboard(gameId);

  const formatDate = (ts: bigint) => {
    const ms = Number(ts) / 1_000_000;
    return new Date(ms).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3" data-ocid="leaderboard.loading_state">
        {(["r1", "r2", "r3", "r4", "r5"] as const).map((k) => (
          <div key={k} className="flex items-center gap-4 p-3">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-16 h-4 ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-16" data-ocid="leaderboard.empty_state">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground text-sm">
          No scores yet. Be the first!
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/30 hover:bg-transparent">
          <TableHead className="w-12 text-center text-muted-foreground font-semibold">
            Rank
          </TableHead>
          <TableHead className="text-muted-foreground font-semibold">
            Player
          </TableHead>
          <TableHead className="text-right text-muted-foreground font-semibold">
            Score
          </TableHead>
          <TableHead className="text-right text-muted-foreground font-semibold hidden sm:table-cell">
            Date
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.slice(0, 10).map((entry, i) => {
          const rank = i + 1;
          return (
            <TableRow
              key={entry.userId.toString()}
              className={`border-border/20 transition-colors ${rank <= 3 ? "bg-primary/5" : "hover:bg-secondary/50"}`}
            >
              <TableCell className="text-center w-12">
                {rank <= 3 ? (
                  <div className="flex justify-center">{RANK_ICONS[rank]}</div>
                ) : (
                  <span className="text-sm text-muted-foreground font-mono">
                    {rank}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      rank === 1
                        ? "bg-neon-gold/20 border border-neon-gold/40 text-neon-gold"
                        : "bg-primary/10 border border-primary/20 text-primary"
                    }`}
                  >
                    {entry.username[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span
                    className={`font-semibold ${RANK_STYLES[rank] ?? "text-foreground"}`}
                  >
                    {entry.username}
                  </span>
                  {rank === 1 && (
                    <Crown className="w-3.5 h-3.5 text-neon-gold" />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={`font-mono font-bold text-sm ${rank <= 3 ? RANK_STYLES[rank] : "text-foreground"}`}
                >
                  {entry.score.toString()}
                </span>
              </TableCell>
              <TableCell className="text-right hidden sm:table-cell">
                <span className="text-xs text-muted-foreground">
                  {formatDate(entry.timestamp)}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function LeaderboardPage() {
  const [activeGame, setActiveGame] = useState<GameId>(GameId.quiz);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-neon-gold">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl gradient-text">
            Leaderboards
          </h1>
        </div>
        <p className="text-muted-foreground">
          Global rankings across all games
        </p>
      </motion.div>

      {/* Top 3 Podium for active game */}
      <PodiumSection gameId={activeGame} />

      {/* Tabs */}
      <Tabs
        value={activeGame}
        onValueChange={(v) => setActiveGame(v as GameId)}
      >
        <TabsList className="glass-card border border-border/50 p-1 mb-6 w-full">
          <TabsTrigger
            value={GameId.quiz}
            data-ocid="leaderboard.quiz.tab"
            className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Quiz</span>
          </TabsTrigger>
          <TabsTrigger
            value={GameId.racing}
            data-ocid="leaderboard.racing.tab"
            className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Car className="w-4 h-4" />
            <span className="hidden sm:inline">Racing</span>
          </TabsTrigger>
          <TabsTrigger
            value={GameId.shooting}
            data-ocid="leaderboard.shooting.tab"
            className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Crosshair className="w-4 h-4" />
            <span className="hidden sm:inline">Shooting</span>
          </TabsTrigger>
        </TabsList>

        {[GameId.quiz, GameId.racing, GameId.shooting].map((gId) => (
          <TabsContent key={gId} value={gId}>
            <Card className="glass-card">
              <CardHeader className="pb-2 border-b border-border/30">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                    Top 10
                  </Badge>
                  All-Time Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <LeaderboardTable gameId={gId} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function PodiumSection({ gameId }: { gameId: GameId }) {
  const { data: entries } = useLeaderboard(gameId);
  const top3 = entries?.slice(0, 3) ?? [];

  if (top3.length === 0) return null;

  const order = [1, 0, 2]; // 2nd, 1st, 3rd visually
  const heights = ["h-20", "h-28", "h-16"];
  const labelColors = ["text-gray-300", "text-neon-gold", "text-amber-600"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-end justify-center gap-2 mb-8 h-40"
    >
      {order.map((idx, visualPos) => {
        const entry = top3[idx];
        if (!entry) return <div key={`empty-${idx}`} className="w-24" />;
        const rank = idx + 1;
        return (
          <div
            key={rank}
            className="flex flex-col items-center gap-1 flex-1 max-w-[100px]"
          >
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                rank === 1
                  ? "border-neon-gold text-neon-gold bg-neon-gold/10"
                  : rank === 2
                    ? "border-gray-300 text-gray-300 bg-gray-300/10"
                    : "border-amber-600 text-amber-600 bg-amber-600/10"
              }`}
            >
              {entry.username[0]?.toUpperCase() ?? "?"}
            </div>
            <p className="text-xs font-semibold truncate w-full text-center">
              {entry.username}
            </p>
            <p
              className={`text-xs font-mono font-bold ${labelColors[visualPos]}`}
            >
              {entry.score.toString()}
            </p>
            <div
              className={`w-full ${heights[visualPos]} rounded-t-lg flex items-center justify-center ${
                rank === 1
                  ? "bg-neon-gold/20 border border-neon-gold/40"
                  : rank === 2
                    ? "bg-gray-400/10 border border-gray-400/30"
                    : "bg-amber-600/10 border border-amber-600/30"
              }`}
            >
              <span
                className={`font-display font-black text-2xl ${labelColors[visualPos]}`}
              >
                #{rank}
              </span>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
