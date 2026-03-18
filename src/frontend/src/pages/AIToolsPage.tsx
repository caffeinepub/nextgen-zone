import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot,
  Check,
  Copy,
  ImageIcon,
  Loader2,
  Lock,
  Send,
  Settings,
  Sparkles,
  User,
  Wand2,
  Youtube,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGenerateStory, useGenerateTitles } from "../hooks/useQueries";

const GEMINI_API_KEY_DEFAULT = "AIzaSyAY92tphWrbGvuSFbmlMdKMItGHJBWAkxY";

const AI_RESPONSES = [
  "That's an intriguing thought! Based on cutting-edge research, the answer involves several fascinating factors. Let me break it down for you...",
  "Great question! The intersection of technology and human cognition reveals something remarkable here...",
  "I've analyzed your query across multiple dimensions. Here's what the data suggests...",
  "Fascinating! This reminds me of several interconnected concepts. Allow me to explore this with you...",
  "The short answer is 'it depends' — but the long answer is far more interesting. Here's why...",
  "You've touched on something that researchers are actively debating. The current consensus suggests...",
  "From a systems perspective, this has three key components worth examining...",
  "Let me challenge that assumption slightly — the reality is more nuanced and actually quite surprising...",
];

interface ChatMessage {
  id: number;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

let msgIdCounter = 0;

async function callGemini(
  apiKey: string,
  userMessage: string,
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return (
    data.candidates[0]?.content?.parts[0]?.text ?? "No response from Gemini."
  );
}

async function generateGeminiImage(
  apiKey: string,
  prompt: string,
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini Image API error: ${response.status} ${errText}`);
  }

  const data = (await response.json()) as {
    candidates: Array<{
      content: {
        parts: Array<{
          inlineData?: { mimeType: string; data: string };
          text?: string;
        }>;
      };
    }>;
  };

  const parts = data.candidates[0]?.content?.parts ?? [];
  const imagePart = parts.find((p) => p.inlineData);
  if (!imagePart?.inlineData) throw new Error("No image data returned");
  return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
}

function APISettingsDialog({ t }: { t: (key: string) => string }) {
  const [open, setOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setKeyInput(localStorage.getItem("gemini_api_key") ?? "");
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    localStorage.setItem("gemini_api_key", keyInput.trim());
    toast.success(t("ai.settings.saved"));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-ocid="ai.chatbot.settings.open_modal_button"
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title={t("ai.settings.title")}
        >
          <Settings className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent
        className="glass-card border-border/50 sm:max-w-md"
        data-ocid="ai.chatbot.settings.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Google Gemini API Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="api-key">Google Gemini API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              data-ocid="ai.chatbot.settings.input"
              className="bg-secondary/50 border-border/50 font-mono text-sm"
            />
          </div>
          <p className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3 border border-border/30">
            🔒 {t("ai.settings.note")}
          </p>
          <Button
            onClick={handleSave}
            data-ocid="ai.chatbot.settings.save_button"
            className="w-full neon-btn text-primary border-primary/40 font-semibold"
            variant="outline"
          >
            {t("ai.settings.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AIToolsPage() {
  const [activeTab, setActiveTab] = useState("chatbot");
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { t } = useLanguage();

  // Pre-populate Gemini API key on mount
  useEffect(() => {
    if (!localStorage.getItem("gemini_api_key")) {
      localStorage.setItem("gemini_api_key", GEMINI_API_KEY_DEFAULT);
    }
  }, []);

  // Chatbot state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: ++msgIdCounter,
      role: "ai",
      content: t("ai.chatbot.greeting"),
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiResponseIdx = useRef(0);

  // Story gen state
  const [storyGenre, setStoryGenre] = useState("");
  const [storyPrompt, setStoryPrompt] = useState("");
  const [generatedStory, setGeneratedStory] = useState("");
  const generateStory = useGenerateStory();

  // Title gen state
  const [titleTopic, setTitleTopic] = useState("");
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const generateTitles = useGenerateTitles();

  // Image gen state
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Copy state
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll-to-bottom effect intentionally uses chatMessages as trigger
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg: ChatMessage = {
      id: ++msgIdCounter,
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    const userText = chatInput.trim();
    setChatInput("");
    setIsChatLoading(true);

    const apiKey = localStorage.getItem("gemini_api_key");
    let aiContent: string;

    if (!apiKey) {
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));
      aiContent = AI_RESPONSES[aiResponseIdx.current % AI_RESPONSES.length];
      aiResponseIdx.current++;
    } else {
      try {
        aiContent = await callGemini(apiKey, userText);
      } catch {
        toast.error(
          "Gemini request failed. Falling back to simulated response.",
        );
        await new Promise((r) => setTimeout(r, 400));
        aiContent = AI_RESPONSES[aiResponseIdx.current % AI_RESPONSES.length];
        aiResponseIdx.current++;
      }
    }

    const aiMsg: ChatMessage = {
      id: ++msgIdCounter,
      role: "ai",
      content: aiContent,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, aiMsg]);
    setIsChatLoading(false);
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error("Please enter an image prompt");
      return;
    }
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) {
      toast.error("No Gemini API key found");
      return;
    }
    setIsImageLoading(true);
    setGeneratedImageUrl("");
    try {
      const url = await generateGeminiImage(apiKey, imagePrompt.trim());
      setGeneratedImageUrl(url);
    } catch {
      toast.error("Image generation failed. Please try again.");
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleGenerateStory = async () => {
    if (!storyGenre || !storyPrompt.trim()) {
      toast.error("Please select a genre and enter a prompt");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please log in to use the Story Generator");
      return;
    }
    setGeneratedStory("");
    try {
      const result = await generateStory.mutateAsync({
        genre: storyGenre,
        prompt: storyPrompt,
      });
      if (!result || result.trim().length === 0) {
        toast.error(
          "Story generation returned empty result. Please try again.",
        );
        return;
      }
      setGeneratedStory(result);
    } catch {
      toast.error("Failed to generate story. Please try again.");
    }
  };

  const handleGenerateTitles = async () => {
    if (!titleTopic.trim()) {
      toast.error("Please enter a topic");
      return;
    }
    if (!isAuthenticated) {
      toast.error("Please login to use Title Generator");
      return;
    }
    setGeneratedTitles([]);
    try {
      const result = await generateTitles.mutateAsync(titleTopic);
      setGeneratedTitles(result);
    } catch {
      toast.error("Failed to generate titles. Please try again.");
    }
  };

  const handleCopy = (text: string, idx: number) => {
    void navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-neon-blue">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl gradient-text">
            {t("ai.title")}
          </h1>
        </div>
        <p className="text-muted-foreground">{t("ai.subtitle")}</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-card border border-border/50 p-1 mb-8 flex flex-wrap gap-1 h-auto">
          <TabsTrigger
            value="chatbot"
            data-ocid="ai.chatbot.tab"
            className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">{t("ai.chatbot.tab")}</span>
            <span className="sm:hidden">{t("ai.chatbot.short")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="story"
            data-ocid="ai.story.tab"
            className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">{t("ai.story.tab")}</span>
            <span className="sm:hidden">{t("ai.story.short")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="titles"
            data-ocid="ai.titles.tab"
            className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Youtube className="w-4 h-4" />
            <span className="hidden sm:inline">{t("ai.titles.tab")}</span>
            <span className="sm:hidden">{t("ai.titles.short")}</span>
          </TabsTrigger>
          <TabsTrigger
            value="image"
            data-ocid="ai.image.tab"
            className="flex items-center gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t("ai.image.tab")}</span>
            <span className="sm:hidden">{t("ai.image.short")}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Chatbot Tab ─────────────────────────────────────── */}
        <TabsContent value="chatbot">
          <Card className="glass-card neon-border-blue">
            <CardHeader className="border-b border-border/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="w-5 h-5 text-primary" />
                {t("ai.chatbot.header")}
                <Badge
                  variant="outline"
                  className="text-xs border-primary/30 text-primary ml-auto"
                >
                  Gemini AI
                </Badge>
                <APISettingsDialog t={t} />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96 p-4">
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                          msg.role === "ai"
                            ? "bg-gradient-to-br from-primary to-accent"
                            : "bg-secondary"
                        }`}
                      >
                        {msg.role === "ai" ? (
                          <Bot className="w-4 h-4 text-white" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>
                      <div
                        className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "ai"
                            ? "glass-card text-foreground"
                            : "bg-primary/20 border border-primary/30 text-foreground"
                        }`}
                      >
                        {msg.content}
                        <div className="text-xs text-muted-foreground mt-1.5">
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isChatLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                      data-ocid="ai.chatbot.loading_state"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="glass-card px-4 py-3 rounded-2xl">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-2 h-2 rounded-full bg-primary animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border/30 flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleChatSend();
                    }
                  }}
                  placeholder={t("ai.chatbot.placeholder")}
                  data-ocid="ai.chatbot.input"
                  className="bg-secondary/50 border-border/50 focus:border-primary/50"
                  disabled={isChatLoading}
                />
                <Button
                  onClick={handleChatSend}
                  disabled={isChatLoading || !chatInput.trim()}
                  data-ocid="ai.chatbot.submit_button"
                  className="neon-btn text-primary border-primary/40 flex-shrink-0"
                  variant="outline"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Story Generator Tab ──────────────────────────────── */}
        <TabsContent value="story">
          {!isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="glass-card neon-border-purple">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-display font-black text-xl mb-2">
                    Login Required
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Please log in to use the Story Generator. Your imagination
                    awaits!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass-card neon-border-purple">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    {t("ai.story.params")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label
                      htmlFor="story-genre"
                      className="text-sm font-medium mb-2 block"
                    >
                      {t("ai.story.genre")}
                    </label>
                    <Select value={storyGenre} onValueChange={setStoryGenre}>
                      <SelectTrigger
                        id="story-genre"
                        data-ocid="ai.story.genre.select"
                        className="bg-secondary/50 border-border/50"
                      >
                        <SelectValue placeholder="Select a genre..." />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-border/50">
                        {[
                          "Fantasy",
                          "Sci-Fi",
                          "Romance",
                          "Mystery",
                          "Horror",
                        ].map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label
                      htmlFor="story-prompt"
                      className="text-sm font-medium mb-2 block"
                    >
                      {t("ai.story.prompt_label")}
                    </label>
                    <Textarea
                      id="story-prompt"
                      value={storyPrompt}
                      onChange={(e) => setStoryPrompt(e.target.value)}
                      placeholder="Describe the story you want... e.g., 'A space explorer discovers an ancient alien artifact on a desolate moon'"
                      data-ocid="ai.story.prompt.textarea"
                      className="bg-secondary/50 border-border/50 focus:border-accent/50 min-h-[120px]"
                    />
                  </div>
                  <Button
                    onClick={handleGenerateStory}
                    disabled={generateStory.isPending}
                    data-ocid="ai.story.generate.button"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold border-0 hover:from-purple-500 hover:to-pink-400"
                  >
                    {generateStory.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                        {t("ai.story.generating")}
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />{" "}
                        {t("ai.story.generate")}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    {t("ai.story.result")}
                    {generatedStory && storyGenre && (
                      <Badge className="ml-auto bg-accent/20 text-accent border-accent/30 text-xs">
                        {storyGenre}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {generateStory.isPending ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3"
                        data-ocid="ai.story.loading_state"
                      >
                        <div className="flex items-center gap-2 mb-4 text-sm text-accent">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t("ai.story.generating")}</span>
                        </div>
                        {(
                          [
                            "l1",
                            "l2",
                            "l3",
                            "l4",
                            "l5",
                            "l6",
                            "l7",
                            "l8",
                          ] as const
                        ).map((k) => (
                          <div
                            key={k}
                            className="h-4 bg-muted/50 rounded animate-pulse"
                          />
                        ))}
                      </motion.div>
                    ) : generatedStory ? (
                      <motion.div
                        key="story"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {storyGenre && (
                          <div className="mb-3 pb-3 border-b border-border/30">
                            <h3 className="font-display font-bold text-lg gradient-text">
                              A {storyGenre} Story
                            </h3>
                          </div>
                        )}
                        <ScrollArea className="h-64">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 pr-4">
                            {generatedStory}
                          </p>
                        </ScrollArea>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 border-border/50"
                          onClick={() => handleCopy(generatedStory, 999)}
                        >
                          {copiedIdx === 999 ? (
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          {t("ai.story.copy")}
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="h-64 flex flex-col items-center justify-center text-muted-foreground"
                      >
                        <Sparkles className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">
                          Your generated story will appear here
                        </p>
                        <p className="text-xs mt-1 opacity-60">
                          Select a genre and enter a prompt to begin
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ── Title Generator Tab ──────────────────────────────── */}
        <TabsContent value="titles">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="glass-card neon-border-blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-red-400" />
                  {t("ai.titles.header")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label
                    htmlFor="title-topic"
                    className="text-sm font-medium mb-2 block"
                  >
                    {t("ai.titles.topic")}
                  </label>
                  <Input
                    id="title-topic"
                    value={titleTopic}
                    onChange={(e) => setTitleTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleGenerateTitles();
                    }}
                    placeholder="e.g., How to earn passive income in 2025"
                    data-ocid="ai.titles.topic.input"
                    className="bg-secondary/50 border-border/50 focus:border-primary/50"
                  />
                </div>
                <Button
                  onClick={handleGenerateTitles}
                  disabled={generateTitles.isPending}
                  data-ocid="ai.titles.generate.button"
                  className="w-full neon-btn text-primary border-primary/40 font-bold"
                  variant="outline"
                >
                  {generateTitles.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      {t("ai.titles.generating")}
                    </>
                  ) : (
                    <>
                      <Youtube className="w-4 h-4 mr-2" />{" "}
                      {t("ai.titles.generate")}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <AnimatePresence>
              {generateTitles.isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                  data-ocid="ai.titles.loading_state"
                >
                  {(["t1", "t2", "t3", "t4", "t5"] as const).map((k) => (
                    <div
                      key={k}
                      className="h-14 glass-card rounded-xl animate-pulse"
                    />
                  ))}
                </motion.div>
              )}
              {generatedTitles.length > 0 && !generateTitles.isPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {generatedTitles.map((title, i) => (
                    <motion.div
                      key={title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <Card className="glass-card hover:border-primary/40 transition-all">
                        <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-primary font-bold w-5">
                              {i + 1}.
                            </span>
                            <p className="text-sm font-medium">{title}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0 h-8 w-8"
                            onClick={() => handleCopy(title, i)}
                          >
                            {copiedIdx === i ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* ── Image Generator Tab ─────────────────────────────── */}
        <TabsContent value="image">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="glass-card neon-border-purple">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-accent" />
                  {t("ai.image.header")}
                  <Badge className="ml-auto bg-accent/20 text-accent border-accent/30 text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Gemini 2.0 Flash
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label
                    htmlFor="image-prompt"
                    className="text-sm font-medium mb-2 block"
                  >
                    Describe your image
                  </label>
                  <Textarea
                    id="image-prompt"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="e.g., A cyberpunk cityscape at night with neon lights reflecting on wet streets"
                    data-ocid="ai.image.prompt.textarea"
                    className="bg-secondary/50 border-border/50 focus:border-accent/50 min-h-[100px]"
                  />
                </div>
                <Button
                  onClick={handleGenerateImage}
                  disabled={isImageLoading || !imagePrompt.trim()}
                  data-ocid="ai.image.generate.button"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold border-0 hover:from-purple-500 hover:to-pink-400"
                >
                  {isImageLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Image...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <AnimatePresence mode="wait">
              {isImageLoading && (
                <motion.div
                  key="img-loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center gap-4"
                  data-ocid="ai.image.loading_state"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center animate-pulse">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Creating your image with Gemini AI...
                  </p>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full bg-accent animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              {generatedImageUrl && !isImageLoading && (
                <motion.div
                  key="img-result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-2xl overflow-hidden"
                  data-ocid="ai.image.success_state"
                >
                  <img
                    src={generatedImageUrl}
                    alt={imagePrompt}
                    className="w-full object-contain max-h-[512px]"
                  />
                  <div className="p-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground truncate">
                      {imagePrompt}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 border-border/50"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = generatedImageUrl;
                        a.download = "gemini-image.png";
                        a.click();
                      }}
                    >
                      Download
                    </Button>
                  </div>
                </motion.div>
              )}
              {!generatedImageUrl && !isImageLoading && (
                <motion.div
                  key="img-placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        gradient: "from-purple-600 via-pink-500 to-rose-400",
                        label: "Portrait",
                      },
                      {
                        gradient: "from-blue-600 via-cyan-500 to-teal-400",
                        label: "Landscape",
                      },
                      {
                        gradient: "from-amber-500 via-orange-500 to-red-500",
                        label: "Abstract",
                      },
                      {
                        gradient: "from-green-500 via-emerald-500 to-cyan-400",
                        label: "Nature",
                      },
                      {
                        gradient: "from-indigo-600 via-purple-500 to-pink-400",
                        label: "Sci-Fi",
                      },
                      {
                        gradient: "from-rose-500 via-pink-500 to-purple-500",
                        label: "Fantasy",
                      },
                    ].map((item) => (
                      <motion.div
                        key={item.label}
                        whileHover={{ scale: 1.04 }}
                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                        onClick={() =>
                          setImagePrompt(`${item.label} style digital art`)
                        }
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-60`}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-white/70" />
                          </div>
                          <span className="text-white/70 text-xs font-medium">
                            {item.label}
                          </span>
                        </div>
                        <div className="absolute inset-0 border border-white/10 rounded-xl" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-center text-xs text-muted-foreground mt-4 opacity-60">
                    Click a style to prefill prompt, or type your own above
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
