// Lemonbar Ingredient Synonyms
// ---------------------------------------------
// This file defines alternate names (synonyms) for ingredients.
// Use this for spelling variations, plural/singular, and true alternate names ONLY.
//
// Example: "blueberry" and "blueberries" are synonyms, as are "cocktail cherry" and "maraschino cherries".
//
// DO NOT use this for parent/child or category relationships (e.g., don't list "bourbon" as a synonym for "whiskey").
// Those relationships belong in ingredientHierarchy.ts.
//
// This mapping is used for exact and fuzzy matching of ingredient names in recipes and inventory.

export const ingredientSynonyms: Record<string, string[]> = {
  beer: ["beer", "lager", "ale"],
  blueberry: ["blueberries", "fresh blueberry", "fresh blueberries"],
  "club soda": ["soda water"],
  "cocktail cherries": ["cherries", "cherry", "cocktail cherry", "maraschino cherries", "maraschino cherry"],
  cranberry: ["cranberries", "fresh cranberry", "fresh cranberries"],
  "creme de cacao": ["crème de cacao", "chocolate liqueur"],
  "dark rum": ["black rum"],
  grapefruit: ["grapefruits", "fresh grapefruit"],
  grenadine: ["pomegranate syrup", "rose's grenadine"],
  kahlua: ["kahlúa", "coffee liqueur"],
  "st-germain": ["st. germain", "st germain", "elderflower liqueur"],
  lemon: ["lemons", "fresh lemon"],
  "light rum": ["white rum", "silver rum"],
  lime: ["limes", "fresh lime"],
  orange: ["oranges", "fresh orange"],
  pineapple: ["pineapples", "fresh pineapple"],
  "silver tequila": ["blanco tequila", "white tequila", "plata tequila", "blanco", "plata"],
  "simple syrup": ["syrup", "sugar syrup", "sugar"],
  pop: ["cola", "coke", "dr pepper", "pepsi", "soda pop"],
  strawberry: ["strawberries", "fresh strawberry", "fresh strawberries"],
  tequila: ["mezcal"],
  tonic: ["tonic water"],
  "triple sec": ["orange liqueur", "cointreau"],
  whiskey: ["whisky"],
};
