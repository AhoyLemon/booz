import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Essential, EssentialsData } from '~/types'

export default defineEventHandler(async event => {
  try {
    const body = await readBody<{ id: string; inStock: boolean }>(event)

    if (!body.id || typeof body.inStock !== 'boolean') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request: id and inStock are required',
      })
    }

    const essentialsPath = join(process.cwd(), 'public', 'data', 'essentials.json')
    const essentialsData = JSON.parse(readFileSync(essentialsPath, 'utf-8')) as EssentialsData

    // Find and update the essential
    const essential = essentialsData.essentials.find(e => e.id === body.id)
    if (!essential) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Essential not found',
      })
    }

    essential.inStock = body.inStock

    // Update lastUpdated timestamp
    essentialsData.lastUpdated = new Date().toISOString()

    // Write back to file
    writeFileSync(essentialsPath, JSON.stringify(essentialsData, null, 2))

    return {
      success: true,
      essential,
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to update essential: ${errorMessage}`,
    })
  }
})
