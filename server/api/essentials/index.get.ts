import { readFileSync } from 'fs'
import { join } from 'path'
import type { EssentialsData } from '~/types'

export default defineEventHandler((): EssentialsData => {
  try {
    const essentialsPath = join(process.cwd(), 'public', 'data', 'essentials.json')
    const essentialsData = readFileSync(essentialsPath, 'utf-8')
    return JSON.parse(essentialsData)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read essentials data: ${errorMessage}`,
    })
  }
})
