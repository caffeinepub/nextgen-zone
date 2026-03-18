import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bot,
  ChevronRight,
  Coins,
  Crown,
  Gamepad2,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  Trophy,
  User,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile, useIsAdmin } from "../hooks/useQueries";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const { data: profile } = useCallerProfile();
  const { data: isAdmin } = useIsAdmin();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { language, toggleLanguage, t } = useLanguage();

  const isAuthenticated = !!identity;

  const navItems = [
    { path: "/", label: t("nav.home"), icon: Home, ocid: "nav.home.link" },
    {
      path: "/ai-tools",
      label: t("nav.ai_tools"),
      icon: Bot,
      ocid: "nav.ai_tools.link",
    },
    {
      path: "/chat",
      label: t("nav.chat"),
      icon: MessageSquare,
      ocid: "nav.chat.link",
    },
    {
      path: "/games",
      label: t("nav.games"),
      icon: Gamepad2,
      ocid: "nav.games.link",
    },
    {
      path: "/leaderboard",
      label: t("nav.leaderboard"),
      icon: Trophy,
      ocid: "nav.leaderboard.link",
    },
    {
      path: "/profile",
      label: t("nav.profile"),
      icon: User,
      ocid: "nav.profile.link",
    },
    {
      path: "/vip",
      label: t("nav.vip"),
      icon: Crown,
      ocid: "nav.vip.link",
      special: "vip",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-border/50 glass-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-neon-blue">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl gradient-text hidden sm:block">
                NextGen Zone
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-ocid={item.ocid}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary/20 text-primary neon-border-blue"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    } ${item.special === "vip" ? "text-neon-gold hover:text-neon-gold" : ""}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to="/admin"
                  data-ocid="nav.admin.link"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPath === "/admin"
                      ? "bg-destructive/20 text-destructive neon-border-purple"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {t("nav.admin")}
                </Link>
              )}
            </nav>

            {/* Auth Area */}
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <button
                type="button"
                onClick={toggleLanguage}
                data-ocid="lang.toggle"
                className="flex items-center gap-0.5 rounded-full border border-border/50 bg-secondary/50 overflow-hidden text-xs font-bold transition-all hover:border-primary/40"
                title={
                  language === "en" ? "Switch to Hindi" : "Switch to English"
                }
              >
                <span
                  className={`px-2 py-1.5 transition-all ${
                    language === "en"
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  EN
                </span>
                <span
                  className={`px-2 py-1.5 transition-all ${
                    language === "hi"
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  हि
                </span>
              </button>

              {isInitializing ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-secondary transition-colors"
                    >
                      <Avatar className="w-8 h-8 border border-primary/40">
                        <AvatarImage src={profile?.avatarUrl} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {profile?.username?.[0]?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:block text-left">
                        <p className="text-xs font-semibold leading-none">
                          {profile?.username ?? "User"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Lv.{profile?.level?.toString() ?? "1"}
                        </p>
                      </div>
                      {profile?.isVIP && (
                        <Badge className="bg-neon-gold/20 text-neon-gold border-neon-gold/40 text-xs hidden sm:flex">
                          VIP
                        </Badge>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 glass-card border-border/50"
                  >
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t("nav.my_profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/coins" className="flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        {t("nav.coins")}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 text-accent"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            {t("nav.admin_panel")}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={clear}
                      data-ocid="auth.logout.button"
                      className="text-destructive focus:text-destructive flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("auth.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={login}
                  disabled={isLoggingIn}
                  data-ocid="auth.login.button"
                  className="neon-btn text-primary font-semibold text-sm"
                  variant="outline"
                >
                  {isLoggingIn ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      {t("auth.connecting")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      {t("auth.login")}
                    </span>
                  )}
                </Button>
              )}

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed inset-0 top-16 z-40 glass-card border-b border-border/50"
          >
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-ocid={item.ocid}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    } ${item.special === "vip" ? "text-neon-gold" : ""}`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to="/admin"
                  data-ocid="nav.admin.link"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-lg font-medium text-accent hover:bg-secondary transition-all"
                >
                  <span className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5" />
                    {t("nav.admin_panel")}
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>
              )}
              <Link
                to="/coins"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-lg font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <span className="flex items-center gap-3">
                  <Coins className="w-5 h-5" />
                  {t("nav.coins")}
                </span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-display font-semibold gradient-text">
                NextGen Zone
              </span>
            </div>
            <p>
              © {new Date().getFullYear()}. Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
