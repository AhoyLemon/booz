import type { EssentialsData } from "~/types";
import { fetchEssentialsFromCockpit } from "~/server/utils/cockpitHelper";

export default defineEventHandler(async (): Promise<EssentialsData> => {
  try {
    const essentials = await fetchEssentialsFromCockpit();
    return {
      essentials,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read essentials data: ${errorMessage}`,
    });
  }
});
