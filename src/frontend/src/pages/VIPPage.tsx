import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import {
  Check,
  Crown,
  Gamepad2,
  Loader2,
  MessageSquare,
  Shield,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import type { ShoppingItem } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useCallerProfile } from "../hooks/useQueries";

const VIP_PERKS = [
  {
    id: "badge",
    icon: Crown,
    text: "Gold VIP badge displayed in chat and profile",
  },
  {
    id: "rooms",
    icon: MessageSquare,
    text: "Access to exclusive VIP chat rooms",
  },
  {
    id: "games",
    icon: Gamepad2,
    text: "Exclusive game modes and early access",
  },
  { id: "xp", icon: Zap, text: "2× XP multiplier on all games" },
  {
    id: "leaderboard",
    icon: Star,
    text: "Featured on the VIP members leaderboard",
  },
  {
    id: "support",
    icon: Shield,
    text: "Priority support from the moderation team",
  },
  {
    id: "events",
    icon: Sparkles,
    text: "Special VIP-only events and tournaments",
  },
];

export default function VIPPage() {
  const { actor } = useActor();
  const { data: profile } = useCallerProfile();

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      const items: ShoppingItem[] = [
        {
          currency: "usd",
          productName: "VIP Membership",
          productDescription: "Monthly VIP membership with exclusive perks",
          priceInCents: 499n,
          quantity: 1n,
        },
      ];
      const successUrl = `${window.location.protocol}//${window.location.host}/payment-success`;
      const cancelUrl = `${window.location.protocol}//${window.location.host}/vip`;
      const result = (await (actor as any).createCheckoutSession(
        items,
        successUrl,
        cancelUrl,
      )) as string;
      const session = JSON.parse(result);
      if (!session.url) throw new Error("No checkout URL returned");
      return session.url as string;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (err) => {
      toast.error("Failed to start checkout", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  const isVIP = profile?.isVIP === true;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center mx-auto mb-6 shadow-neon-gold animate-float">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-display font-black text-4xl sm:text-5xl mb-4">
          Go <span className="text-neon-gold glow-text-blue">VIP</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Unlock the full NextGen Zone experience with exclusive perks and
          privileges
        </p>
      </motion.div>

      {/* Pricing Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="glass-card relative overflow-hidden border-neon-gold/30">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-gold/5 to-amber-500/5" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />

          <CardContent className="p-8 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-neon-gold" />
                  <span className="font-display font-black text-xl text-neon-gold">
                    VIP Membership
                  </span>
                  <Badge className="bg-neon-gold/20 text-neon-gold border-neon-gold/40 text-xs">
                    Monthly
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Everything you need for the ultimate experience
                </p>
              </div>
              <div className="text-center sm:text-right">
                <div className="flex items-end gap-1">
                  <span className="font-display font-black text-5xl text-neon-gold">
                    $4.99
                  </span>
                  <span className="text-muted-foreground mb-1">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground">Cancel anytime</p>
              </div>
            </div>

            {/* Perks Grid */}
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {VIP_PERKS.map((perk, i) => {
                const Icon = perk.icon;
                return (
                  <motion.div
                    key={perk.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-lg bg-neon-gold/10 border border-neon-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-neon-gold" />
                    </div>
                    <p className="text-sm">{perk.text}</p>
                  </motion.div>
                );
              })}
            </div>

            {isVIP ? (
              <div
                data-ocid="vip.success_state"
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-neon-gold/10 border border-neon-gold/30"
              >
                <Crown className="w-5 h-5 text-neon-gold" />
                <span className="font-display font-black text-lg text-neon-gold">
                  You are already VIP! 👑
                </span>
              </div>
            ) : (
              <>
                <Button
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending}
                  data-ocid="vip.subscribe.button"
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-lg py-6 h-auto border-0 shadow-neon-gold hover:from-amber-400 hover:to-yellow-300"
                >
                  {checkoutMutation.isPending ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Crown className="w-5 h-5 mr-2" />
                  )}
                  {checkoutMutation.isPending
                    ? "Redirecting to checkout..."
                    : "Subscribe to VIP — $4.99/month"}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  🔒 Secure payment via Stripe • Cancel anytime • Instant
                  activation
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-neon-gold" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                q: "How do I get my VIP badge?",
                a: "Your VIP badge is automatically applied to your account immediately after subscribing.",
              },
              {
                q: "Can I cancel my subscription?",
                a: "Yes, you can cancel anytime from your account settings. You'll retain VIP access until the end of your billing period.",
              },
              {
                q: "Are VIP rooms permanent?",
                a: "VIP rooms are available as long as you maintain an active VIP subscription.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="pb-4 border-b border-border/20 last:border-0 last:pb-0"
              >
                <div className="flex gap-2 mb-1">
                  <Check className="w-4 h-4 text-neon-gold flex-shrink-0 mt-0.5" />
                  <p className="font-semibold text-sm">{item.q}</p>
                </div>
                <p className="text-sm text-muted-foreground ml-6">{item.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
