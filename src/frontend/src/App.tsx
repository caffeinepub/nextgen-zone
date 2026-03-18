import { Toaster } from "@/components/ui/sonner";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { Outlet, createRootRoute, createRoute } from "@tanstack/react-router";
import Layout from "./components/Layout";
import { LanguageProvider } from "./contexts/LanguageContext";
import AIToolsPage from "./pages/AIToolsPage";
import AdminPage from "./pages/AdminPage";
import ChatPage from "./pages/ChatPage";
import CoinsPage from "./pages/CoinsPage";
import GamesHubPage from "./pages/GamesHubPage";
import HomePage from "./pages/HomePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import PaymentFailurePage from "./pages/PaymentFailurePage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PrivateChatPage from "./pages/PrivateChatPage";
import ProfilePage from "./pages/ProfilePage";
import QuizGamePage from "./pages/QuizGamePage";
import RacingGamePage from "./pages/RacingGamePage";
import ShootingGamePage from "./pages/ShootingGamePage";
import VIPPage from "./pages/VIPPage";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster position="top-right" richColors />
    </>
  ),
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: HomePage,
});

const aiToolsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/ai-tools",
  component: AIToolsPage,
});

const chatRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/chat",
  component: ChatPage,
});

const privateChatRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/chat/private",
  component: PrivateChatPage,
});

const gamesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/games",
  component: GamesHubPage,
});

const quizRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/games/quiz",
  component: QuizGamePage,
});

const racingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/games/racing",
  component: RacingGamePage,
});

const shootingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/games/shooting",
  component: ShootingGamePage,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/leaderboard",
  component: LeaderboardPage,
});

const profileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/profile",
  component: ProfilePage,
});

const adminRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin",
  component: AdminPage,
});

const vipRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/vip",
  component: VIPPage,
});

const coinsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/coins",
  component: CoinsPage,
});

const paymentSuccessRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/payment-success",
  component: PaymentSuccessPage,
});

const paymentFailureRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/payment-failure",
  component: PaymentFailurePage,
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    homeRoute,
    aiToolsRoute,
    chatRoute,
    privateChatRoute,
    gamesRoute,
    quizRoute,
    racingRoute,
    shootingRoute,
    leaderboardRoute,
    profileRoute,
    adminRoute,
    vipRoute,
    coinsRoute,
    paymentSuccessRoute,
    paymentFailureRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}
