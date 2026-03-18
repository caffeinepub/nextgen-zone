import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Crown,
  Gamepad2,
  MessageSquare,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { usePlatformStats } from "../hooks/useQueries";

const features = [
  {
    icon: Bot,
    title: "AI Tools",
    desc: "Chat with AI, generate stories, YouTube titles, and images with cutting-edge AI.",
    color: "from-blue-500 to-cyan-400",
    glow: "shadow-neon-blue",
    path: "/ai-tools",
  },
  {
    icon: MessageSquare,
    title: "Live Chat",
    desc: "Join public rooms, chat privately, earn VIP badges and show off your status.",
    color: "from-purple-500 to-pink-400",
    glow: "shadow-neon-purple",
    path: "/chat",
  },
  {
    icon: Gamepad2,
    title: "Online Games",
    desc: "Play Quiz, Car Racing, and Shooting games. Compete on global leaderboards.",
    color: "from-green-500 to-emerald-400",
    glow: "shadow-neon-cyan",
    path: "/games",
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    desc: "Climb the ranks across all games and earn exclusive badges and rewards.",
    color: "from-amber-500 to-yellow-400",
    glow: "shadow-neon-gold",
    path: "/leaderboard",
  },
];

const highlights = [
  { icon: Crown, text: "VIP Membership with exclusive perks" },
  { icon: Star, text: "Level up system with XP rewards" },
  { icon: Users, text: "Active community of gamers & creators" },
  { icon: Zap, text: "Real-time multiplayer leaderboards" },
];

export default function HomePage() {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const isAuthenticated = !!identity;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 grid-bg">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('/assets/generated/hero-bg.dim_1600x800.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/20 to-background" />

        {/* Animated orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              The Future of Gaming & AI is Here
            </div>

            <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-8xl mb-6 leading-none tracking-tight">
              <span className="gradient-text glow-text-blue">NextGen</span>
              <br />
              <span className="text-foreground">Zone</span>
            </h1>

            <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto font-light">
              AI. Chat. Games.{" "}
              <span className="text-foreground font-semibold">All in One.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isAuthenticated ? (
                <Button
                  size="lg"
                  onClick={login}
                  disabled={isLoggingIn}
                  data-ocid="auth.login.button"
                  className="neon-btn text-primary border-primary/40 font-bold text-lg px-8 py-6 h-auto"
                  variant="outline"
                >
                  {isLoggingIn ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Get Started Free
                    </span>
                  )}
                </Button>
              ) : (
                <Link to="/games">
                  <Button
                    size="lg"
                    className="neon-btn text-primary border-primary/40 font-bold text-lg px-8 py-6 h-auto"
                    variant="outline"
                  >
                    <Gamepad2 className="w-5 h-5 mr-2" />
                    Play Games
                  </Button>
                </Link>
              )}
              <Link to="/ai-tools">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground text-lg px-8 py-6 h-auto"
                >
                  Explore AI Tools
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/30 bg-card/30 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {statsLoading ? (
              (["s1", "s2", "s3", "s4"] as const).map((k) => (
                <div key={k} className="space-y-2">
                  <Skeleton className="h-8 w-20 mx-auto" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              ))
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="font-display font-black text-3xl gradient-text">
                    {stats ? stats.totalUsers.toString() : "0"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Total Players
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="font-display font-black text-3xl gradient-text">
                    {stats ? stats.totalMessages.toString() : "0"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Messages Sent
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="font-display font-black text-3xl gradient-text">
                    {stats?.topPlayers.length ?? 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> Top Players
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="font-display font-black text-3xl gradient-text">
                    3
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Gamepad2 className="w-3.5 h-3.5" /> Active Games
                  </p>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display font-black text-4xl sm:text-5xl mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            One platform for AI creation, real-time chat, and competitive gaming
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Link to={feature.path}>
                  <Card className="glass-card hover:border-primary/40 transition-all duration-300 cursor-pointer h-full group">
                    <CardContent className="p-6">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 ${feature.glow} group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.desc}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-16 bg-card/20 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {highlights.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{item.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="glass-card neon-border-blue rounded-2xl p-12 max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
            <div className="relative">
              <Crown className="w-12 h-12 text-neon-gold mx-auto mb-4 animate-float" />
              <h2 className="font-display font-black text-3xl sm:text-4xl mb-4">
                Upgrade to <span className="text-neon-gold">VIP</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Unlock exclusive chat rooms, special badges, and early access to
                new features for just $4.99/month
              </p>
              <Link to="/vip">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold hover:from-amber-400 hover:to-yellow-300 border-0"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Get VIP Access
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
