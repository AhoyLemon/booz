// Ingredient Hierarchy (One-way Fulfillment)
// --------------------------------------------------
// This file defines parent-child relationships for ingredient fulfillment.
// If a recipe calls for a parent (e.g., "whiskey"), any child (e.g., "irish whiskey") can fulfill it.
// If a recipe calls for a child (e.g., "irish whiskey"), only that child can fulfill it—NOT the parent.
//
// Use this for specificity, category, and form relationships:
//   - Spirits: "whiskey" → ["bourbon", "rye", ...]
//   - Fruits: "lime juice" → ["lime", "limes", "fresh lime", ...]
//   - Forms: "lemon wedge" → ["lemon", "lemons", ...]
//
// DO NOT use this for true alternate names or spelling variations—those belong in ingredientSynonyms.ts.
//
// This mapping is used to determine if a more specific ingredient can fulfill a more general one in recipes.

export const ingredientHierarchy: Record<string, string[]> = {
  gin: ["london dry", "old tom", "navy strength gin", "plymouth gin"],
  whiskey: ["bourbon", "rye", "irish whiskey", "american whiskey"],
  rum: ["white rum", "dark rum", "spiced rum", "aged rum", "overproofed rum"],
  tequila: ["blanco", "reposado", "añejo", "mezcal", "silver", "mixto"],
  wine: ["red wine", "white wine", "rose wine", "sparkling wine", "champagne"],
  "red wine": ["merlot", "cabernet sauvignon", "pinot noir", "zinfandel", "syrah", "shiraz", "malbec"],
  "white wine": ["chardonnay", "sauvignon blanc", "pinot grigio", "riesling"],

  // Fruit: whole/fresh/plural can fulfill juice, but not vice versa
  citrus: ["lime", "lemon", "orange", "grapefruit"],
  "lime juice": ["lime", "limes", "fresh lime", "fresh limes"],
  "lime wheel": ["lime", "limes", "fresh lime", "fresh limes"],
  "lime wedge": ["lime", "limes", "fresh lime", "fresh limes"],
  "lime peel": ["lime", "limes", "fresh lime", "fresh limes"],
  "lemon juice": ["lemon", "lemons", "fresh lemon", "fresh lemons"],
  "lemon wheel": ["lemon", "lemons", "fresh lemon", "fresh lemons"],
  "lemon wedge": ["lemon", "lemons", "fresh lemon", "fresh lemons"],
  "lemon peel": ["lemon", "lemons", "fresh lemon", "fresh lemons"],
  "orange juice": ["orange", "oranges", "fresh orange", "fresh oranges"],
  "orange wheel": ["orange", "oranges", "fresh orange", "fresh oranges"],
  "orange wedge": ["orange", "oranges", "fresh orange", "fresh oranges"],
  "orange peel": ["orange", "oranges", "fresh orange", "fresh oranges"],
  "grapefruit juice": ["grapefruit", "grapefruits", "fresh grapefruit", "fresh grapefruits"],
  "grapefruit wheel": ["grapefruit", "grapefruits", "fresh grapefruit", "fresh grapefruits"],
  "grapefruit wedge": ["grapefruit", "grapefruits", "fresh grapefruit", "fresh grapefruits"],
  "grapefruit peel": ["grapefruit", "grapefruits", "fresh grapefruit", "fresh grapefruits"],
};
