import { readInventoryCSV } from '~/server/utils/csvHelper'

export default defineEventHandler(() => {
  try {
    const bottles = readInventoryCSV()
    return {
      success: true,
      bottles,
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read inventory',
    })
  }
})
