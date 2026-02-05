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
  "cherry liqueur": ["maraschino liqueur"],
  "coffee liqueur": ["kahlua", "kahlúa", "licor de café", "licor de cafe"],
  "creme de cacao": ["crème de cacao", "chocolate liqueur"],
  "crème de violette": ["creme de violette", "creme de violet", "violet liqueur"],
  "dark rum": ["black rum"],
  egg: ["eggs", "fresh egg", "fresh eggs"],
  grapefruit: ["grapefruits", "fresh grapefruit"],
  grenadine: ["pomegranate syrup", "rose's grenadine"],
  "st-germain": ["st. germain", "st germain", "elderflower liqueur"],
  lemon: ["lemons", "fresh lemon"],
  "light rum": ["white rum", "silver rum"],
  lime: ["limes", "fresh lime", "fresh limes"],
  mint: ["fresh mint", "mint leaves"],
  orange: ["oranges", "fresh orange"],
  pineapple: ["pineapples", "fresh pineapple"],
  "silver tequila": ["blanco tequila", "white tequila", "plata tequila", "blanco", "plata"],
  "simple syrup": ["syrup", "sugar syrup", "sugar"],
  pop: ["cola", "coke", "dr pepper", "pepsi", "soda pop"],
  sprite: ["7 up", "7up", "lemon-lime soda"],
  strawberry: ["strawberries", "fresh strawberry", "fresh strawberries"],
  tequila: ["mezcal"],
  tonic: ["tonic water"],
  "triple sec": ["orange liqueur", "cointreau"],
  whiskey: ["whisky"],
};
