import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, GameId, type UserProfile, UserRole } from "../backend.d";
import { useActor } from "./useActor";

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePlatformStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["platformStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPlatformStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useAllRooms() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["chatRooms"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRooms();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecentMessages(roomId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["messages", roomId?.toString()],
    queryFn: async () => {
      if (!actor || roomId === null) return [];
      return actor.getRecentMessages(roomId);
    },
    enabled: !!actor && !isFetching && roomId !== null,
    refetchInterval: 3000,
  });
}

export function useConversation(otherUser: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["conversation", otherUser?.toString()],
    queryFn: async () => {
      if (!actor || !otherUser) return [];
      return actor.getConversation(otherUser);
    },
    enabled: !!actor && !isFetching && !!otherUser,
    refetchInterval: 3000,
  });
}

export function useAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsersByUsername();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLeaderboard(gameId: GameId) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["leaderboard", gameId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard(gameId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function usePostMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      roomId,
      content,
    }: { roomId: bigint; content: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.postMessage(roomId, content);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["messages", variables.roomId.toString()],
      });
    },
  });
}

export function useSendPrivateMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      receiver,
      content,
    }: { receiver: Principal; content: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.sendPrivateMessage(receiver, content);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["conversation", variables.receiver.toString()],
      });
    },
  });
}

export function useSubmitScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      gameId,
      score,
    }: { gameId: GameId; score: bigint }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.submitScore(gameId, score);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["leaderboard", variables.gameId],
      });
    },
  });
}

export function useAddXp() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ user, xp }: { user: Principal; xp: bigint }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addXp(user, xp);
    },
  });
}

export function useCreateRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
      isVIP,
    }: { name: string; description: string; isVIP: boolean }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createRoom(name, description, isVIP);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
    },
  });
}

export function useDeleteRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roomId: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteRoom(roomId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
    },
  });
}

export function useBanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.banUser(user);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useUnbanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.unbanUser(user);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useAssignVIP() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.assignVIP(user);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useAssignAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.assignAdminRole(user);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useResetLeaderboard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gameId: GameId) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.resetLeaderboard(gameId);
    },
    onSuccess: (_data, gameId) => {
      void queryClient.invalidateQueries({ queryKey: ["leaderboard", gameId] });
    },
  });
}

export function useGenerateStory() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      genre,
      prompt,
    }: { genre: string; prompt: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.generateStory(genre, prompt);
    },
  });
}

export function useGenerateTitles() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (topic: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.generateTitles(topic);
    },
  });
}

export { Badge, GameId, UserRole };
