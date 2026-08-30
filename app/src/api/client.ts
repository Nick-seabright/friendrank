import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "friendrank_token";

// expo-secure-store's web shim is unreliable across bundlers, so web falls
// back to AsyncStorage (localStorage-backed there); native keeps SecureStore.
const tokenStore = {
  get: (key: string) => (Platform.OS === "web" ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key)),
  set: (key: string, value: string) =>
    Platform.OS === "web" ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  remove: (key: string) => (Platform.OS === "web" ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key)),
};

function guessApiUrl(): string {
  // Explicit override (e.g. a public tunnel URL for testing off your own Wi-Fi)
  // takes priority over guessing from the dev server's LAN address.
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Only trust the dev-server-derived LAN address in actual local dev (Expo
  // Go connected to `expo start`) — a published EAS Update has no dev server,
  // so it falls through to the real hosted backend below.
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri && __DEV__) {
    const host = hostUri.split(":")[0];
    return `http://${host}:4000`;
  }
  return "https://friendrank-api.onrender.com";
}

export const API_URL = guessApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  // Harmless everywhere else; needed so localtunnel (used for off-network
  // testing) skips its browser-facing interstitial page for API requests.
  headers: { "bypass-tunnel-reminder": "true" },
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStore.get(TOKEN_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function saveToken(token: string) {
  await tokenStore.set(TOKEN_KEY, token);
}

export async function loadToken(): Promise<string | null> {
  const token = await tokenStore.get(TOKEN_KEY);
  return token ?? null;
}

export async function clearToken() {
  await tokenStore.remove(TOKEN_KEY);
}

export interface UserSummary {
  id: string;
  displayName: string;
  emoji: string;
}

export interface Preset {
  id: string;
  label: string;
  defaultValue: number;
  polarity: "POSITIVE" | "NEGATIVE";
  isCustom: boolean;
  customCap: number | null;
  autoAcceptHours: number | null;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  leaderboardPeriod: "WEEKLY" | "MONTHLY" | "MANUAL";
  periodStartAt: string;
  createdAt: string;
  createdById: string;
  memberCount?: number;
  memberships?: { user: UserSummary }[];
}

export interface PointEntry {
  id: string;
  groupId: string;
  senderId: string;
  recipientId: string;
  presetId: string;
  value: number;
  note: string | null;
  status: "PENDING" | "ACCEPTED" | "DISPUTED" | "EXPIRED";
  createdAt: string;
  respondedAt: string | null;
  sender: UserSummary;
  recipient?: UserSummary;
  group?: { id: string; name: string };
  preset: Preset;
}

export interface LeaderboardRow {
  user: UserSummary;
  periodScore: number;
  allTimeScore: number;
  contestedCount: number;
}

export interface LeaderboardResponse {
  leaderboardPeriod: string;
  periodStartAt: string;
  board: LeaderboardRow[];
}
