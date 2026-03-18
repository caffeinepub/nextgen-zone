import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { Crown, Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { StripeSessionStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";

export default function PaymentSuccessPage() {
  const { actor } = useActor();
  const search = useSearch({ strict: false }) as { session_id?: string };
  const sessionId = search?.session_id ?? "";
  const activated = useRef(false);

  const activateMutation = useMutation({
    mutationFn: async (id: string): Promise<StripeSessionStatus> => {
      if (!actor) throw new Error("Not authenticated");
      return (actor as any).getSessionStatus(
        id,
      ) as Promise<StripeSessionStatus>;
    },
    onError: () => {
      toast.error("Could not verify your payment. Please contact support.");
    },
  });

  const { mutate: doActivate } = activateMutation;

  useEffect(() => {
    if (sessionId && actor && !activated.current) {
      activated.current = true;
      doActivate(sessionId);
    }
  }, [sessionId, actor, doActivate]);

  const isFailed = activateMutation.data?.__kind__ === "failed";

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card relative overflow-hidden border-neon-gold/30">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />
          <div className="absolute inset-0 bg-gradient-to-br from-neon-gold/5 to-amber-500/5" />
          <CardContent className="p-10 relative text-center">
            {activateMutation.isPending ||
            (!activateMutation.data && sessionId) ? (
              <div data-ocid="payment.loading_state" className="space-y-4">
                <div className="w-20 h-20 rounded-full bg-neon-gold/10 border border-neon-gold/30 flex items-center justify-center mx-auto">
                  <Loader2 className="w-10 h-10 text-neon-gold animate-spin" />
                </div>
                <h2 className="font-display font-black text-2xl">
                  Activating VIP...
                </h2>
                <p className="text-muted-foreground text-sm">
                  Please wait while we verify your payment.
                </p>
              </div>
            ) : isFailed ? (
              <div data-ocid="payment.error_state" className="space-y-4">
                <div className="w-20 h-20 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h2 className="font-display font-black text-2xl text-destructive">
                  Activation Failed
                </h2>
                <p className="text-muted-foreground text-sm">
                  {activateMutation.data?.__kind__ === "failed"
                    ? activateMutation.data.error
                    : "Something went wrong. Please contact support."}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="border-neon-gold/40 text-neon-gold hover:bg-neon-gold/10"
                >
                  <Link to="/vip">Return to VIP Page</Link>
                </Button>
              </div>
            ) : (
              <div data-ocid="payment.success_state" className="space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center mx-auto shadow-neon-gold"
                >
                  <Crown className="w-12 h-12 text-white" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="font-display font-black text-3xl text-neon-gold mb-2">
                    Welcome to VIP! 👑
                  </h1>
                  <p className="text-muted-foreground">
                    Your VIP membership has been activated. Enjoy all the
                    exclusive perks!
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-3 gap-3"
                >
                  {["VIP Badge", "Exclusive Rooms", "2× XP Boost"].map(
                    (perk) => (
                      <div
                        key={perk}
                        className="p-3 rounded-xl bg-neon-gold/10 border border-neon-gold/20 text-xs font-semibold text-neon-gold text-center"
                      >
                        {perk}
                      </div>
                    ),
                  )}
                </motion.div>

                <div className="flex flex-col gap-3">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black border-0 shadow-neon-gold hover:from-amber-400 hover:to-yellow-300"
                    data-ocid="payment.vip_link"
                  >
                    <Link to="/vip">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Explore VIP Benefits
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-border/50"
                    data-ocid="payment.home_link"
                  >
                    <Link to="/">Back to Home</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
