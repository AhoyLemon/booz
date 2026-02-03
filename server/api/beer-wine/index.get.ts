import { readBeerWineData } from '~/server/utils/beerWineHelper'

export default defineEventHandler(() => {
  try {
    const items = readBeerWineData()
    return {
      success: true,
      items,
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read beer-wine data',
    })
  }
})
