import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Heart, Package, Star, Zap } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

const COIN_PACKAGES = [
  {
    coins: 100,
    price: "$0.99",
    badge: "",
    description: "Perfect for trying out premium features",
    icon: "🪙",
    popular: false,
  },
  {
    coins: 500,
    price: "$3.99",
    badge: "Most Popular",
    description: "Great value for regular players",
    icon: "💎",
    popular: true,
  },
  {
    coins: 2000,
    price: "$9.99",
    badge: "Best Value",
    description: "Maximum coins for power users",
    icon: "👑",
    popular: false,
  },
];

const DONATION_AMOUNTS = [2, 5, 10, 25];

export default function CoinsPage() {
  const handleBuy = (coins: number, price: string) => {
    toast.info("Coin purchases coming soon!", {
      description: `${coins} coins for ${price} — payment processing is being set up.`,
      duration: 4000,
    });
  };

  const handleDonate = (amount: number) => {
    toast.info("Thank you for your generosity!", {
      description: `$${amount} donation — payment processing is coming soon.`,
      duration: 4000,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-neon-blue animate-float">
          <Coins className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-display font-black text-4xl sm:text-5xl mb-4">
          <span className="gradient-text">Coins</span> & Donations
        </h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          Support the platform and unlock exclusive in-game perks with NextGen
          Coins
        </p>
      </motion.div>

      {/* Coin Packages */}
      <section className="mb-12">
        <h2 className="font-display font-black text-2xl mb-6 flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          Coin Packages
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {COIN_PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.coins}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card
                className={`glass-card h-full relative overflow-hidden transition-all duration-300 ${
                  pkg.popular
                    ? "neon-border-blue border-primary/40"
                    : "hover:border-border/60"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent" />
                )}
                {pkg.badge && (
                  <div className="absolute top-3 right-3">
                    <Badge
                      className={`text-xs ${
                        pkg.badge === "Most Popular"
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-neon-gold/20 text-neon-gold border-neon-gold/30"
                      }`}
                    >
                      <Star className="w-2.5 h-2.5 mr-1" />
                      {pkg.badge}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{pkg.icon}</div>
                  <p className="font-display font-black text-3xl gradient-text mb-1">
                    {pkg.coins.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    NextGen Coins
                  </p>
                  <p className="font-display font-black text-2xl mb-2">
                    {pkg.price}
                  </p>
                  <p className="text-xs text-muted-foreground mb-6">
                    {pkg.description}
                  </p>
                  <Button
                    onClick={() => handleBuy(pkg.coins, pkg.price)}
                    className={`w-full font-bold border-0 ${
                      pkg.popular
                        ? "bg-gradient-to-r from-primary to-accent text-white"
                        : "neon-btn text-primary border-primary/30"
                    }`}
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Donations */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="font-display font-black text-2xl mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-400" />
          Support Us
        </h2>
        <Card className="glass-card neon-border-purple">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
              Make a Donation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-6 max-w-lg">
              Your donations help keep NextGen Zone running, pay for server
              costs, and fund new feature development. Every contribution is
              deeply appreciated! 💙
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              {DONATION_AMOUNTS.map((amount) => (
                <motion.button
                  key={amount}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDonate(amount)}
                  className="glass-card neon-border-blue px-6 py-3 rounded-xl font-display font-bold text-primary hover:bg-primary/10 transition-all"
                >
                  ${amount}
                </motion.button>
              ))}
            </div>
            <Button
              onClick={() => handleDonate(10)}
              className="neon-btn text-pink-400 border-pink-400/40 font-semibold"
              variant="outline"
            >
              <Heart className="w-4 h-4 mr-2 fill-pink-400 text-pink-400" />
              Donate
            </Button>
          </CardContent>
        </Card>
      </motion.section>

      {/* What coins do */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-12"
      >
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              What Can I Do With Coins?
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                "Unlock special avatar frames and profile decorations",
                "Purchase extra lives in games",
                "Send coin tips to other players in chat",
                "Enter exclusive coin-entry tournaments",
                "Boost your leaderboard score visibility",
                "Unlock hidden game levels and challenges",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Coins className="w-3 h-3 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
