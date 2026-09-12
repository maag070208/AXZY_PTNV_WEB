const BASE_URL =
  ((import.meta as any).env?.VITE_API_URL as string | undefined) ?? "/api/v1";

export const API_CONSTANTS = {
  BASE_URL,
  TIMEOUT: 30000,
  HEADERS: {
    "Content-Type": "application/json",
  },
} as const;