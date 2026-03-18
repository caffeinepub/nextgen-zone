import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Car,
  Crosshair,
  Gamepad2,
  HelpCircle,
  Play,
  Trophy,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { GameId } from "../backend.d";
import { useLeaderboard } from "../hooks/useQueries";

const games = [
  {
    id: GameId.quiz,
    title: "Quiz Master",
    desc: "Test your knowledge across 10 challenging trivia questions. Race against the clock for maximum points!",
    icon: HelpCircle,
    color: "from-blue-600 to-cyan-500",
    glow: "shadow-neon-blue",
    path: "/games/quiz",
    badge: "Knowledge",
    xpReward: "Up to 500 XP",
  },
  {
    id: GameId.racing,
    title: "Turbo Rush",
    desc: "Navigate your car through intense traffic in this adrenaline-pumping racing game. How far can you go?",
    icon: Car,
    color: "from-green-600 to-emerald-500",
    glow: "shadow-neon-cyan",
    path: "/games/racing",
    badge: "Racing",
    xpReward: "Distance Score",
  },
  {
    id: GameId.shooting,
    title: "Target Strike",
    desc: "Sharpen your aim and reflexes. Shoot as many targets as possible within 30 seconds!",
    icon: Crosshair,
    color: "from-red-600 to-orange-500",
    glow: "shadow-[0_0_20px_oklch(0.6_0.22_20/0.5)]",
    path: "/games/shooting",
    badge: "Shooting",
    xpReward: "Target Score",
  },
];

function GameTopScore({ gameId }: { gameId: GameId }) {
  const { data: leaderboard, isLoading } = useLeaderboard(gameId);
  if (isLoading) return <Skeleton className="h-4 w-20" />;
  const top = leaderboard?.[0];
  if (!top)
    return <span className="text-xs text-muted-foreground">No scores yet</span>;
  return (
    <span className="text-xs text-neon-gold font-semibold">
      🏆 {top.username}: {top.score.toString()}
    </span>
  );
}

export default function GamesHubPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-neon-cyan">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl gradient-text">
            Games Hub
          </h1>
        </div>
        <p className="text-muted-foreground">
          Play, compete, and climb the global leaderboards
        </p>
      </motion.div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Active Games", value: "3", icon: Gamepad2 },
          { label: "Leaderboards", value: "3", icon: Trophy },
          { label: "XP Available", value: "1500+", icon: Zap },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card text-center py-4">
                <CardContent className="p-0">
                  <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="font-display font-black text-2xl gradient-text">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Game Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game, i) => {
          const Icon = game.icon;
          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
            >
              <Card className="glass-card hover:border-primary/40 transition-all duration-300 overflow-hidden h-full group">
                {/* Game Card Header */}
                <div
                  className={`h-32 bg-gradient-to-br ${game.color} relative flex items-center justify-center`}
                >
                  <div className="absolute inset-0 opacity-20 grid-bg" />
                  <Icon className="w-16 h-16 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                  <Badge className="absolute top-3 right-3 bg-black/30 text-white border-white/20 text-xs backdrop-blur-sm">
                    {game.badge}
                  </Badge>
                </div>

                <CardContent className="p-6">
                  <div className="mb-3">
                    <h3 className="font-display font-black text-xl mb-1.5 group-hover:text-primary transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {game.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Top Score
                      </p>
                      <GameTopScore gameId={game.id} />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Reward
                      </p>
                      <span className="text-xs text-primary font-semibold flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {game.xpReward}
                      </span>
                    </div>
                  </div>

                  <Link to={game.path}>
                    <Button
                      className={`w-full bg-gradient-to-r ${game.color} text-white font-bold border-0 hover:opacity-90 transition-opacity ${game.glow}`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Leaderboard CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mt-12 text-center"
      >
        <Card className="glass-card neon-border-blue max-w-xl mx-auto">
          <CardContent className="py-8">
            <Trophy className="w-12 h-12 text-neon-gold mx-auto mb-3 animate-float" />
            <h3 className="font-display font-black text-2xl mb-2">
              Check the Leaderboards
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              See where you rank against the best players across all games
            </p>
            <Link to="/leaderboard">
              <Button
                className="neon-btn text-primary border-primary/40 font-semibold"
                variant="outline"
              >
                <Trophy className="w-4 h-4 mr-2" />
                View Leaderboards
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
