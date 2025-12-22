/// <reference types="node" />
import "dotenv/config";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const password = process.env.POSTGRES_PASSWORD;
if (!password) {
  console.error("Error: POSTGRES_PASSWORD not found in .env file");
  process.exit(1);
}

// Docker Compose port mapping (default 5433)
const port = "5433";
const host = "localhost";
const user = "postgres";
const db = "postgres";

const dbUrl = `postgresql://${user}:${password}@${host}:${port}/${db}`;

console.log(`Generating types from ${dbUrl}...`);

// Ensure directory exists
const outputDir = path.resolve(__dirname, "../app/types");
const outputFile = path.join(outputDir, "database.types.ts");

await fs.mkdir(outputDir, { recursive: true });

exec(
  `supabase gen types typescript --db-url "${dbUrl}"`,
  { maxBuffer: 1024 * 1024 * 10 },
  async (
    error: import("child_process").ExecException | null,
    stdout: string,
    stderr: string
  ) => {
    if (error) {
      console.error("❌ Error generating types:");
      console.error(stderr);
      process.exit(error.code || 1);
    }

    try {
      await fs.writeFile(outputFile, stdout);
      console.log(`✅ Types generated successfully at ${outputFile}`);
    } catch (writeErr) {
      console.error("❌ Error writing file:");
      console.error(writeErr);
      process.exit(1);
    }
  }
);
