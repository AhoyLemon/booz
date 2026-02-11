import type { Drink } from "~/types";

export const useTheCocktailDB = () => {
  const fetchRandomCocktails = async (count: number = 5): Promise<Drink[]> => {
    try {
      const promises = Array.from({ length: count }, () => fetch("https://www.thecocktaildb.com/api/json/v1/1/random.php").then((res) => res.json()));
      const results = await Promise.all(promises);
      return results.map((result, index) => {
        const drink = result.drinks[0];
        const ingredients = [];
        for (let i = 1; i <= 15; i++) {
          const ing = drink[`strIngredient${i}`];
          const measure = drink[`strMeasure${i}`];
          if (ing) {
            ingredients.push({
              name: ing,
              qty: measure || "",
              optional: false,
            });
          }
        }
        return {
          id: `cocktaildb-${drink.idDrink}`,
          name: drink.strDrink,
          ingredients,
          instructions: drink.strInstructions ? [drink.strInstructions] : [],
          imageUrl: drink.strDrinkThumb,
          prep: "",
          category:
            drink.strCategory && drink.strCategory !== "Other / Unknown" && drink.strCategory !== "Ordinary Drink"
              ? drink.strCategory
              : (drink.strTags ? drink.strTags.split(",")[0].trim() : null) || "Cocktail",
          tags: drink.strTags ? drink.strTags.split(",").map((t: string) => t.trim()) : [],
          external: true,
        };
      });
    } catch (error) {
      console.error("Failed to fetch random cocktails:", error);
      return [];
    }
  };

  const fetchCocktailDBDrinkById = async (id: string): Promise<Drink | null> => {
    try {
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`);
      const data = await response.json();

      if (!data.drinks || data.drinks.length === 0) {
        return null;
      }

      const drink = data.drinks[0];
      const ingredients = [];
      for (let i = 1; i <= 15; i++) {
        const ing = drink[`strIngredient${i}`];
        const measure = drink[`strMeasure${i}`];
        if (ing) {
          ingredients.push({
            name: ing,
            qty: measure || "",
            optional: false,
          });
        }
      }

      return {
        id: `cocktaildb-${drink.idDrink}`,
        name: drink.strDrink,
        ingredients,
        instructions: drink.strInstructions ? [drink.strInstructions] : [],
        imageUrl: drink.strDrinkThumb,
        prep: "",
        category:
          drink.strCategory && drink.strCategory !== "Other / Unknown" && drink.strCategory !== "Ordinary Drink"
            ? drink.strCategory
            : (drink.strTags ? drink.strTags.split(",")[0].trim() : null) || "Cocktail",
        tags: drink.strTags ? drink.strTags.split(",").map((t: string) => t.trim()) : [],
        external: true,
      };
    } catch (error) {
      console.error("Failed to fetch cocktail by ID:", error);
      return null;
    }
  };

  return {
    fetchRandomCocktails,
    fetchCocktailDBDrinkById,
  };
};
