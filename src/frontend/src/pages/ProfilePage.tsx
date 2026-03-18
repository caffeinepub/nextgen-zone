import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Crown,
  Edit3,
  Lock,
  Save,
  ShieldCheck,
  Star,
  Trophy,
  User,
  X,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge as BadgeEnum, UserRole } from "../backend.d";
import type { UserProfile } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerProfile, useSaveProfile } from "../hooks/useQueries";

const BADGE_CONFIG: Record<
  BadgeEnum,
  { label: string; icon: typeof Crown; color: string; bg: string }
> = {
  [BadgeEnum.vip]: {
    label: "VIP",
    icon: Crown,
    color: "text-neon-gold",
    bg: "bg-neon-gold/20 border-neon-gold/40",
  },
  [BadgeEnum.admin]: {
    label: "Admin",
    icon: ShieldCheck,
    color: "text-accent",
    bg: "bg-accent/20 border-accent/40",
  },
  [BadgeEnum.highScore]: {
    label: "High Score",
    icon: Trophy,
    color: "text-green-400",
    bg: "bg-green-400/20 border-green-400/40",
  },
  [BadgeEnum.founder]: {
    label: "Founder",
    icon: Star,
    color: "text-purple-400",
    bg: "bg-purple-400/20 border-purple-400/40",
  },
};

function xpForLevel(level: number): number {
  return level * 100;
}

function getXpProgress(profile: UserProfile): {
  currentXp: number;
  needed: number;
  pct: number;
} {
  const level = Number(profile.level);
  const xp = Number(profile.xp);
  const needed = xpForLevel(level + 1);
  const prevNeeded = xpForLevel(level);
  const currentXp = xp - prevNeeded;
  const range = needed - prevNeeded;
  const pct = Math.max(0, Math.min(100, (currentXp / range) * 100));
  return { currentXp: Math.max(0, currentXp), needed: range, pct };
}

export default function ProfilePage() {
  const { identity, login } = useInternetIdentity();
  const { data: profile, isLoading } = useCallerProfile();
  const saveProfile = useSaveProfile();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    avatarUrl: "",
  });

  const isAuthenticated = !!identity;

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    if (!formData.username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    try {
      await saveProfile.mutateAsync({
        ...profile,
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        avatarUrl: formData.avatarUrl.trim(),
      });
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to save profile");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <Card className="glass-card neon-border-blue text-center">
          <CardContent className="py-16">
            <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h2 className="font-display font-bold text-xl mb-2">
              Login Required
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Sign in to view and manage your profile
            </p>
            <Button
              onClick={login}
              data-ocid="auth.login.button"
              className="neon-btn text-primary border-primary/40 font-bold"
              variant="outline"
            >
              <Zap className="w-4 h-4 mr-2" />
              Login with Internet Identity
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
        data-ocid="profile.loading_state"
      >
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  // Onboarding state — profile is null after first login
  if (!profile) {
    return <OnboardingForm />;
  }

  const { currentXp, needed, pct } = getXpProgress(profile);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-neon-blue">
            <User className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display font-black text-3xl gradient-text">
            My Profile
          </h1>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card className="glass-card neon-border-blue">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-24 h-24 border-2 border-primary/40 shadow-neon-blue">
                  <AvatarImage src={profile.avatarUrl} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                    {profile.username[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                {profile.isVIP && (
                  <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-neon-gold/20 border border-neon-gold/60 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-neon-gold" />
                  </div>
                )}
              </div>

              <h2 className="font-display font-black text-xl mb-1">
                {profile.username}
              </h2>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {profile.bio || "No bio yet"}
              </p>

              {/* Role badge */}
              <div className="mb-4">
                {profile.role === UserRole.admin ? (
                  <Badge className="bg-accent/20 text-accent border-accent/40">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                ) : profile.isVIP ? (
                  <Badge className="bg-neon-gold/20 text-neon-gold border-neon-gold/40">
                    <Crown className="w-3 h-3 mr-1" />
                    VIP Member
                  </Badge>
                ) : (
                  <Badge className="bg-secondary text-muted-foreground border-border/40">
                    <User className="w-3 h-3 mr-1" />
                    Player
                  </Badge>
                )}
              </div>

              {/* Principal ID */}
              <p className="text-xs font-mono text-muted-foreground break-all px-2 bg-secondary/50 rounded-lg py-1.5">
                {identity?.getPrincipal().toString().slice(0, 20)}...
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats & Edit */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Level & XP */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-5 h-5 text-primary" />
                Level & Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-neon-blue">
                    <span className="font-display font-black text-lg text-white">
                      {profile.level.toString()}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold">
                      Level {profile.level.toString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Number(profile.xp)} total XP
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {currentXp} / {needed} XP
                  </p>
                  <p className="text-xs text-muted-foreground">
                    to Level {Number(profile.level) + 1}
                  </p>
                </div>
              </div>
              <Progress value={pct} className="h-2 bg-secondary" />
            </CardContent>
          </Card>

          {/* Badges */}
          {profile.badges.length > 0 && (
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="w-5 h-5 text-neon-gold" />
                  Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {profile.badges.map((badge) => {
                    const cfg = BADGE_CONFIG[badge];
                    if (!cfg) return null;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={badge}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${cfg.bg}`}
                      >
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <span className={`text-sm font-semibold ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Edit Profile */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary" />
                  Edit Profile
                </span>
                {!editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    data-ocid="profile.edit.button"
                    onClick={() => setEditing(true)}
                    className="border-border/50"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                    Edit
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="edit-username"
                      className="text-sm font-medium mb-1.5 block"
                    >
                      Username
                    </label>
                    <Input
                      id="edit-username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, username: e.target.value }))
                      }
                      placeholder="Your username"
                      className="bg-secondary/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-bio"
                      className="text-sm font-medium mb-1.5 block"
                    >
                      Bio
                    </label>
                    <Textarea
                      id="edit-bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, bio: e.target.value }))
                      }
                      placeholder="Tell others about yourself..."
                      className="bg-secondary/50 border-border/50 focus:border-primary/50 min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-avatar"
                      className="text-sm font-medium mb-1.5 block"
                    >
                      Avatar URL
                    </label>
                    <Input
                      id="edit-avatar"
                      value={formData.avatarUrl}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          avatarUrl: e.target.value,
                        }))
                      }
                      placeholder="https://example.com/avatar.jpg"
                      className="bg-secondary/50 border-border/50 focus:border-primary/50"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSave}
                      disabled={saveProfile.isPending}
                      data-ocid="profile.save.button"
                      className="neon-btn text-primary border-primary/40 font-semibold"
                      variant="outline"
                    >
                      {saveProfile.isPending ? (
                        <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          username: profile.username,
                          bio: profile.bio,
                          avatarUrl: profile.avatarUrl,
                        });
                      }}
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <span className="text-muted-foreground w-24">Username</span>
                    <span className="font-medium">{profile.username}</span>
                  </div>
                  <div className="flex">
                    <span className="text-muted-foreground w-24">Bio</span>
                    <span className="font-medium">
                      {profile.bio || (
                        <span className="italic opacity-50">Not set</span>
                      )}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-muted-foreground w-24">Status</span>
                    <span
                      className={`font-medium ${profile.isBanned ? "text-destructive" : "text-green-400"}`}
                    >
                      {profile.isBanned ? "⚠ Banned" : "Active"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function OnboardingForm() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const { identity } = useInternetIdentity();
  const saveProfile = useSaveProfile();

  const handleSubmit = async () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    try {
      await saveProfile.mutateAsync({
        username: username.trim(),
        bio: bio.trim(),
        avatarUrl: "",
        xp: BigInt(0),
        level: BigInt(1),
        badges: [],
        role: UserRole.user,
        isVIP: false,
        isBanned: false,
      });
      toast.success("Welcome to NextGen Zone!");
    } catch {
      toast.error("Failed to create profile");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="glass-card neon-border-blue">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-neon-blue animate-float">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-display font-black text-2xl mb-2">
              Welcome to NextGen Zone!
            </h2>
            <p className="text-muted-foreground text-sm">
              Set up your profile to get started
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="onboard-username"
                className="text-sm font-medium mb-1.5 block"
              >
                Username *
              </label>
              <Input
                id="onboard-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose your username"
                className="bg-secondary/50 border-border/50 focus:border-primary/50"
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="onboard-bio"
                className="text-sm font-medium mb-1.5 block"
              >
                Bio
              </label>
              <Textarea
                id="onboard-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about yourself..."
                className="bg-secondary/50 border-border/50 focus:border-primary/50 min-h-[80px]"
              />
            </div>
            <p className="text-xs text-muted-foreground font-mono bg-secondary/30 rounded-lg p-2">
              Connected as: {identity?.getPrincipal().toString().slice(0, 30)}
              ...
            </p>
            <Button
              onClick={handleSubmit}
              disabled={saveProfile.isPending}
              className="w-full bg-gradient-to-r from-primary to-accent text-white font-bold border-0"
            >
              {saveProfile.isPending ? (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Create Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
