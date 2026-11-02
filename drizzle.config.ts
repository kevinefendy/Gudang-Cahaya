import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "mysql",
    schema: "./src/config/schema.ts",
    out: "./drizzle",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
