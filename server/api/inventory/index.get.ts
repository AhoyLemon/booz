import { fetchBottlesFromCockpit } from "~/server/utils/cockpitHelper";
import type { InventoryData } from "~/types";

export default defineEventHandler(async (): Promise<InventoryData> => {
  try {
    const bottles = await fetchBottlesFromCockpit();
    return {
      bottles,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read inventory: ${errorMessage}`,
    });
  }
});
