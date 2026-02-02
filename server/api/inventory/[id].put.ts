import { readInventoryCSV, writeInventoryCSV, normalizeImagePath } from '~/server/utils/csvHelper'
import { syncInventoryData } from '~/server/utils/syncHelper'
import type { Bottle } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody<Partial<Bottle>>(event)

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Bottle ID is required',
      })
    }

    const bottles = readInventoryCSV()
    const index = bottles.findIndex((b) => b.id === id)

    if (index === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Bottle not found',
      })
    }

    // Update bottle with provided fields, normalizing image path if provided
    const updatedBottle: Bottle = {
      ...bottles[index],
      ...body,
      id, // Ensure ID doesn't change
      image: body.image !== undefined ? normalizeImagePath(body.image) : bottles[index].image,
    }

    bottles[index] = updatedBottle
    writeInventoryCSV(bottles)

    // Sync data to regenerate public/data/inventory.json
    await syncInventoryData()

    return {
      success: true,
      bottle: updatedBottle,
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update bottle',
    })
  }
})
