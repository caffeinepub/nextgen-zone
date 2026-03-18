import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clock,
  Crosshair,
  RotateCcw,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GameId } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSubmitScore } from "../hooks/useQueries";

const CANVAS_W = 600;
const CANVAS_H = 480;
const GAME_DURATION = 30;

interface GameTarget {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  shrinkRate: number;
  color: string;
  spawnTime: number;
  hit: boolean;
  exploding: boolean;
  explodeFrame: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

type GameState = "idle" | "playing" | "finished";

let targetIdCounter = 0;
const TARGET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

export default function ShootingGamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { identity } = useInternetIdentity();
  const submitScore = useSubmitScore();

  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [finalScore, setFinalScore] = useState(0);
  const scoreSubmittedRef = useRef(false);

  const gameStateRef = useRef<GameState>("idle");
  const scoreRef = useRef(0);
  const targetsRef = useRef<GameTarget[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const frameRef = useRef(0);
  const startTimeRef = useRef(0);
  const missCountRef = useRef(0);

  const spawnTarget = useCallback(() => {
    const radius = 20 + Math.random() * 30;
    const x = radius + Math.random() * (CANVAS_W - radius * 2);
    const y = radius + Math.random() * (CANVAS_H - radius * 2);
    const shrinkRate = 0.12 + Math.random() * 0.15;
    const color =
      TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)];
    targetsRef.current.push({
      id: ++targetIdCounter,
      x,
      y,
      radius,
      maxRadius: radius,
      shrinkRate,
      color,
      spawnTime: Date.now(),
      hit: false,
      exploding: false,
      explodeFrame: 0,
    });
  }, []);

  const createParticles = useCallback(
    (x: number, y: number, color: string, count = 12) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 2 + Math.random() * 4;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          size: 3 + Math.random() * 4,
        });
      }
    },
    [],
  );

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#0d0d1a";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Grid
    ctx.strokeStyle = "#ffffff08";
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    // Draw targets
    for (const t of targetsRef.current) {
      if (t.exploding) {
        // Explosion ring
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.explodeFrame * 3, 0, Math.PI * 2);
        ctx.strokeStyle = `${t.color}aa`;
        ctx.lineWidth = 2;
        ctx.stroke();
        continue;
      }
      if (t.radius <= 0) continue;

      // Outer ring (animated)
      const pulseSize = Math.sin(frameRef.current * 0.1) * 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius + 4 + pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = `${t.color}40`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Target body
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = `${t.color}30`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner circle
      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Crosshair lines
      ctx.shadowBlur = 0;
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(t.x - t.radius, t.y);
      ctx.lineTo(t.x + t.radius, t.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(t.x, t.y - t.radius);
      ctx.lineTo(t.x, t.y + t.radius);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Particles
    particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.05);
    for (const p of particlesRef.current) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.alpha *= 0.92;
      p.size *= 0.95;
    }
    ctx.globalAlpha = 1;

    // HUD
    ctx.fillStyle = "#ffffffdd";
    ctx.font = "bold 16px 'Sora', sans-serif";
    ctx.fillText(`Score: ${scoreRef.current}`, 12, 28);

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const remaining = Math.max(0, GAME_DURATION - elapsed);
    ctx.textAlign = "right";
    ctx.fillStyle = remaining <= 5 ? "#ef4444" : "#ffffffdd";
    ctx.fillText(`${Math.ceil(remaining)}s`, CANVAS_W - 12, 28);
    ctx.textAlign = "left";
  }, []);

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== "playing") return;

    frameRef.current++;

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const remaining = GAME_DURATION - elapsed;
    setTimeLeft(Math.ceil(Math.max(0, remaining)));

    if (remaining <= 0) {
      gameStateRef.current = "finished";
      setGameState("finished");
      setFinalScore(scoreRef.current);
      cancelAnimationFrame(rafRef.current);
      drawFrame();
      return;
    }

    // Spawn targets
    const spawnInterval = Math.max(30, 60 - Math.floor(scoreRef.current / 3));
    if (
      frameRef.current % spawnInterval === 0 &&
      targetsRef.current.filter((t) => !t.hit).length < 6
    ) {
      spawnTarget();
    }

    // Shrink targets
    targetsRef.current = targetsRef.current
      .map((t) => {
        if (t.hit) {
          if (t.exploding) {
            t.explodeFrame++;
            if (t.explodeFrame > 10) return null as unknown as GameTarget;
          }
          return t;
        }
        const newRadius = t.radius - t.shrinkRate;
        if (newRadius <= 0) {
          missCountRef.current++;
          return null as unknown as GameTarget;
        }
        return { ...t, radius: newRadius };
      })
      .filter(Boolean) as GameTarget[];

    drawFrame();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [drawFrame, spawnTarget]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (gameStateRef.current !== "playing") return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      let hit = false;
      targetsRef.current = targetsRef.current.map((t) => {
        if (hit || t.hit || t.exploding) return t;
        const dist = Math.hypot(mx - t.x, my - t.y);
        if (dist <= t.radius) {
          hit = true;
          scoreRef.current++;
          setScore(scoreRef.current);
          createParticles(t.x, t.y, t.color);
          return { ...t, hit: true, exploding: true, explodeFrame: 0 };
        }
        return t;
      });
    },
    [createParticles],
  );

  const startGame = useCallback(() => {
    toast.dismiss();
    scoreSubmittedRef.current = false;
    scoreRef.current = 0;
    targetsRef.current = [];
    particlesRef.current = [];
    frameRef.current = 0;
    missCountRef.current = 0;
    startTimeRef.current = Date.now();
    gameStateRef.current = "playing";
    setGameState("playing");
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setFinalScore(0);
    cancelAnimationFrame(rafRef.current);

    // Pre-spawn some targets
    spawnTarget();
    spawnTarget();
    spawnTarget();

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, spawnTarget]);

  useEffect(() => {
    if (
      gameState === "finished" &&
      finalScore > 0 &&
      identity &&
      !scoreSubmittedRef.current
    ) {
      scoreSubmittedRef.current = true;
      submitScore
        .mutateAsync({ gameId: GameId.shooting, score: BigInt(finalScore) })
        .then(() => toast.success("Score submitted!", { duration: 3000 }))
        .catch(() => toast.error("Failed to submit score"));
    }
  }, [gameState, finalScore, identity, submitScore]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/games">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center">
          <Crosshair className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl gradient-text">
            Target Strike
          </h1>
          <p className="text-muted-foreground text-sm">
            30 seconds • Click to shoot
          </p>
        </div>
        {gameState === "playing" && (
          <div className="ml-auto flex items-center gap-3">
            <Badge className="bg-primary/20 text-primary border-primary/30 font-mono flex items-center gap-1.5">
              <Target className="w-3 h-3" />
              {score}
            </Badge>
            <Badge
              className={`font-mono flex items-center gap-1.5 ${timeLeft <= 5 ? "bg-destructive/20 text-destructive border-destructive/30 animate-pulse" : "bg-secondary text-muted-foreground border-border/30"}`}
            >
              <Clock className="w-3 h-3" />
              {timeLeft}s
            </Badge>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {gameState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="glass-card neon-border-blue text-center mb-4">
              <CardContent className="py-12 px-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center mx-auto mb-6 animate-float">
                  <Crosshair className="w-10 h-10 text-white" />
                </div>
                <h2 className="font-display font-black text-3xl mb-3">
                  Target Strike
                </h2>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Targets appear on screen and slowly shrink. Click them before
                  they disappear — the faster you shoot, the better!
                </p>
                <div className="flex justify-center gap-8 mb-8 text-sm">
                  <div>
                    <span className="text-muted-foreground">Time:</span>{" "}
                    <span className="font-semibold">30 seconds</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Control:</span>{" "}
                    <span className="font-semibold">Click / Tap</span>
                  </div>
                </div>
                <Button
                  onClick={startGame}
                  data-ocid="shooting.primary_button"
                  className="bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold text-lg px-10 py-6 h-auto border-0"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Shooting
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {gameState === "finished" && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="glass-card neon-border-blue text-center mb-4">
              <CardContent className="py-12 px-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-gold to-amber-500 flex items-center justify-center mx-auto mb-6 shadow-neon-gold">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <h2 className="font-display font-black text-3xl mb-2">
                  Time's Up!
                </h2>
                <p className="text-muted-foreground mb-6">Round complete</p>
                <div className="mb-8">
                  <p className="font-display font-black text-5xl gradient-text mb-1">
                    {finalScore}
                  </p>
                  <p className="text-sm text-muted-foreground">Targets Hit</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={startGame}
                    data-ocid="shooting.primary_button"
                    className="bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold border-0"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                  <Link to="/leaderboard">
                    <Button variant="outline" className="border-border/50">
                      <Trophy className="w-4 h-4 mr-2" />
                      Leaderboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div
        className={`flex justify-center ${gameState !== "playing" ? "hidden" : ""}`}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleCanvasClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              handleCanvasClick(
                e as unknown as React.MouseEvent<HTMLCanvasElement>,
              );
          }}
          tabIndex={0}
          aria-label="Shooting game canvas"
          data-ocid="shooting.canvas_target"
          className="rounded-xl border border-primary/20 shadow-neon-blue cursor-crosshair"
          style={{ maxWidth: "100%", touchAction: "none" }}
        />
      </div>
    </div>
  );
}
