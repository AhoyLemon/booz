// Composable for managing essential ingredients checklist
import type { Essential, EssentialsRawData } from "~/types";
import { categorizeEssential, getEssentialCategories } from "~/utils/essentialCategories";

// Process raw Cockpit data into Essential items - exported for use in other composables
export const processEssentialsData = (data: EssentialsRawData, bittersData?: any[]): Essential[] => {
  const processed: Essential[] = [];

  if (!data) {
    console.error("No data provided to processEssentialsData");
    return processed;
  }

  // Check if it's the new format (array of strings)
  if (Array.isArray(data)) {
    // Process the array of strings
    data.forEach((item, index) => {
      if (item && typeof item === "string") {
        processed.push({
          id: `essential-${index}`,
          name: item,
          category: categorizeEssential(item), // Use keyword-based categorization
          inStock: true, // All items in the data are in stock
        });
      }
    });

    // Automatically add "bitters" as an essential if the bar has bitters
    if (bittersData && bittersData.length > 0) {
      processed.push({
        id: "bitters-auto",
        name: "bitters",
        category: "Other", // Bitters go in Other category
        inStock: true,
      });
    }
  } else {
    // Fall back to old complex object structure
    const oldData = data as any;

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
      const items = oldData[key];
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
    if (Array.isArray(oldData.bitters) && oldData.bitters.length > 0) {
      // Add a general "bitters" item if any bitters exist
      processed.push({
        id: "bitters-general",
        name: "Bitters",
        category: "Bitters & Aromatics",
        inStock: true,
      });

      // Add each specific flavor
      oldData.bitters.forEach((bitter: any, bitterIndex: number) => {
        if (bitter && Array.isArray(bitter.flavors)) {
          bitter.flavors.forEach((flavor: any, flavorIndex: number) => {
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
  }

  return processed;
};

export const useEssentials = (tenantSlug?: string) => {
  const defaultSlug = getDefaultTenantConfig().slug;
  const essentials = useState<Essential[]>(`${tenantSlug || defaultSlug}_essentials`, () => []);
  const bitters = useState<any[]>(`${tenantSlug || defaultSlug}_bitters`, () => []);
  const loading = useState<boolean>(`${tenantSlug || defaultSlug}_essentialsLoading`, () => false);
  const error = useState<string | null>(`${tenantSlug || defaultSlug}_essentialsError`, () => null);

  // Category configuration - dynamically generated from ESSENTIAL_CATEGORIES
  const essentialCategories = getEssentialCategories();

  // Fetch essentials from server
  const fetchEssentials = async () => {
    loading.value = true;
    error.value = null;
    try {
      const cockpitAPI = useCockpitAPI(tenantSlug);
      const [essentialsData, barData] = await Promise.all([cockpitAPI.fetchEssentials(), cockpitAPI.fetchBarData()]);
      const bittersData = barData.bitters || [];
      essentials.value = processEssentialsData(essentialsData as EssentialsRawData, bittersData);
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
