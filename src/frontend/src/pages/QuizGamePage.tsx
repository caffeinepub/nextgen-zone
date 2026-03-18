import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  HelpCircle,
  RotateCcw,
  Star,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { GameId } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAddXp, useSubmitScore } from "../hooks/useQueries";

interface Question {
  question: string;
  options: string[];
  correct: number;
  category: string;
}

const QUESTIONS: Question[] = [
  {
    question: "What does CPU stand for?",
    options: [
      "Central Processing Unit",
      "Computer Personal Unit",
      "Core Processing Unit",
      "Central Program Utility",
    ],
    correct: 0,
    category: "Technology",
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Jupiter", "Mars", "Saturn"],
    correct: 2,
    category: "Science",
  },
  {
    question: "What is the capital of Japan?",
    options: ["Beijing", "Seoul", "Bangkok", "Tokyo"],
    correct: 3,
    category: "Geography",
  },
  {
    question: "Who painted the Mona Lisa?",
    options: [
      "Vincent van Gogh",
      "Leonardo da Vinci",
      "Pablo Picasso",
      "Michelangelo",
    ],
    correct: 1,
    category: "Art",
  },
  {
    question: "What is the largest ocean on Earth?",
    options: [
      "Atlantic Ocean",
      "Indian Ocean",
      "Arctic Ocean",
      "Pacific Ocean",
    ],
    correct: 3,
    category: "Geography",
  },
  {
    question: "In what year was the World Wide Web invented?",
    options: ["1989", "1991", "1995", "1984"],
    correct: 0,
    category: "Technology",
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Ag", "Fe", "Au", "Pb"],
    correct: 2,
    category: "Science",
  },
  {
    question: "Which is the fastest land animal?",
    options: ["Lion", "Cheetah", "Leopard", "Gazelle"],
    correct: 1,
    category: "Nature",
  },
  {
    question: "How many sides does a hexagon have?",
    options: ["5", "7", "8", "6"],
    correct: 3,
    category: "Math",
  },
  {
    question: "What programming language was created by Brendan Eich?",
    options: ["Python", "Java", "JavaScript", "Ruby"],
    correct: 2,
    category: "Technology",
  },
];

const QUESTION_TIME = 15;

type GameState = "idle" | "playing" | "answered" | "finished";

export default function QuizGamePage() {
  const { identity } = useInternetIdentity();
  const [gameState, setGameState] = useState<GameState>("idle");
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [xpEarned, setXpEarned] = useState(0);
  const scoreSubmittedRef = useRef(false);

  const submitScore = useSubmitScore();
  const addXp = useAddXp();

  const question = QUESTIONS[currentQ];

  const handleTimeout = useCallback(() => {
    if (gameState !== "playing") return;
    setAnswers((prev) => [...prev, false]);
    setSelectedAnswer(-1);
    setGameState("answered");
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "playing") return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameState, handleTimeout]);

  const handleStart = () => {
    toast.dismiss();
    scoreSubmittedRef.current = false;
    setGameState("playing");
    setCurrentQ(0);
    setScore(0);
    setTimeLeft(QUESTION_TIME);
    setAnswers([]);
    setSelectedAnswer(null);
    setXpEarned(0);
  };

  const handleAnswer = (idx: number) => {
    if (gameState !== "playing") return;
    const isCorrect = idx === question.correct;
    const timeBonus = Math.floor(timeLeft * 2);
    const points = isCorrect ? 100 + timeBonus : 0;
    setSelectedAnswer(idx);
    setAnswers((prev) => [...prev, isCorrect]);
    if (isCorrect) {
      setScore((s) => s + points);
      toast.success(`+${points} points!`, { duration: 1500 });
    } else {
      toast.error("Wrong answer!", { duration: 1500 });
    }
    setGameState("answered");
  };

  const handleNext = async () => {
    if (currentQ + 1 >= QUESTIONS.length) {
      const totalXp = Math.floor(score / 2);
      setXpEarned(totalXp);
      setGameState("finished");

      if (identity && !scoreSubmittedRef.current) {
        scoreSubmittedRef.current = true;
        const principal = identity.getPrincipal();
        try {
          await Promise.all([
            submitScore.mutateAsync({
              gameId: GameId.quiz,
              score: BigInt(score),
            }),
            addXp.mutateAsync({ user: principal, xp: BigInt(totalXp) }),
          ]);
          toast.success("Score submitted!", { duration: 3000 });
        } catch {
          toast.error("Failed to submit score");
        }
      }
    } else {
      setCurrentQ((q) => q + 1);
      setSelectedAnswer(null);
      setTimeLeft(QUESTION_TIME);
      setGameState("playing");
    }
  };

  const correctCount = answers.filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/games">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-neon-blue">
          <HelpCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display font-black text-2xl gradient-text">
            Quiz Master
          </h1>
          <p className="text-muted-foreground text-sm">
            10 questions • 15s per question
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Idle Screen ── */}
        {gameState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="glass-card neon-border-blue text-center">
              <CardContent className="py-16 px-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-neon-blue animate-float">
                  <HelpCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="font-display font-black text-3xl mb-4">
                  Quiz Master
                </h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                  Answer 10 trivia questions across various categories. You have
                  15 seconds per question — faster answers earn more points!
                </p>
                <div className="grid grid-cols-3 gap-4 mb-8 max-w-xs mx-auto">
                  {[
                    { label: "Questions", value: "10" },
                    { label: "Time/Q", value: "15s" },
                    { label: "Max XP", value: "500+" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="font-display font-black text-xl gradient-text">
                        {s.value}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleStart}
                  data-ocid="quiz.primary_button"
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-lg px-10 py-6 h-auto border-0 shadow-neon-blue"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Playing / Answered ── */}
        {(gameState === "playing" || gameState === "answered") && (
          <motion.div
            key={`question-${currentQ}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            {/* Progress + Timer */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary">
                  {currentQ + 1} / {QUESTIONS.length}
                </span>
                <Badge className="bg-secondary text-muted-foreground border-border/40 text-xs">
                  {question.category}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock
                  className={`w-4 h-4 ${timeLeft <= 5 ? "text-destructive animate-pulse" : "text-muted-foreground"}`}
                />
                <span
                  className={`font-mono font-bold text-lg tabular-nums ${
                    timeLeft <= 5 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {timeLeft}s
                </span>
              </div>
            </div>

            <Progress
              value={(currentQ / QUESTIONS.length) * 100}
              className="h-1.5 mb-6 bg-secondary"
            />

            {/* Timer Progress */}
            <div className="h-1 bg-secondary rounded-full mb-6 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${timeLeft <= 5 ? "bg-destructive" : "bg-primary"}`}
                initial={{ width: "100%" }}
                animate={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <Card className="glass-card mb-6">
              <CardContent className="p-6">
                <p className="font-display font-bold text-xl leading-relaxed">
                  {question.question}
                </p>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-2 gap-3">
              {question.options.map((option, idx) => {
                let variant: "correct" | "wrong" | "idle" | "missed" = "idle";
                if (gameState === "answered") {
                  if (idx === question.correct) variant = "correct";
                  else if (idx === selectedAnswer) variant = "wrong";
                  else if (selectedAnswer === -1 && idx !== question.correct)
                    variant = "missed";
                }

                return (
                  <motion.button
                    key={option}
                    onClick={() => handleAnswer(idx)}
                    disabled={gameState !== "playing"}
                    data-ocid="quiz.answer.button"
                    whileHover={gameState === "playing" ? { scale: 1.02 } : {}}
                    whileTap={gameState === "playing" ? { scale: 0.98 } : {}}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 font-medium text-sm ${
                      variant === "correct"
                        ? "bg-green-500/20 border-green-500/60 text-green-400"
                        : variant === "wrong"
                          ? "bg-destructive/20 border-destructive/60 text-destructive"
                          : variant === "missed"
                            ? "opacity-40 border-border/30"
                            : "glass-card hover:border-primary/40 hover:bg-primary/10 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full border border-current/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option}</span>
                      {variant === "correct" && (
                        <CheckCircle2 className="w-5 h-5 ml-auto text-green-400" />
                      )}
                      {variant === "wrong" && (
                        <XCircle className="w-5 h-5 ml-auto text-destructive" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {gameState === "answered" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex justify-between items-center"
              >
                <div className="text-sm">
                  <span className="text-muted-foreground">Score: </span>
                  <span className="font-bold text-primary">{score} pts</span>
                </div>
                <Button
                  onClick={handleNext}
                  data-ocid="quiz.next.button"
                  className="neon-btn text-primary border-primary/40 font-semibold"
                  variant="outline"
                >
                  {currentQ + 1 >= QUESTIONS.length
                    ? "See Results"
                    : "Next Question →"}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Results Screen ── */}
        {gameState === "finished" && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="glass-card neon-border-blue text-center">
              <CardContent className="py-12 px-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-gold to-amber-500 flex items-center justify-center mx-auto mb-6 shadow-neon-gold animate-float">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <h2 className="font-display font-black text-3xl mb-2">
                  Quiz Complete!
                </h2>
                <p className="text-muted-foreground mb-8">Here's how you did</p>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div>
                    <p className="font-display font-black text-3xl gradient-text">
                      {score}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total Score
                    </p>
                  </div>
                  <div>
                    <p className="font-display font-black text-3xl text-green-400">
                      {correctCount}/{QUESTIONS.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Correct
                    </p>
                  </div>
                  <div>
                    <p className="font-display font-black text-3xl text-neon-gold">
                      +{xpEarned}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      XP Earned
                    </p>
                  </div>
                </div>

                {/* Answer breakdown */}
                <div className="flex justify-center gap-1.5 mb-8">
                  {answers.map((correct, i) => (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: deterministic position
                      key={i}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        correct
                          ? "bg-green-500/20 border border-green-500/50 text-green-400"
                          : "bg-destructive/20 border border-destructive/50 text-destructive"
                      }`}
                    >
                      {correct ? "✓" : "✗"}
                    </div>
                  ))}
                </div>

                {/* Performance badge */}
                <div className="mb-8">
                  {correctCount === QUESTIONS.length ? (
                    <Badge className="bg-neon-gold/20 text-neon-gold border-neon-gold/40 text-sm px-4 py-1">
                      <Star className="w-3.5 h-3.5 mr-1.5" />
                      Perfect Score!
                    </Badge>
                  ) : correctCount >= 7 ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-sm px-4 py-1">
                      Excellent Performance!
                    </Badge>
                  ) : correctCount >= 5 ? (
                    <Badge className="bg-primary/20 text-primary border-primary/40 text-sm px-4 py-1">
                      Good Job!
                    </Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground border-border/40 text-sm px-4 py-1">
                      Keep Practicing!
                    </Badge>
                  )}
                </div>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={handleStart}
                    data-ocid="quiz.primary_button"
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold border-0"
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
    </div>
  );
}
