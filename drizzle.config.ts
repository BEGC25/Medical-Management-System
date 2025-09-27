import { defineConfig } from "drizzle-kit";

// Use SQLite for local development
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "./clinic.db",
  },
});
