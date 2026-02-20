import "dotenv/config";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js utilise .env.local, dotenv utilise .env — on charge les deux
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
