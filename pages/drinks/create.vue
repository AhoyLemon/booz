<template lang="pug">
.create-drink-page
  .container
    .back-navigation
      NuxtLink.btn.btn-back(to="/drinks") ← Back to Drinks
    
    h1 Create New Recipe
    
    .create-form(v-if="!showSuccess")
      form(@submit.prevent="handleSubmit")
        .form-section
          h2 Basic Information
          
          .form-group(:class="{ 'has-error': errors.name }")
            label(for="name") Name *
            input#name(
              v-model="form.name"
              type="text"
              placeholder="e.g., My Amazing Cocktail"
              required
              @blur="generateId"
            )
            .error-message(v-if="errors.name") {{ errors.name }}
          
          .form-group
            label(for="id") ID
            input#id(
              v-model="form.id"
              type="text"
              placeholder="auto-generated-from-name"
              readonly
              disabled
            )
            .help-text Auto-generated from the name
          
          .form-group
            label(for="image") Image URL (optional)
            input#image(
              v-model="form.image"
              type="text"
              placeholder="e.g., mojito.webp or https://example.com/image.jpg"
            )
            .help-text Use a filename (e.g., mojito.webp) or full URL
        
        .form-section
          h2 Ingredients *
          .error-message(v-if="errors.ingredients") {{ errors.ingredients }}
          
          .ingredient-list
            .ingredient-item(
              v-for="(ingredient, index) in form.ingredients"
              :key="index"
            )
              .form-group.ingredient-name
                label(:for="`ingredient-name-${index}`") Name *
                input(
                  :id="`ingredient-name-${index}`"
                  v-model="ingredient.name"
                  type="text"
                  placeholder="e.g., White Rum"
                  required
                )
              .form-group.ingredient-qty
                label(:for="`ingredient-qty-${index}`") Quantity
                input(
                  :id="`ingredient-qty-${index}`"
                  v-model="ingredient.qty"
                  type="text"
                  placeholder="e.g., 2 oz"
                )
              .form-group.ingredient-optional
                label.checkbox-label
                  input(
                    type="checkbox"
                    v-model="ingredient.optional"
                  )
                  span Optional
              button.btn.btn-remove(
                type="button"
                @click="removeIngredient(index)"
                v-if="form.ingredients.length > 1"
              ) Remove
          
          button.btn.btn-add(type="button" @click="addIngredient") + Add Ingredient
        
        .form-section
          h2 Instructions *
          .error-message(v-if="errors.instructions") {{ errors.instructions }}
          
          .instruction-list
            .instruction-item(
              v-for="(instruction, index) in form.instructions"
              :key="index"
            )
              .form-group
                label(:for="`instruction-${index}`") Step {{ index + 1 }}
                textarea(
                  :id="`instruction-${index}`"
                  v-model="form.instructions[index]"
                  rows="2"
                  placeholder="Describe this step..."
                  required
                )
              button.btn.btn-remove(
                type="button"
                @click="removeInstruction(index)"
                v-if="form.instructions.length > 1"
              ) Remove
          
          button.btn.btn-add(type="button" @click="addInstruction") + Add Instruction
        
        .form-section
          h2 Additional Details
          
          .form-row
            .form-group
              label(for="prep") Preparation Method
              select#prep(v-model="form.prep")
                option(value="") Select preparation...
                option(value="Build") Build
                option(value="Muddle") Muddle
                option(value="Shaker") Shaker
                option(value="Simple") Simple
            
            .form-group
              label(for="category") Category
              select#category(v-model="form.category")
                option(value="") Select category...
                option(value="Boozy") Boozy
                option(value="Fizzy") Fizzy
                option(value="Margarita") Margarita
                option(value="Nightcap") Nightcap
                option(value="Smoked") Smoked
          
          .form-group
            label(for="tags") Tags
            input#tags(
              v-model="tagsInput"
              type="text"
              placeholder="e.g., mint, rum, classic"
            )
            .help-text Comma-separated list of tags
        
        .form-actions
          button.btn.btn-secondary(type="button" @click="resetForm") Clear Form
          button.btn.btn-primary(type="submit" :disabled="isSubmitting") 
            | {{ isSubmitting ? 'Creating...' : 'Create Recipe' }}
      
      .error-message.global-error(v-if="globalError") {{ globalError }}
    
    .success-message(v-else)
      h2 ✅ Recipe Created Successfully!
      p Your recipe "{{ form.name }}" has been added.
      .success-actions
        NuxtLink.btn.btn-primary(:to="`/drinks/${form.id}`") View Recipe
        button.btn.btn-secondary(@click="createAnother") Create Another
        NuxtLink.btn.btn-secondary(to="/drinks") Back to All Drinks
</template>

<script setup lang="ts">
  import type { Drink, Ingredient } from "~/types";

  const form = reactive({
    id: "",
    name: "",
    ingredients: [{ name: "", qty: "", optional: false }] as Ingredient[],
    instructions: [""],
    image: "",
    prep: "",
    category: "",
  });

  const tagsInput = ref("");
  const errors = reactive({
    name: "",
    ingredients: "",
    instructions: "",
  });
  const globalError = ref("");
  const isSubmitting = ref(false);
  const showSuccess = ref(false);

  const generateId = () => {
    if (form.name.trim()) {
      form.id = form.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }
  };

  const addIngredient = () => {
    form.ingredients.push({ name: "", qty: "", optional: false });
  };

  const removeIngredient = (index: number) => {
    form.ingredients.splice(index, 1);
  };

  const addInstruction = () => {
    form.instructions.push("");
  };

  const removeInstruction = (index: number) => {
    form.instructions.splice(index, 1);
  };

  const validateForm = (): boolean => {
    let isValid = true;
    errors.name = "";
    errors.ingredients = "";
    errors.instructions = "";

    if (!form.name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    }

    const validIngredients = form.ingredients.filter((i) => i.name.trim());
    if (validIngredients.length === 0) {
      errors.ingredients = "At least one ingredient with a name is required";
      isValid = false;
    }

    const validInstructions = form.instructions.filter((i) => i.trim());
    if (validInstructions.length === 0) {
      errors.instructions = "At least one instruction is required";
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    globalError.value = "";

    if (!validateForm()) {
      return;
    }

    isSubmitting.value = true;

    try {
      // Filter out empty ingredients and instructions
      const cleanedIngredients = form.ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name.trim(),
          qty: i.qty?.trim() || undefined,
          ...(i.optional && { optional: true }),
        }));

      const cleanedInstructions = form.instructions.filter((i) => i.trim()).map((i) => i.trim());

      // Parse tags
      const tags = tagsInput.value
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      const drinkData: Drink = {
        id: form.id,
        name: form.name.trim(),
        ingredients: cleanedIngredients,
        instructions: cleanedInstructions,
        ...(form.image && { image: form.image.trim() }),
        ...(form.prep && { prep: form.prep }),
        ...(form.category && { category: form.category }),
        ...(tags.length > 0 && { tags }),
      };

      const response = await $fetch("/api/drinks", {
        method: "POST",
        body: drinkData,
      });

      showSuccess.value = true;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "data" in error) {
        const errorData = error as { data?: { statusMessage?: string } };
        globalError.value = errorData.data?.statusMessage || "Failed to create recipe. Please try again.";
      } else {
        globalError.value = "Failed to create recipe. Please try again.";
      }
    } finally {
      isSubmitting.value = false;
    }
  };

  const resetForm = () => {
    form.id = "";
    form.name = "";
    form.ingredients = [{ name: "", qty: "", optional: false }];
    form.instructions = [""];
    form.image = "";
    form.prep = "";
    form.category = "";
    tagsInput.value = "";
    errors.name = "";
    errors.ingredients = "";
    errors.instructions = "";
    globalError.value = "";
  };

  const createAnother = () => {
    showSuccess.value = false;
    resetForm();
  };
</script>

<style lang="scss" scoped>
  .create-drink-page {
    min-height: 100vh;
    padding: 2rem 0;
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .back-navigation {
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    color: var(--text-primary, #333);
  }

  .create-form {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .form-section {
    margin-bottom: 2.5rem;

    h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: var(--text-primary, #333);
      border-bottom: 2px solid var(--primary-color, #4a90e2);
      padding-bottom: 0.5rem;
    }
  }

  .form-group {
    margin-bottom: 1.5rem;

    &.has-error {
      input,
      textarea,
      select {
        border-color: #e74c3c;
      }
    }

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--text-primary, #333);
    }

    input,
    textarea,
    select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      font-family: inherit;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: var(--primary-color, #4a90e2);
      }

      &:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
      }
    }

    textarea {
      resize: vertical;
      min-height: 60px;
    }

    .help-text {
      font-size: 0.875rem;
      color: #666;
      margin-top: 0.25rem;
    }
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }

  .ingredient-list,
  .instruction-list {
    margin-bottom: 1rem;
  }

  .ingredient-item {
    display: grid;
    grid-template-columns: 2fr 1fr auto auto;
    gap: 1rem;
    align-items: end;
    margin-bottom: 1rem;

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .form-group {
      margin-bottom: 0;

      &.ingredient-optional {
        display: flex;
        align-items: center;
        padding-bottom: 0.75rem;
      }
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-weight: normal;

      input[type="checkbox"] {
        width: auto;
        margin: 0;
        cursor: pointer;
      }

      span {
        user-select: none;
      }
    }
  }

  .instruction-item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    align-items: end;
    margin-bottom: 1rem;

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .form-group {
      margin-bottom: 0;
    }
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .btn-back {
    background: #f5f5f5;
    color: #333;

    &:hover {
      background: #e0e0e0;
    }
  }

  .btn-primary {
    background: var(--primary-color, #4a90e2);
    color: white;

    &:hover:not(:disabled) {
      background: var(--primary-color-dark, #357abd);
    }
  }

  .btn-secondary {
    background: #6c757d;
    color: white;

    &:hover {
      background: #5a6268;
    }
  }

  .btn-add {
    background: #28a745;
    color: white;

    &:hover {
      background: #218838;
    }
  }

  .btn-remove {
    background: #dc3545;
    color: white;
    padding: 0.5rem 1rem;
    white-space: nowrap;

    &:hover {
      background: #c82333;
    }

    @media (max-width: 600px) {
      width: 100%;
      margin-top: 0.5rem;
    }
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #ddd;

    @media (max-width: 600px) {
      flex-direction: column;
    }
  }

  .error-message {
    color: #e74c3c;
    font-size: 0.875rem;
    margin-top: 0.25rem;

    &.global-error {
      margin-top: 1rem;
      padding: 1rem;
      background: #ffe6e6;
      border-radius: 4px;
      border-left: 4px solid #e74c3c;
    }
  }

  .success-message {
    background: white;
    border-radius: 8px;
    padding: 3rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-align: center;

    h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #28a745;
    }

    p {
      font-size: 1.125rem;
      margin-bottom: 2rem;
      color: #666;
    }

    .success-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
  }
</style>
