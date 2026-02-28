import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      DATABASE_URL:
        "postgresql://slotify:slotify@localhost:5432/slotify_test",
      JWT_SECRET: "slotify-test-secret-key-at-least-32-chars-long",
      PORT: "3001",
      NODE_ENV: "test",
    },
    // Run test files serially to avoid DB conflicts
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
