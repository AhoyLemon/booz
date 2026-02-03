<template lang="pug">
.manage-bottles-page
  .container
    .header-section.mb-3
      h2 Manage Bottles
      p Add, edit, or remove bottles from your collection
      NuxtLink.back-btn(to="/bottles") ← Back to Bottles

    .content-grid
      .form-section
        h3 {{ editingBottle ? 'Edit Bottle' : 'Add New Bottle' }}
        form.bottle-form(@submit.prevent="handleSubmit")
          .form-group
            label(for="name") Name *
            input#name(v-model="form.name" type="text" required placeholder="e.g., Beefeater Gin")

          .form-group
            label(for="category") Category *
            select#category(v-model="form.category" required)
              option(value="" disabled) Select a category
              option(value="Staples") Staples
              option(value="Special Occasion") Special Occasion
              option(value="Liqueur") Liqueur
              option(value="Premix") Premix
              option(value="Mixers") Mixers
              option(value="Beer") Beer
              option(value="Wine") Wine
              option(value="Garnish") Garnish
              option(value="Other") Other

          .form-group
            label Tags
            .tag-selector-wrapper
              TagSelector(v-model="form.tags")
            small.help-text Select spirit types and characteristics using the hierarchical selector

          .form-group
            label
              input(type="checkbox" v-model="form.inStock")
              span In Stock

          .form-group.special-fingers-group
            label
              input(type="checkbox" v-model="form.isFinger")
              span Mark as Special Fingers 🥃
            small.help-text.finger-explanation
              | Checking this will exclude this bottle from drink recipes and only present it as being served straight up or on the rocks.

          .form-group
            label(for="bottleSize") Bottle Size
            select#bottleSize(v-model="form.bottleSize")
              option(value="") Select a size
              option(value="50ml") 50ml (Mini)
              option(value="200ml") 200ml (Half Pint)
              option(value="375ml") 375ml (Pint)
              option(value="500ml") 500ml
              option(value="750ml") 750ml (Fifth)
              option(value="1L") 1L
              option(value="1.75L") 1.75L (Handle)
              option(value="airplane") Airplane Bottle
              option(value="other") Other
            small.help-text Select standard bottle size or choose "Other" for custom sizes

          .form-group
            label(for="company") Company
            input#company(v-model="form.company" type="text" placeholder="e.g., Buffalo Trace, Castle & Key")
            small.help-text Enter the distillery or company name (optional)

          .form-group
            label(for="abv") ABV (Alcohol by Volume %)
            input#abv(v-model.number="form.abv" type="number" min="0" max="100" step="0.1" placeholder="e.g., 40")
            small.help-text Enter the alcohol percentage (0-100)

          .form-group
            label(for="origin") Origin
            input#origin(v-model="form.origin" type="text" placeholder="e.g., Kentucky, Scotland")
            small.help-text Enter the country or region of origin

          .form-group
            label(for="bottleState") Bottle State
            select#bottleState(v-model="form.bottleState")
              option(value="") Not specified
              option(value="unopened") Unopened
              option(value="opened") Opened
              option(value="empty") Empty

          .form-group
            label(for="image") Image Filename
            input#image(v-model="form.image" type="text" placeholder="e.g., beefeater_gin.jpg")
            small.help-text Just enter the filename. Place image files in public/images/bottles/ directory

          .form-actions
            button.btn.btn-primary(type="submit" :disabled="loading") 
              | {{ loading ? 'Saving...' : editingBottle ? 'Update Bottle' : 'Add Bottle' }}
            button.btn.btn-secondary(v-if="editingBottle" type="button" @click="cancelEdit") Cancel

          .error-message(v-if="error") {{ error }}
          .success-message(v-if="successMessage") {{ successMessage }}

      .list-section
        h3 Current Bottles ({{ bottles.length }})
        .bottle-list
          .bottle-item(v-for="bottle in bottles" :key="bottle.id")
            .bottle-info
              h4 {{ bottle.name }}
              p.company(v-if="bottle.company") {{ bottle.company }}
              .bottle-details
                span.badge {{ bottle.category }}
                span.badge(v-if="bottle.inStock" class="in-stock") In Stock
                span.badge(v-else class="out-of-stock") Out of Stock
                span.badge(v-if="bottle.isFinger" class="finger-badge") 🥃 Special Finger
                span.size(v-if="bottle.bottleSize") {{ bottle.bottleSize }}
                span.abv(v-if="bottle.abv") {{ bottle.abv }}% ABV
                span.origin(v-if="bottle.origin") {{ bottle.origin }}
              .bottle-tags(v-if="bottle.tags.length")
                span.tag(v-for="tag in bottle.tags" :key="tag") {{ tag }}
            .bottle-actions
              button.btn-edit(@click="startEdit(bottle)") Edit
              button.btn-mark-empty(v-if="bottle.inStock" @click="toggleInStock(bottle)") Mark Empty
              button.btn-mark-in-stock(v-else @click="toggleInStock(bottle)") Mark In Stock
              button.btn-delete(@click="confirmDelete(bottle)") Delete
</template>

<script setup lang="ts">
  import type { Bottle } from "~/types";

  const route = useRoute();
  const bottles = ref<Bottle[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);
  const editingBottle = ref<Bottle | null>(null);

  const form = ref({
    name: "",
    category: "",
    tags: [] as string[],
    inStock: true,
    isFinger: false,
    bottleSize: "",
    bottleState: "",
    image: "",
    abv: undefined as number | undefined,
    origin: "",
    company: "",
  });

  onMounted(async () => {
    await loadBottles();

    // Check if we have a bottle ID in the query params
    const bottleId = route.query.id as string;
    if (bottleId) {
      const bottle = bottles.value.find((b) => b.id === bottleId);
      if (bottle) {
        startEdit(bottle);
      }
    }
  });

  async function loadBottles() {
    try {
      const response = await $fetch<{ success: boolean; bottles: Bottle[] }>("/api/inventory");
      bottles.value = response.bottles;
    } catch (e) {
      error.value = "Failed to load bottles";
      console.error(e);
    }
  }

  function resetForm() {
    form.value = {
      name: "",
      category: "",
      tags: [],
      inStock: true,
      isFinger: false,
      bottleSize: "",
      bottleState: "",
      image: "",
      abv: undefined,
      origin: "",
      company: "",
    };
    editingBottle.value = null;
    error.value = null;
    successMessage.value = null;
  }

  function startEdit(bottle: Bottle) {
    editingBottle.value = bottle;
    form.value = {
      name: bottle.name,
      category: bottle.category,
      tags: [...bottle.tags],
      inStock: bottle.inStock,
      isFinger: bottle.isFinger || false,
      bottleSize: bottle.bottleSize || "",
      bottleState: bottle.bottleState || "",
      image: bottle.image || "",
      abv: bottle.abv,
      origin: bottle.origin || "",
      company: bottle.company || "",
    };
    error.value = null;
    successMessage.value = null;
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    resetForm();
  }

  async function handleSubmit() {
    loading.value = true;
    error.value = null;
    successMessage.value = null;

    try {
      const bottleData: Partial<Bottle> = {
        name: form.value.name,
        category: form.value.category,
        tags: form.value.tags,
        inStock: form.value.inStock,
        isFinger: form.value.isFinger,
        bottleSize: form.value.bottleSize || undefined,
        bottleState: (form.value.bottleState as "unopened" | "opened" | "empty") || undefined,
        image: form.value.image || undefined,
        abv: form.value.abv,
        origin: form.value.origin || undefined,
        company: form.value.company || undefined,
      };

      if (editingBottle.value) {
        // Update existing bottle
        await $fetch(`/api/inventory/${editingBottle.value.id}`, {
          method: "PUT",
          body: bottleData,
        });
        successMessage.value = `Bottle updated successfully! Form cleared - you are now adding a new bottle.`;
      } else {
        // Create new bottle
        await $fetch("/api/inventory", {
          method: "POST",
          body: bottleData,
        });
        successMessage.value = "Bottle added successfully!";
      }

      await loadBottles();
      resetForm();

      // Scroll to top to see the message
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Clear success message after 5 seconds
      setTimeout(() => {
        successMessage.value = null;
      }, 5000);
    } catch (e: any) {
      error.value = e.data?.statusMessage || "Failed to save bottle";
      console.error(e);
    } finally {
      loading.value = false;
    }
  }

  async function confirmDelete(bottle: Bottle) {
    if (!confirm(`Are you sure you want to delete "${bottle.name}"?`)) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      await $fetch(`/api/inventory/${bottle.id}`, {
        method: "DELETE",
      });
      successMessage.value = "Bottle deleted successfully!";
      await loadBottles();

      // Clear success message after 3 seconds
      setTimeout(() => {
        successMessage.value = null;
      }, 3000);
    } catch (e: any) {
      error.value = e.data?.statusMessage || "Failed to delete bottle";
      console.error(e);
    } finally {
      loading.value = false;
    }
  }

  async function toggleInStock(bottle: Bottle) {
    loading.value = true;
    error.value = null;

    try {
      const updatedData = {
        ...bottle,
        inStock: !bottle.inStock,
      };

      await $fetch(`/api/inventory/${bottle.id}`, {
        method: "PUT",
        body: updatedData,
      });

      const action = updatedData.inStock ? "marked as in stock" : "marked as empty";
      successMessage.value = `${bottle.name} ${action} successfully!`;
      await loadBottles();

      // Clear success message after 3 seconds
      setTimeout(() => {
        successMessage.value = null;
      }, 3000);
    } catch (e: any) {
      error.value = e.data?.statusMessage || "Failed to update bottle status";
      console.error(e);
    } finally {
      loading.value = false;
    }
  }
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;

  .manage-bottles-page {
    min-height: 60vh;
    padding-bottom: $spacing-xxl;
  }

  .header-section {
    h2 {
      color: $dark-bg;
      margin-bottom: $spacing-sm;
    }

    p {
      color: color.adjust($text-dark, $lightness: 20%);
      margin-bottom: $spacing-md;
    }
  }

  .back-btn {
    display: inline-block;
    padding: $spacing-sm $spacing-lg;
    background: white;
    border: 2px solid $border-color;
    border-radius: $border-radius-md;
    text-decoration: none;
    color: $text-dark;
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover {
      border-color: $accent-color;
      background: color.adjust($accent-color, $lightness: 45%);
    }
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-xxl;

    @media (max-width: 968px) {
      grid-template-columns: 1fr;
    }
  }

  .form-section {
    h3 {
      color: $dark-bg;
      margin-bottom: $spacing-lg;
    }
  }

  .bottle-form {
    background: white;
    padding: $spacing-xl;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-md;
  }

  .form-group {
    margin-bottom: $spacing-lg;

    label {
      display: block;
      font-weight: 600;
      color: $text-dark;
      margin-bottom: $spacing-xs;

      input[type="checkbox"] {
        margin-right: $spacing-xs;
      }
    }

    &.special-fingers-group {
      background: color.adjust($accent-color, $lightness: 48%);
      border: 2px solid $accent-color;
      border-radius: $border-radius-md;
      padding: $spacing-md;

      .finger-explanation {
        color: color.adjust($text-dark, $lightness: 10%);
        font-style: italic;
        line-height: 1.5;
      }
    }

    input[type="text"],
    select {
      width: 100%;
      padding: $spacing-sm $spacing-md;
      border: 2px solid $border-color;
      border-radius: $border-radius-md;
      font-size: 1rem;
      transition: border-color 0.3s ease;

      &:focus {
        outline: none;
        border-color: $accent-color;
      }
    }

    input[type="checkbox"] {
      width: auto;
    }

    .help-text {
      display: block;
      margin-top: $spacing-xs;
      font-size: 0.875rem;
      color: color.adjust($text-dark, $lightness: 30%);
    }
  }

  .tag-selector-wrapper {
    border: 2px solid $border-color;
    border-radius: $border-radius-md;
    padding: $spacing-sm;
    min-height: 200px;
    background: white;
  }

  .form-actions {
    display: flex;
    gap: $spacing-md;
    margin-top: $spacing-xl;
  }

  .btn {
    padding: $spacing-sm $spacing-xl;
    border-radius: $border-radius-md;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border: none;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .btn-primary {
    background: $accent-color;
    color: white;

    &:hover:not(:disabled) {
      background: color.adjust($accent-color, $lightness: -10%);
      transform: translateY(-2px);
      box-shadow: $shadow-md;
    }
  }

  .btn-secondary {
    background: white;
    color: $text-dark;
    border: 2px solid $border-color;

    &:hover {
      border-color: $text-dark;
    }
  }

  .error-message {
    margin-top: $spacing-lg;
    padding: $spacing-md;
    background: color.adjust(red, $lightness: 45%);
    color: color.adjust(red, $lightness: -20%);
    border-radius: $border-radius-md;
    border-left: 4px solid red;
  }

  .success-message {
    margin-top: $spacing-lg;
    padding: $spacing-md;
    background: color.adjust(green, $lightness: 45%);
    color: color.adjust(green, $lightness: -30%);
    border-radius: $border-radius-md;
    border-left: 4px solid green;
  }

  .list-section {
    h3 {
      color: $dark-bg;
      margin-bottom: $spacing-lg;
    }
  }

  .bottle-list {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    max-height: 600px;
    overflow-y: auto;
    padding-right: $spacing-sm;

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: color.adjust($border-color, $lightness: 10%);
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: $border-color;
      border-radius: 4px;

      &:hover {
        background: color.adjust($border-color, $lightness: -10%);
      }
    }
  }

  .bottle-item {
    background: white;
    padding: $spacing-lg;
    border-radius: $border-radius-md;
    box-shadow: $shadow-sm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: $shadow-md;
      transform: translateX(4px);
    }
  }

  .bottle-info {
    flex: 1;

    h4 {
      margin: 0 0 $spacing-xs 0;
      color: $dark-bg;
    }

    .company {
      margin: 0 0 $spacing-xs 0;
      color: color.adjust($text-dark, $lightness: 20%);
      font-size: 0.875rem;
      font-style: italic;
    }
  }

  .bottle-details {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
    margin-bottom: $spacing-xs;
    flex-wrap: wrap;
  }

  .badge {
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: 0.75rem;
    font-weight: 600;
    background: color.adjust($border-color, $lightness: 15%);
    color: $text-dark;

    &.in-stock {
      background: color.adjust(green, $lightness: 40%);
      color: color.adjust(green, $lightness: -30%);
    }

    &.out-of-stock {
      background: color.adjust(red, $lightness: 40%);
      color: color.adjust(red, $lightness: -20%);
    }

    &.finger-badge {
      background: color.adjust($accent-color, $lightness: 40%);
      color: color.adjust($accent-color, $lightness: -30%);
      border: 1px solid $accent-color;
    }
  }

  .size {
    font-size: 0.875rem;
    color: color.adjust($text-dark, $lightness: 20%);
  }

  .abv,
  .origin {
    font-size: 0.875rem;
    color: color.adjust($text-dark, $lightness: 20%);
  }

  .bottle-tags {
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;
  }

  .tag {
    padding: $spacing-xs $spacing-sm;
    background: color.adjust($accent-color, $lightness: 45%);
    color: color.adjust($accent-color, $lightness: -20%);
    border-radius: $border-radius-sm;
    font-size: 0.75rem;
  }

  .bottle-actions {
    display: flex;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }

  .btn-edit,
  .btn-mark-empty,
  .btn-mark-in-stock,
  .btn-delete {
    padding: $spacing-xs $spacing-md;
    border-radius: $border-radius-sm;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  .btn-edit {
    background: color.adjust($primary-color, $lightness: 40%);
    color: $primary-color;
    border-color: $primary-color;

    &:hover {
      background: $primary-color;
      color: white;
    }
  }

  .btn-mark-empty {
    background: color.adjust(orange, $lightness: 30%);
    color: color.adjust(orange, $lightness: -30%);
    border-color: color.adjust(orange, $lightness: -20%);

    &:hover {
      background: orange;
      color: white;
    }
  }

  .btn-mark-in-stock {
    background: color.adjust(green, $lightness: 40%);
    color: color.adjust(green, $lightness: -30%);
    border-color: color.adjust(green, $lightness: -20%);

    &:hover {
      background: green;
      color: white;
    }
  }

  .btn-delete {
    background: color.adjust(red, $lightness: 40%);
    color: color.adjust(red, $lightness: -20%);
    border-color: color.adjust(red, $lightness: -20%);

    &:hover {
      background: red;
      color: white;
    }
  }
</style>
