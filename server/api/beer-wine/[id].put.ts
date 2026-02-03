import { readBeerWineData, writeBeerWineData } from '~/server/utils/beerWineHelper'
import type { BeerWine } from '~/types'

export default defineEventHandler(async event => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody<Partial<BeerWine>>(event)

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID is required',
      })
    }

    const items = readBeerWineData()
    const index = items.findIndex(item => item.id === id)

    if (index === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Beer/wine item not found',
      })
    }

    // Update the item
    const updatedItem: BeerWine = {
      ...items[index],
      ...body,
      id: items[index].id, // Preserve the ID
    }

    items[index] = updatedItem
    writeBeerWineData(items)

    return {
      success: true,
      item: updatedItem,
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update beer/wine item',
    })
  }
})
