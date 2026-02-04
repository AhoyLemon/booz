import { fetchDrinksFromCockpit } from "~/server/utils/cockpitHelper";
import type { DrinkData } from "~/types";

export default defineEventHandler(async (): Promise<DrinkData> => {
  try {
    const drinks = await fetchDrinksFromCockpit();
    return {
      drinks,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch drinks: ${errorMessage}`,
    });
  }
});
