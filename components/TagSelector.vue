<template lang="pug">
.tag-selector-component
  .selected-tags(v-if="selectedTags.length > 0")
    .selected-tag(v-for="tag in selectedTags" :key="tag")
      span {{ tag }}
      button.remove-tag(@click="removeTag(tag)" type="button") ×
  
  .tag-categories
    .tag-category(v-for="category in tagHierarchy" :key="category.name")
      .category-header
        button.category-toggle(
          @click="toggleCategory(category.name)"
          :class="{ expanded: expandedCategories.has(category.name) }"
          type="button"
        )
          span.toggle-icon {{ expandedCategories.has(category.name) ? '▼' : '▶' }}
          span.category-name {{ category.name }}
      
      .category-tags(v-if="expandedCategories.has(category.name)")
        button.tag-option(
          v-for="tag in category.tags"
          :key="tag"
          @click="toggleTag(tag, category.name)"
          :class="{ selected: selectedTags.includes(tag), disabled: isTagDisabled(tag, category.name) }"
          :disabled="isTagDisabled(tag, category.name)"
          type="button"
        )
          span.check-icon(v-if="selectedTags.includes(tag)") ✓
          | {{ tag }}
</template>

<script setup lang="ts">
  interface TagCategory {
    name: string;
    tags: string[];
    parent?: string; // Parent tag required for this category
  }

  const props = defineProps<{
    modelValue: string[];
  }>();

  const emit = defineEmits<{
    (e: "update:modelValue", value: string[]): void;
  }>();

  const selectedTags = computed({
    get: () => props.modelValue,
    set: (value: string[]) => emit("update:modelValue", value),
  });

  const expandedCategories = ref(new Set<string>());

  // Define tag hierarchy with parent-child relationships
  const tagHierarchy: TagCategory[] = [
    {
      name: "Base Spirits",
      tags: ["vodka", "gin", "rum", "tequila", "whiskey", "liqueur", "absinthe", "premix", "garnish", "bitters"],
    },
    {
      name: "Whiskey Types",
      tags: [
        "bourbon",
        "scotch",
        "rye",
        "irish whiskey",
        "single malt",
        "japanese whiskey",
        "american whiskey",
        "canadian whiskey",
        "4-6 year",
        "6-12 year",
        "12+ year",
      ],
      parent: "whiskey",
    },
    {
      name: "Tequila Types",
      tags: ["blanco", "reposado", "añejo", "mezcal", "silver", "mixto"],
      parent: "tequila",
    },
    {
      name: "Gin Types",
      tags: ["london dry", "old tom", "navy strength gin", "plymouth gin"],
      parent: "gin",
    },
    {
      name: "Rum Types",
      tags: ["white rum", "dark rum", "spiced rum", "aged rum", "overproofed rum"],
      parent: "rum",
    },
    {
      name: "Liqueurs & Spirits",
      tags: [
        "vermouth",
        "amaro",
        "bitters",
        "chocolate liqueur",
        "creme de cacao",
        "creme de violette",
        "cherry liqueur",
        "maraschino",
        "anise liqueur",
        "schnapps",
        "mint liqueur",
        "creme de menthe",
        "coffee liqueur",
        "melon liqueur",
        "elderflower liqueur",
        "aquavit",
        "grapefruit liqueur",
        "orange liqueur",
        "triple sec",
        "blood orange liqueur",
        "cream liqueur",
        "bourbon cream",
        "peanut brittle liqueur",
        "ginger liqueur",
        "lemon liqueur",
      ],
      parent: "liqueur",
    },
    {
      name: "Modifiers & Mixers",
      tags: [
        "citrus",
        "syrup",
        "juice",
        "soda",
        "tonic",
        "sugar",
        "agave",
        "tomato",
        "bloody mary",
        "lemon",
        "pomegranate",
        "grenadine",
        "molasses",
        "ginger",
        "allspice",
        "lavender",
        "sparkly",
      ],
    },
    {
      name: "Other",
      tags: ["beer", "wine", "champagne", "sake", "old fashioned", "cherries"],
    },
  ];

  const toggleCategory = (categoryName: string) => {
    if (expandedCategories.value.has(categoryName)) {
      expandedCategories.value.delete(categoryName);
    } else {
      expandedCategories.value.add(categoryName);
    }
  };

  const isTagDisabled = (tag: string, categoryName: string): boolean => {
    // Find the category for this tag
    const category = tagHierarchy.find((c) => c.name === categoryName);

    // If category has a parent requirement, check if parent tag is selected
    if (category?.parent) {
      return !selectedTags.value.includes(category.parent);
    }

    return false;
  };

  const toggleTag = (tag: string, categoryName: string) => {
    if (isTagDisabled(tag, categoryName)) {
      return;
    }

    const index = selectedTags.value.indexOf(tag);

    if (index > -1) {
      // Remove tag and any dependent tags
      const newTags = [...selectedTags.value];
      newTags.splice(index, 1);

      // Remove any tags that depend on this tag
      const dependentTags = tagHierarchy.filter((c) => c.parent === tag).flatMap((c) => c.tags);

      const filteredTags = newTags.filter((t) => !dependentTags.includes(t));
      selectedTags.value = filteredTags;

      // Auto-collapse dependent categories when parent is removed
      tagHierarchy.filter((c) => c.parent === tag).forEach((c) => expandedCategories.value.delete(c.name));
    } else {
      // Add tag
      selectedTags.value = [...selectedTags.value, tag];

      // Auto-expand dependent categories when parent is added
      tagHierarchy.filter((c) => c.parent === tag).forEach((c) => expandedCategories.value.add(c.name));
    }
  };

  const removeTag = (tag: string) => {
    const index = selectedTags.value.indexOf(tag);
    if (index > -1) {
      const newTags = [...selectedTags.value];
      newTags.splice(index, 1);

      // Remove any tags that depend on this tag
      const dependentTags = tagHierarchy.filter((c) => c.parent === tag).flatMap((c) => c.tags);

      const filteredTags = newTags.filter((t) => !dependentTags.includes(t));
      selectedTags.value = filteredTags;

      // Auto-collapse dependent categories when parent is removed
      tagHierarchy.filter((c) => c.parent === tag).forEach((c) => expandedCategories.value.delete(c.name));
    }
  };

  // Expand categories with parent dependencies by default
  onMounted(() => {
    expandedCategories.value.add("Base Spirits");

    // Auto-expand categories for already selected tags
    selectedTags.value.forEach((tag) => {
      tagHierarchy.filter((c) => c.parent === tag).forEach((c) => expandedCategories.value.add(c.name));
    });
  });
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;

  .tag-selector-component {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  .selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    padding: $spacing-sm;
    background: color.adjust($light-bg, $lightness: 2%);
    border-radius: $border-radius-sm;
    min-height: 40px;
  }

  .selected-tag {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    background: $primary-color;
    color: white;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .remove-tag {
    background: transparent;
    border: none;
    color: white;
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
    padding: 0 $spacing-xs;
    margin-left: $spacing-xs;

    &:hover {
      color: color.adjust($primary-color, $lightness: -30%);
    }
  }

  .tag-categories {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  .tag-category {
    border: 1px solid $border-color;
    border-radius: $border-radius-sm;
    overflow: hidden;
  }

  .category-header {
    background: $light-bg;
    border-bottom: 1px solid $border-color;
  }

  .category-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: transparent;
    border: none;
    cursor: pointer;
    font-weight: 600;
    text-align: left;
    transition: background 0.2s ease;

    &:hover {
      background: color.adjust($light-bg, $lightness: -5%);
    }

    &.expanded {
      background: white;
    }
  }

  .toggle-icon {
    font-size: 0.75rem;
    color: $text-dark;
    transition: transform 0.2s ease;
  }

  .category-name {
    flex: 1;
    color: $text-dark;
  }

  .category-tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    padding: $spacing-md;
    background: white;
  }

  .tag-option {
    padding: $spacing-xs $spacing-md;
    border: 2px solid $border-color;
    border-radius: $border-radius-sm;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    &:hover:not(:disabled) {
      border-color: $primary-color;
      background: color.adjust($primary-color, $lightness: 45%);
    }

    &.selected {
      background: $primary-color;
      color: white;
      border-color: $primary-color;
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: color.adjust($light-bg, $lightness: 5%);
    }
  }

  .check-icon {
    font-size: 0.75rem;
    font-weight: 700;
  }
</style>
