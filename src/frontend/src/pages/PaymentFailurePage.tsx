import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { Crown, XCircle } from "lucide-react";
import { motion } from "motion/react";

export default function PaymentFailurePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card relative overflow-hidden border-destructive/30">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-destructive to-red-400" />
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-red-500/5" />
          <CardContent
            className="p-10 relative text-center"
            data-ocid="payment.error_state"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-24 h-24 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-6"
            >
              <XCircle className="w-12 h-12 text-destructive" />
            </motion.div>

            <h1 className="font-display font-black text-3xl mb-3">
              Payment Cancelled
            </h1>
            <p className="text-muted-foreground mb-8">
              Your payment was cancelled or could not be completed. No charges
              were made. You can try again whenever you're ready.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                asChild
                className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black border-0 shadow-neon-gold hover:from-amber-400 hover:to-yellow-300"
                data-ocid="payment.retry_button"
              >
                <Link to="/vip">
                  <Crown className="w-4 h-4 mr-2" />
                  Try Again
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
