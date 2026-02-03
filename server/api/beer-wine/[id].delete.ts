import { readBeerWineData, writeBeerWineData } from '~/server/utils/beerWineHelper'

export default defineEventHandler(async event => {
  try {
    const id = getRouterParam(event, 'id')

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

    items.splice(index, 1)
    writeBeerWineData(items)

    return {
      success: true,
      message: 'Beer/wine item deleted successfully',
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete beer/wine item',
    })
  }
})
