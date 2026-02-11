import { describe, it, expect } from "vitest";

// Constants for the prefixes
const BEER_PREFIX_LENGTH = 5; // "beer-" is 5 characters
const WINE_PREFIX_LENGTH = 5; // "wine-" is 5 characters

// Helper function to parse beer drink IDs
// This mirrors the logic in pages/[tenant]/drinks/[id].vue
function parseBeerDrinkId(drinkId: string): { beerId: string; servingStyle: string } {
  // Remove "beer-" prefix
  const withoutPrefix = drinkId.substring(BEER_PREFIX_LENGTH);
  // Extract serving style from the end (either "-glass" or "-bottle")
  const lastDashIndex = withoutPrefix.lastIndexOf("-");
  const servingStyle = withoutPrefix.substring(lastDashIndex + 1);
  // Everything before the last dash is the beer ID
  const beerId = withoutPrefix.substring(0, lastDashIndex);

  return { beerId, servingStyle };
}

// Helper function to parse wine drink IDs
// This mirrors the logic in pages/[tenant]/drinks/[id].vue
function parseWineDrinkId(drinkId: string): { wineId: string; servingStyle: string } {
  // Remove "wine-" prefix
  const withoutPrefix = drinkId.substring(WINE_PREFIX_LENGTH);
  // Extract serving style from the end (either "-glass" or "-ice")
  const lastDashIndex = withoutPrefix.lastIndexOf("-");
  const servingStyle = withoutPrefix.substring(lastDashIndex + 1);
  // Everything before the last dash is the wine ID
  const wineId = withoutPrefix.substring(0, lastDashIndex);

  return { wineId, servingStyle };
}

// Test the beer drink ID parsing logic
describe("Beer Drink ID Parsing", () => {
  it("should correctly parse beer drink IDs with simple beer IDs and glass serving", () => {
    const { beerId, servingStyle } = parseBeerDrinkId("beer-beer1-glass");

    expect(beerId).toBe("beer1");
    expect(servingStyle).toBe("glass");
  });

  it("should correctly parse beer drink IDs with hyphenated beer IDs", () => {
    const { beerId, servingStyle } = parseBeerDrinkId("beer-ipa-pale-ale-glass");

    expect(beerId).toBe("ipa-pale-ale");
    expect(servingStyle).toBe("glass");
  });

  it("should correctly parse beer drink IDs with bottle serving style", () => {
    const { beerId, servingStyle } = parseBeerDrinkId("beer-lager-1-bottle");

    expect(beerId).toBe("lager-1");
    expect(servingStyle).toBe("bottle");
  });

  it("should correctly parse beer drink IDs with multiple hyphens in beer ID", () => {
    const { beerId, servingStyle } = parseBeerDrinkId("beer-my-special-craft-ipa-123-bottle");

    expect(beerId).toBe("my-special-craft-ipa-123");
    expect(servingStyle).toBe("bottle");
  });
});

// Test the wine drink ID parsing logic
describe("Wine Drink ID Parsing", () => {
  it("should correctly parse wine drink IDs with simple wine IDs and glass serving", () => {
    const { wineId, servingStyle } = parseWineDrinkId("wine-wine1-glass");

    expect(wineId).toBe("wine1");
    expect(servingStyle).toBe("glass");
  });

  it("should correctly parse wine drink IDs with hyphenated wine IDs", () => {
    const { wineId, servingStyle } = parseWineDrinkId("wine-cabernet-sauvignon-glass");

    expect(wineId).toBe("cabernet-sauvignon");
    expect(servingStyle).toBe("glass");
  });

  it("should correctly parse wine drink IDs with ice serving style", () => {
    const { wineId, servingStyle } = parseWineDrinkId("wine-chardonnay-1-ice");

    expect(wineId).toBe("chardonnay-1");
    expect(servingStyle).toBe("ice");
  });

  it("should correctly parse wine drink IDs with multiple hyphens in wine ID", () => {
    const { wineId, servingStyle } = parseWineDrinkId("wine-my-special-reserve-2020-ice");

    expect(wineId).toBe("my-special-reserve-2020");
    expect(servingStyle).toBe("ice");
  });
});
