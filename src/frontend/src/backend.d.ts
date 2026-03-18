import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PrivateMessage {
    content: string;
    messageId: bigint;
    sender: Principal;
    timestamp: Timestamp;
    receiver: Principal;
}
export interface LeaderboardEntry {
    username: string;
    userId: Principal;
    gameId: GameId;
    score: bigint;
    timestamp: Timestamp;
}
export type Timestamp = bigint;
export interface ChatMessage {
    content: string;
    messageId: bigint;
    sender: Principal;
    timestamp: Timestamp;
    senderName: string;
    roomId: bigint;
}
export interface PlatformStats {
    totalMessages: bigint;
    totalUsers: bigint;
    topPlayers: Array<LeaderboardEntry>;
}
export interface ChatRoom {
    name: string;
    createdBy: Principal;
    description: string;
    isVIP: boolean;
    roomId: bigint;
}
export interface UserProfile {
    xp: bigint;
    bio: string;
    username: string;
    badges: Array<Badge>;
    role: UserRole;
    level: bigint;
    avatarUrl: string;
    isBanned: boolean;
    isVIP: boolean;
}
export interface ShoppingItem {
    currency: string;
    productName: string;
    productDescription: string;
    priceInCents: bigint;
    quantity: bigint;
}
export interface StripeConfiguration {
    secretKey: string;
    allowedCountries: Array<string>;
}
export type StripeSessionStatus =
    | { __kind__: "failed"; error: string }
    | { __kind__: "completed"; response: string; userPrincipal: string | null };
export enum Badge {
    vip = "vip",
    admin = "admin",
    highScore = "highScore",
    founder = "founder"
}
export enum GameId {
    shooting = "shooting",
    quiz = "quiz",
    racing = "racing"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addXp(user: Principal, xp: bigint): Promise<void>;
    assignAdminRole(user: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignVIP(user: Principal): Promise<void>;
    banUser(user: Principal): Promise<void>;
    createRoom(name: string, description: string, isVIP: boolean): Promise<bigint>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteRoom(roomId: bigint): Promise<void>;
    generateStory(genre: string, prompt: string): Promise<string>;
    generateTitles(topic: string): Promise<Array<string>>;
    getAllRooms(): Promise<Array<ChatRoom>>;
    getAllUsersByUsername(): Promise<Array<UserProfile>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConversation(otherUser: Principal): Promise<Array<PrivateMessage>>;
    getLeaderboard(gameId: GameId): Promise<Array<LeaderboardEntry>>;
    getPlatformStats(): Promise<PlatformStats>;
    getRecentMessages(roomId: bigint): Promise<Array<ChatMessage>>;
    getSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    postMessage(roomId: bigint, content: string): Promise<void>;
    resetLeaderboard(gameId: GameId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendPrivateMessage(receiver: Principal, content: string): Promise<void>;
    setOwner(): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    submitScore(gameId: GameId, score: bigint): Promise<void>;
    unbanUser(user: Principal): Promise<void>;
}
