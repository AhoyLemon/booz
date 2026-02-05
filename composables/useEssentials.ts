// Composable for managing essential ingredients checklist
import type { Essential, EssentialsRawData } from "~/types";

// Process raw Cockpit data into Essential items - exported for use in other composables
export const processEssentialsData = (data: EssentialsRawData): Essential[] => {
  const processed: Essential[] = [];

  if (!data) {
    console.error("No data provided to processEssentialsData");
    return processed;
  }

  // Process string arrays (basics, carbonatedMixers, etc.)
  const stringArrayCategories = [
    { key: "basics", category: "Basics" },
    { key: "carbonatedMixers", category: "Carbonated & Mixers" },
    { key: "fruitsBerries", category: "Fruits & Berries" },
    { key: "sweeteners", category: "Sweeteners" },
    { key: "dairyCream", category: "Dairy & Cream" },
    { key: "juices", category: "Juices" },
    { key: "other", category: "Other" },
  ];

  stringArrayCategories.forEach(({ key, category }) => {
    const items = data[key as keyof EssentialsRawData] as string[] | undefined;
    if (Array.isArray(items) && items.length > 0) {
      items.forEach((item, index) => {
        if (item && typeof item === "string") {
          processed.push({
            id: `${key}-${index}`,
            name: item,
            category,
            inStock: true, // All items in the data are in stock
          });
        }
      });
    }
  });

  // Process bitters array (array of objects)
  if (Array.isArray(data.bitters) && data.bitters.length > 0) {
    // Add a general "bitters" item if any bitters exist
    processed.push({
      id: "bitters-general",
      name: "Bitters",
      category: "Bitters & Aromatics",
      inStock: true,
    });

    // Add each specific flavor
    data.bitters.forEach((bitter, bitterIndex) => {
      if (bitter && Array.isArray(bitter.flavors)) {
        bitter.flavors.forEach((flavor, flavorIndex) => {
          if (flavor && typeof flavor === "string") {
            processed.push({
              id: `bitters-${bitterIndex}-${flavorIndex}`,
              name: `${flavor} bitters`,
              category: "Bitters & Aromatics",
              inStock: true,
            });
          }
        });
      }
    });
  }

  return processed;
};

export const useEssentials = () => {
  const essentials = useState<Essential[]>("essentials", () => []);
  const loading = useState<boolean>("essentialsLoading", () => false);
  const error = useState<string | null>("essentialsError", () => null);

  // Category configuration matching the new Cockpit structure
  const essentialCategories = [
    { name: "Basics", icon: "🧊", key: "basics" },
    { name: "Bitters & Aromatics", icon: "🌿", key: "bitters" },
    { name: "Carbonated & Mixers", icon: "🥤", key: "carbonatedMixers" },
    { name: "Fruits & Berries", icon: "🍋", key: "fruitsBerries" },
    { name: "Sweeteners", icon: "🍯", key: "sweeteners" },
    { name: "Dairy & Cream", icon: "🥛", key: "dairyCream" },
    { name: "Juices", icon: "🥤", key: "juices" },
    { name: "Other", icon: "📦", key: "other" },
  ];

  // Fetch essentials from server
  const fetchEssentials = async () => {
    loading.value = true;
    error.value = null;
    try {
      const cockpitAPI = useCockpitAPI();
      const rawData = await cockpitAPI.fetchEssentials();
      console.log("Raw essentials data from Cockpit:", rawData);
      essentials.value = processEssentialsData(rawData as EssentialsRawData);
      console.log("Processed essentials:", essentials.value);
    } catch (e: any) {
      error.value = e.message || "Failed to load essentials";
      console.error("Failed to fetch essentials:", e);
    } finally {
      loading.value = false;
    }
  };

  // Get items for a category
  const getItemsForCategory = (categoryName: string) => {
    return essentials.value.filter((e) => e.category === categoryName);
  };

  const totalEssentials = computed(() => essentials.value.length);

  const checkedCount = computed(() => essentials.value.filter((e) => e.inStock).length);

  const completionPercentage = computed(() => {
    if (totalEssentials.value === 0) return 0;
    return Math.round((checkedCount.value / totalEssentials.value) * 100);
  });

  return {
    essentials,
    essentialCategories,
    loading,
    error,
    fetchEssentials,
    getItemsForCategory,
    totalEssentials,
    checkedCount,
    completionPercentage,
  };
};
