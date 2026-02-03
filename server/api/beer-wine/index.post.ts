import { readBeerWineData, writeBeerWineData, getNextBeerWineId } from '~/server/utils/beerWineHelper'
import type { BeerWine } from '~/types'

export default defineEventHandler(async event => {
  try {
    const body = await readBody<Partial<BeerWine>>(event)

    // Validate required fields
    if (!body.name || !body.type) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Name and type are required',
      })
    }

    // For wine, subtype is required; for beer, it's optional
    if (body.type === 'wine' && !body.subtype) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Wine type (subtype) is required for wines',
      })
    }

    const items = readBeerWineData()
    const newItem: BeerWine = {
      id: getNextBeerWineId(items),
      name: body.name,
      type: body.type,
      subtype: body.subtype,
      inStock: body.inStock ?? true,
      image: body.image,
    }

    items.push(newItem)
    writeBeerWineData(items)

    return {
      success: true,
      item: newItem,
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create beer/wine item',
    })
  }
})
