import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Car, Heart, RotateCcw, Trophy, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GameId } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSubmitScore } from "../hooks/useQueries";

const CANVAS_W = 400;
const CANVAS_H = 600;
const LANE_W = CANVAS_W / 4;
const ROAD_X = 0;
const ROAD_W = CANVAS_W;
const PLAYER_W = 40;
const PLAYER_H = 70;
const ENEMY_W = 38;
const ENEMY_H = 68;
const ENEMY_SPEED_BASE = 4;
const LANE_CENTERS = [LANE_W * 0.5, LANE_W * 1.5, LANE_W * 2.5, LANE_W * 3.5];

interface EnemyCar {
  id: number;
  x: number;
  y: number;
  speed: number;
  color: string;
}

type GameState = "idle" | "playing" | "gameover";

let enemyIdCounter = 0;
const ENEMY_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
];

export default function RacingGamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { identity } = useInternetIdentity();
  const submitScore = useSubmitScore();

  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [finalScore, setFinalScore] = useState(0);
  const scoreSubmittedRef = useRef(false);

  // Game state refs (for use inside rAF)
  const gameStateRef = useRef<GameState>("idle");
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const playerXRef = useRef(CANVAS_W / 2 - PLAYER_W / 2);
  const enemiesRef = useRef<EnemyCar[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const roadOffsetRef = useRef(0);
  const frameRef = useRef(0);
  const invincibleRef = useRef(false);
  const invincibleTimerRef = useRef(0);
  const touchIntervalRef = useRef<{
    left: ReturnType<typeof setInterval> | undefined;
    right: ReturnType<typeof setInterval> | undefined;
  }>({ left: undefined, right: undefined });

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background - asphalt
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Road
    ctx.fillStyle = "#2d3142";
    ctx.fillRect(ROAD_X, 0, ROAD_W, CANVAS_H);

    // Road edge lines
    ctx.strokeStyle = "#ffffff20";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ROAD_X, 0);
    ctx.lineTo(ROAD_X, CANVAS_H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ROAD_X + ROAD_W, 0);
    ctx.lineTo(ROAD_X + ROAD_W, CANVAS_H);
    ctx.stroke();

    // Lane dividers
    roadOffsetRef.current = (roadOffsetRef.current + 6) % 80;
    ctx.setLineDash([40, 40]);
    ctx.strokeStyle = "#ffffff30";
    ctx.lineWidth = 2;
    for (let lane = 1; lane < 4; lane++) {
      ctx.beginPath();
      ctx.moveTo(lane * LANE_W, roadOffsetRef.current - 80);
      ctx.lineTo(lane * LANE_W, CANVAS_H + roadOffsetRef.current);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Enemies
    for (const enemy of enemiesRef.current) {
      // Car body
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.roundRect(enemy.x, enemy.y, ENEMY_W, ENEMY_H, 8);
      ctx.fill();

      // Windshield
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#00000060";
      ctx.fillRect(enemy.x + 6, enemy.y + 12, ENEMY_W - 12, 16);

      // Tires
      ctx.fillStyle = "#000000";
      ctx.fillRect(enemy.x - 4, enemy.y + 10, 6, 12);
      ctx.fillRect(enemy.x + ENEMY_W - 2, enemy.y + 10, 6, 12);
      ctx.fillRect(enemy.x - 4, enemy.y + ENEMY_H - 22, 6, 12);
      ctx.fillRect(enemy.x + ENEMY_W - 2, enemy.y + ENEMY_H - 22, 6, 12);
    }
    ctx.shadowBlur = 0;

    // Player car
    const px = playerXRef.current;
    const py = CANVAS_H - PLAYER_H - 20;

    if (!invincibleRef.current || Math.floor(frameRef.current / 6) % 2 === 0) {
      ctx.shadowColor = "#3b82f6";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.roundRect(px, py, PLAYER_W, PLAYER_H, 8);
      ctx.fill();

      // Windshield
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#00000060";
      ctx.fillRect(px + 6, py + 10, PLAYER_W - 12, 16);

      // Headlights
      ctx.fillStyle = "#fffacd";
      ctx.fillRect(px + 4, py + PLAYER_H - 10, 10, 6);
      ctx.fillRect(px + PLAYER_W - 14, py + PLAYER_H - 10, 10, 6);

      // Tires
      ctx.fillStyle = "#000000";
      ctx.fillRect(px - 4, py + 10, 6, 12);
      ctx.fillRect(px + PLAYER_W - 2, py + 10, 6, 12);
      ctx.fillRect(px - 4, py + PLAYER_H - 22, 6, 12);
      ctx.fillRect(px + PLAYER_W - 2, py + PLAYER_H - 22, 6, 12);
    }
    ctx.shadowBlur = 0;

    // HUD
    ctx.fillStyle = "#ffffffcc";
    ctx.font = "bold 14px 'Sora', sans-serif";
    ctx.fillText(`Score: ${scoreRef.current}`, 12, 24);

    // Lives
    for (let i = 0; i < livesRef.current; i++) {
      ctx.fillStyle = "#ef4444";
      ctx.fillText("♥", CANVAS_W - 24 - i * 22, 24);
    }
  }, []);

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== "playing") return;

    frameRef.current++;

    // Move player
    const keys = keysRef.current;
    if (
      (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) &&
      playerXRef.current > ROAD_X + 4
    ) {
      playerXRef.current -= 4;
    }
    if (
      (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) &&
      playerXRef.current < ROAD_X + ROAD_W - PLAYER_W - 4
    ) {
      playerXRef.current += 4;
    }

    // Spawn enemies
    const spawnRate = Math.max(40, 80 - Math.floor(scoreRef.current / 200) * 5);
    if (frameRef.current % spawnRate === 0) {
      const lane = Math.floor(Math.random() * 4);
      const speed =
        ENEMY_SPEED_BASE + Math.random() * 2 + scoreRef.current / 1000;
      enemiesRef.current.push({
        id: ++enemyIdCounter,
        x: LANE_CENTERS[lane] - ENEMY_W / 2,
        y: -ENEMY_H,
        speed,
        color: ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)],
      });
    }

    // Move enemies
    enemiesRef.current = enemiesRef.current
      .map((e) => ({ ...e, y: e.y + e.speed }))
      .filter((e) => e.y < CANVAS_H + ENEMY_H);

    // Score
    scoreRef.current += 1;
    setScore(scoreRef.current);

    // Collision detection
    const px = playerXRef.current;
    const py = CANVAS_H - PLAYER_H - 20;

    if (!invincibleRef.current) {
      for (const enemy of enemiesRef.current) {
        const overlapX =
          px < enemy.x + ENEMY_W - 4 && px + PLAYER_W > enemy.x + 4;
        const overlapY =
          py < enemy.y + ENEMY_H - 4 && py + PLAYER_H > enemy.y + 4;
        if (overlapX && overlapY) {
          livesRef.current--;
          setLives(livesRef.current);
          invincibleRef.current = true;
          invincibleTimerRef.current = frameRef.current;
          toast.error(`Crash! ${livesRef.current} lives left`, {
            duration: 1000,
          });
          if (livesRef.current <= 0) {
            gameStateRef.current = "gameover";
            setGameState("gameover");
            setFinalScore(scoreRef.current);
            return;
          }
          break;
        }
      }
    } else if (frameRef.current - invincibleTimerRef.current > 90) {
      invincibleRef.current = false;
    }

    drawGame();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [drawGame]);

  const startGame = useCallback(() => {
    toast.dismiss();
    scoreSubmittedRef.current = false;
    scoreRef.current = 0;
    livesRef.current = 3;
    playerXRef.current = CANVAS_W / 2 - PLAYER_W / 2;
    enemiesRef.current = [];
    frameRef.current = 0;
    invincibleRef.current = false;
    gameStateRef.current = "playing";
    setGameState("playing");
    setScore(0);
    setLives(3);
    setFinalScore(0);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const handleGameOver = useCallback(async () => {
    if (identity && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      try {
        await submitScore.mutateAsync({
          gameId: GameId.racing,
          score: BigInt(finalScore),
        });
        toast.success("Score submitted to leaderboard!", { duration: 3000 });
      } catch {
        toast.error("Failed to submit score");
      }
    }
  }, [identity, submitScore, finalScore]);

  useEffect(() => {
    if (gameState === "gameover" && finalScore > 0) {
      void handleGameOver();
    }
  }, [gameState, finalScore, handleGameOver]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Touch controls
  const handleTouchStart = useCallback((dir: "left" | "right") => {
    const interval = setInterval(() => {
      if (gameStateRef.current !== "playing") {
        clearInterval(interval);
        return;
      }
      if (dir === "left") keysRef.current.add("ArrowLeft");
      else keysRef.current.add("ArrowRight");
    }, 16);
    return interval;
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-neon-cyan">
          <Car className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl gradient-text">
            Turbo Rush
          </h1>
          <p className="text-muted-foreground text-sm">
            Dodge traffic • Arrow keys or A/D
          </p>
        </div>
        {gameState === "playing" && (
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-1">
              {(["life1", "life2", "life3"] as const).map((k, i) => (
                <Heart
                  key={k}
                  className={`w-5 h-5 ${i < lives ? "text-red-500 fill-red-500" : "text-muted-foreground"}`}
                />
              ))}
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30 font-mono">
              {score}
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
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-neon-cyan animate-float">
                  <Car className="w-10 h-10 text-white" />
                </div>
                <h2 className="font-display font-black text-3xl mb-3">
                  Turbo Rush
                </h2>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Dodge oncoming traffic and survive as long as possible. You
                  have 3 lives — make them count!
                </p>
                <div className="flex justify-center gap-8 mb-8 text-sm">
                  <div>
                    <span className="text-muted-foreground">Controls:</span>{" "}
                    <span className="font-semibold">← → or A/D</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lives:</span>{" "}
                    <span className="font-semibold">3 ♥</span>
                  </div>
                </div>
                <Button
                  onClick={startGame}
                  data-ocid="racing.primary_button"
                  className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-lg px-10 py-6 h-auto border-0 shadow-neon-cyan"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Racing
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {gameState === "gameover" && (
          <motion.div
            key="gameover"
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
                  Game Over!
                </h2>
                <p className="text-muted-foreground mb-6">You crashed out</p>
                <div className="mb-8">
                  <p className="font-display font-black text-5xl gradient-text mb-1">
                    {finalScore}
                  </p>
                  <p className="text-sm text-muted-foreground">Final Score</p>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={startGame}
                    data-ocid="racing.primary_button"
                    className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold border-0"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
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

      {/* Game Canvas */}
      <div
        className={`flex justify-center ${gameState !== "playing" ? "hidden" : ""}`}
      >
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            data-ocid="racing.canvas_target"
            className="rounded-xl border border-primary/20 shadow-neon-blue"
            style={{ maxWidth: "100%", touchAction: "none" }}
          />

          {/* Mobile touch controls */}
          <div className="flex gap-4 mt-4 sm:hidden">
            <button
              type="button"
              onPointerDown={() => {
                const id = handleTouchStart("left");
                touchIntervalRef.current.left = id;
              }}
              onPointerUp={() => {
                clearInterval(touchIntervalRef.current.left);
                keysRef.current.delete("ArrowLeft");
              }}
              className="flex-1 py-4 rounded-xl glass-card border border-primary/30 text-primary font-bold text-xl active:bg-primary/20"
            >
              ←
            </button>
            <button
              type="button"
              onPointerDown={() => {
                const id = handleTouchStart("right");
                touchIntervalRef.current.right = id;
              }}
              onPointerUp={() => {
                clearInterval(touchIntervalRef.current.right);
                keysRef.current.delete("ArrowRight");
              }}
              className="flex-1 py-4 rounded-xl glass-card border border-primary/30 text-primary font-bold text-xl active:bg-primary/20"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
