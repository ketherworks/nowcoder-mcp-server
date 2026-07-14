import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/nowcoder/test/**/*.test.ts"]
  }
});
