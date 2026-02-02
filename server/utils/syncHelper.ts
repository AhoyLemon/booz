import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Runs the sync-data script to regenerate public/data/inventory.json
 * This ensures the frontend sees the latest changes from the CSV
 */
export async function syncInventoryData(): Promise<void> {
  try {
    await execAsync('npm run sync-data', {
      cwd: process.cwd(),
    })
  } catch (error) {
    console.error('Failed to sync inventory data:', error)
    throw error
  }
}
