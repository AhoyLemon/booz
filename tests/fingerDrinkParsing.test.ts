import { describe, it, expect } from "vitest";

// Constant for the "finger-" prefix length
const FINGER_PREFIX_LENGTH = 7; // "finger-" is 7 characters

// Helper function to parse finger drink IDs
// This mirrors the logic in pages/[tenant]/drinks/[id].vue
function parseFingerDrinkId(drinkId: string): { bottleId: string; servingStyle: string } {
  // Remove "finger-" prefix
  const withoutPrefix = drinkId.substring(FINGER_PREFIX_LENGTH);
  // Extract serving style from the end (either "-straight" or "-rocks")
  const lastDashIndex = withoutPrefix.lastIndexOf("-");
  const servingStyle = withoutPrefix.substring(lastDashIndex + 1);
  // Everything before the last dash is the bottle ID
  const bottleId = withoutPrefix.substring(0, lastDashIndex);

  return { bottleId, servingStyle };
}

// Test the finger drink ID parsing logic
describe("Finger Drink ID Parsing", () => {
  it("should correctly parse finger drink IDs with simple bottle IDs", () => {
    const { bottleId, servingStyle } = parseFingerDrinkId("finger-bottle1-straight");

    expect(bottleId).toBe("bottle1");
    expect(servingStyle).toBe("straight");
  });

  it("should correctly parse finger drink IDs with hyphenated bottle IDs", () => {
    const { bottleId, servingStyle } = parseFingerDrinkId("finger-bottle-31-straight");

    expect(bottleId).toBe("bottle-31");
    expect(servingStyle).toBe("straight");
  });

  it("should correctly parse finger drink IDs with rocks serving style", () => {
    const { bottleId, servingStyle } = parseFingerDrinkId("finger-bottle-31-rocks");

    expect(bottleId).toBe("bottle-31");
    expect(servingStyle).toBe("rocks");
  });

  it("should correctly parse finger drink IDs with multiple hyphens in bottle ID", () => {
    const { bottleId, servingStyle } = parseFingerDrinkId("finger-my-special-bottle-123-straight");

    expect(bottleId).toBe("my-special-bottle-123");
    expect(servingStyle).toBe("straight");
  });
});
