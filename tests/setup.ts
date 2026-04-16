import { vi } from "vitest";

let currentToken: string | null = null;

export function setTestAccessToken(token: string | null) {
  currentToken = token;
}

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === "access_token" && currentToken) {
        return { name, value: currentToken };
      }
      return undefined;
    },
    set: () => {},
    delete: () => {},
  }),
}));
