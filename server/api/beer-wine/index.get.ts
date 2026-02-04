import { fetchBeerWineFromCockpit } from "~/server/utils/cockpitHelper";
import type { BeerWineData } from "~/types";

export default defineEventHandler(async (): Promise<BeerWineData> => {
  try {
    const items = await fetchBeerWineFromCockpit();
    return {
      items,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read beer-wine data: ${errorMessage}`,
    });
  }
});
