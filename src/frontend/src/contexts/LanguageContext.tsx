import { type ReactNode, createContext, useContext, useState } from "react";

type Language = "en" | "hi";

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    "nav.home": "Home",
    "nav.ai_tools": "AI Tools",
    "nav.chat": "Chat",
    "nav.games": "Games",
    "nav.leaderboard": "Leaderboard",
    "nav.profile": "Profile",
    "nav.vip": "VIP",
    "nav.admin": "Admin",
    "nav.coins": "Coins & Donations",
    "nav.my_profile": "My Profile",
    "nav.admin_panel": "Admin Panel",
    // Auth
    "auth.login": "Login",
    "auth.logout": "Log Out",
    "auth.connecting": "Connecting...",
    // Common
    "common.coming_soon": "Coming Soon",
    "common.generate": "Generate",
    "common.copy": "Copy",
    "common.send": "Send",
    "common.loading": "Loading...",
    "common.in_development": "In Development",
    // HomePage
    "home.hero.badge": "The Future of Gaming & AI is Here",
    "home.hero.title1": "NextGen",
    "home.hero.title2": "Zone",
    "home.hero.subtitle": "AI Tools · Live Chat · Online Games · Leaderboards",
    "home.hero.desc":
      "Experience the next generation of entertainment. Powered by AI, built for gamers, creators, and community.",
    "home.hero.explore": "Explore Now",
    "home.hero.join": "Join Free",
    "home.features.title": "Everything You Need",
    "home.features.subtitle": "One platform. Infinite possibilities.",
    "home.highlights.title": "Why NextGen Zone?",
    // AI Tools
    "ai.title": "AI Tools",
    "ai.subtitle": "Harness the power of AI for creative and productive tasks",
    "ai.chatbot.tab": "AI Chatbot",
    "ai.chatbot.short": "Chat",
    "ai.story.tab": "Story Generator",
    "ai.story.short": "Story",
    "ai.titles.tab": "Title Generator",
    "ai.titles.short": "Titles",
    "ai.image.tab": "Image Generator",
    "ai.image.short": "Image",
    "ai.chatbot.header": "AI Chat Assistant",
    "ai.chatbot.badge": "Always Online",
    "ai.chatbot.placeholder": "Ask the AI anything...",
    "ai.chatbot.greeting":
      "Hello! I'm your NextGen AI assistant. Ask me anything — I'm here to help with your questions, ideas, and creative projects!",
    "ai.story.params": "Story Parameters",
    "ai.story.genre": "Genre",
    "ai.story.prompt_label": "Story Prompt",
    "ai.story.generate": "Generate Story",
    "ai.story.generating": "Generating your story...",
    "ai.story.result": "Generated Story",
    "ai.story.copy": "Copy Story",
    "ai.titles.header": "YouTube Title Generator",
    "ai.titles.topic": "Video Topic",
    "ai.titles.generate": "Generate 5 Titles",
    "ai.titles.generating": "Generating...",
    "ai.image.header": "AI Image Generator",
    "ai.image.desc":
      "AI image generation is coming in a future update. Soon you'll be able to create stunning visuals with just a text description.",
    "ai.image.preview": "Preview — Coming Soon",
    "ai.settings.title": "ChatGPT API Settings",
    "ai.settings.label": "OpenAI API Key",
    "ai.settings.placeholder": "sk-...",
    "ai.settings.note": "Your key is stored locally in your browser only.",
    "ai.settings.save": "Save Key",
    "ai.settings.saved": "API key saved!",
    "ai.settings.no_key":
      "Please configure your OpenAI API key (click the settings icon)",
    // Profile
    "profile.title": "My Profile",
    "profile.level": "Level",
    "profile.xp": "XP",
    "profile.badges": "Badges",
    // Games
    "games.title": "Games Hub",
    "games.play": "Play Now",
    // Chat
    "chat.title": "Chat Rooms",
    "chat.send": "Send Message",
    // Leaderboard
    "leaderboard.title": "Leaderboard",
    "leaderboard.rank": "Rank",
    "leaderboard.player": "Player",
    "leaderboard.score": "Score",
    // VIP
    "vip.title": "VIP Membership",
    "vip.join": "Join VIP",
  },
  hi: {
    // Nav
    "nav.home": "होम",
    "nav.ai_tools": "AI टूल्स",
    "nav.chat": "चैट",
    "nav.games": "गेम्स",
    "nav.leaderboard": "लीडरबोर्ड",
    "nav.profile": "प्रोफ़ाइल",
    "nav.vip": "VIP",
    "nav.admin": "एडमिन",
    "nav.coins": "कॉइन्स और डोनेशन",
    "nav.my_profile": "मेरी प्रोफ़ाइल",
    "nav.admin_panel": "एडमिन पैनल",
    // Auth
    "auth.login": "लॉगिन",
    "auth.logout": "लॉग आउट",
    "auth.connecting": "जोड़ रहे हैं...",
    // Common
    "common.coming_soon": "जल्द आ रहा है",
    "common.generate": "बनाएं",
    "common.copy": "कॉपी करें",
    "common.send": "भेजें",
    "common.loading": "लोड हो रहा है...",
    "common.in_development": "विकास में",
    // HomePage
    "home.hero.badge": "गेमिंग और AI का भविष्य यहाँ है",
    "home.hero.title1": "नेक्स्टजेन",
    "home.hero.title2": "जोन",
    "home.hero.subtitle": "AI टूल्स · लाइव चैट · ऑनलाइन गेम्स · लीडरबोर्ड",
    "home.hero.desc":
      "मनोरंजन की अगली पीढ़ी का अनुभव करें। AI से संचालित, गेमर्स, क्रिएटर्स और समुदाय के लिए बनाया गया।",
    "home.hero.explore": "अभी एक्सप्लोर करें",
    "home.hero.join": "मुफ्त में जुड़ें",
    "home.features.title": "सब कुछ एक जगह",
    "home.features.subtitle": "एक प्लेटफ़ॉर्म। अनंत संभावनाएं।",
    "home.highlights.title": "NextGen Zone क्यों?",
    // AI Tools
    "ai.title": "AI टूल्स",
    "ai.subtitle": "रचनात्मक और उत्पादक कार्यों के लिए AI की शक्ति का उपयोग करें",
    "ai.chatbot.tab": "AI चैटबॉट",
    "ai.chatbot.short": "चैट",
    "ai.story.tab": "कहानी जनरेटर",
    "ai.story.short": "कहानी",
    "ai.titles.tab": "टाइटल जनरेटर",
    "ai.titles.short": "टाइटल",
    "ai.image.tab": "इमेज जनरेटर",
    "ai.image.short": "इमेज",
    "ai.chatbot.header": "AI चैट सहायक",
    "ai.chatbot.badge": "हमेशा ऑनलाइन",
    "ai.chatbot.placeholder": "AI से कुछ भी पूछें...",
    "ai.chatbot.greeting": "नमस्ते! मैं आपका NextGen AI सहायक हूं। मुझसे कुछ भी पूछें!",
    "ai.story.params": "कहानी के पैरामीटर",
    "ai.story.genre": "शैली",
    "ai.story.prompt_label": "कहानी का विषय",
    "ai.story.generate": "कहानी बनाएं",
    "ai.story.generating": "आपकी कहानी बन रही है...",
    "ai.story.result": "बनाई गई कहानी",
    "ai.story.copy": "कहानी कॉपी करें",
    "ai.titles.header": "YouTube टाइटल जनरेटर",
    "ai.titles.topic": "वीडियो का विषय",
    "ai.titles.generate": "5 टाइटल बनाएं",
    "ai.titles.generating": "बन रहा है...",
    "ai.image.header": "AI इमेज जनरेटर",
    "ai.image.desc":
      "AI इमेज जनरेशन एक भविष्य के अपडेट में आ रहा है। जल्द ही आप केवल एक टेक्स्ट विवरण से शानदार चित्र बना सकेंगे।",
    "ai.image.preview": "प्रीव्यू — जल्द आ रहा है",
    "ai.settings.title": "ChatGPT API सेटिंग्स",
    "ai.settings.label": "OpenAI API कुंजी",
    "ai.settings.placeholder": "sk-...",
    "ai.settings.note": "आपकी कुंजी केवल आपके ब्राउज़र में स्थानीय रूप से संग्रहीत है।",
    "ai.settings.save": "कुंजी सहेजें",
    "ai.settings.saved": "API कुंजी सहेजी गई!",
    "ai.settings.no_key":
      "कृपया अपनी OpenAI API कुंजी कॉन्फ़िगर करें (सेटिंग आइकन पर क्लिक करें)",
    // Profile
    "profile.title": "मेरी प्रोफ़ाइल",
    "profile.level": "लेवल",
    "profile.xp": "XP",
    "profile.badges": "बैज",
    // Games
    "games.title": "गेम्स हब",
    "games.play": "अभी खेलें",
    // Chat
    "chat.title": "चैट रूम",
    "chat.send": "संदेश भेजें",
    // Leaderboard
    "leaderboard.title": "लीडरबोर्ड",
    "leaderboard.rank": "रैंक",
    "leaderboard.player": "खिलाड़ी",
    "leaderboard.score": "स्कोर",
    // VIP
    "vip.title": "VIP सदस्यता",
    "vip.join": "VIP बनें",
  },
};

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  toggleLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("ngz_language") as Language) ?? "en";
  });

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === "en" ? "hi" : "en";
      localStorage.setItem("ngz_language", next);
      return next;
    });
  };

  const t = (key: string): string => {
    return translations[language][key] ?? translations.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
