import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Runs the sync-data script to regenerate public/data/bottles.json
 * This ensures the frontend sees the latest changes from the CSV
 */
export async function syncInventoryData(): Promise<void> {
  try {
    // Run tsx directly instead of npm run sync-data to avoid .env file requirement
    await execAsync("npx tsx scripts/sync-data.ts", {
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error("Failed to sync inventory data:", error);
    throw error;
  }
}
