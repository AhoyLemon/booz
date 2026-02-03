<template lang="pug">
.beer-wine-page
  .container
    h2 🍺🍷 Beer & Wine
    p.mb-3 Manage your beer and wine inventory
    
    .loading(v-if="loading") Loading...
    .error(v-if="error") {{ error }}
    
    template(v-else)
      .content-grid
        // Beer Section
        .section-card
          h3.section-title 🍺 Beer
          .add-form
            .form-group
              label(for="beer-name") Beer Name *
              input#beer-name(
                v-model="beerForm.name"
                type="text"
                placeholder="e.g., Kentucky Kölsch"
                @keyup.enter="addBeer"
              )
            
            .form-group
              label(for="beer-type") Beer Type (Optional)
              select#beer-type(v-model="beerForm.subtype")
                option(value="") None
                option(value="Lager") Lager
                option(value="Pilsner") Pilsner
                option(value="IPA") IPA
                option(value="Pale Ale") Pale Ale
                option(value="Stout") Stout
                option(value="Porter") Porter
                option(value="Saison") Saison
                option(value="Wheat Beer") Wheat Beer
                option(value="Sour") Sour
                option(value="Other") Other
            
            button.btn-primary(@click="addBeer" :disabled="!beerForm.name") Add Beer
            .success-message(v-if="beerSuccess") {{ beerSuccess }}
          
          .items-list(v-if="getBeers.length > 0")
            h4 Current Beers ({{ getBeers.length }})
            .item-card(v-for="beer in getBeers" :key="beer.id")
              .item-info
                .item-name {{ beer.name }}
                .item-type(v-if="beer.subtype") {{ beer.subtype }}
                .item-badge(:class="{ 'in-stock': beer.inStock, 'out-of-stock': !beer.inStock }")
                  | {{ beer.inStock ? 'In Stock' : 'Out of Stock' }}
              .item-actions
                button.btn-toggle(@click="toggleStock(beer)" :class="{ 'in-stock': beer.inStock }")
                  | {{ beer.inStock ? '✓' : '○' }}
                button.btn-delete(@click="deleteItem(beer)") ✕
        
        // Wine Section
        .section-card
          h3.section-title 🍷 Wine
          .add-form
            .form-group
              label(for="wine-name") Wine Name *
              input#wine-name(
                v-model="wineForm.name"
                type="text"
                placeholder="e.g., Château Margaux"
                @keyup.enter="addWine"
              )
            
            .form-group
              label(for="wine-type") Wine Type *
              select#wine-type(v-model="wineForm.subtype" required)
                option(value="" disabled) Select type
                option(value="Red Wine") Red Wine
                option(value="White Wine") White Wine
                option(value="Sparkling") Sparkling
                option(value="Rosé") Rosé
                option(value="Pinot Noir") Pinot Noir
                option(value="Malbec") Malbec
                option(value="Shiraz") Shiraz
                option(value="Cabernet Sauvignon") Cabernet Sauvignon
                option(value="Merlot") Merlot
                option(value="Chardonnay") Chardonnay
                option(value="Sauvignon Blanc") Sauvignon Blanc
                option(value="Riesling") Riesling
                option(value="Pinot Grigio") Pinot Grigio
                option(value="Champagne") Champagne
                option(value="Prosecco") Prosecco
                option(value="Other") Other
            
            button.btn-primary(@click="addWine" :disabled="!wineForm.name || !wineForm.subtype") Add Wine
            .success-message(v-if="wineSuccess") {{ wineSuccess }}
          
          .items-list(v-if="getWines.length > 0")
            h4 Current Wines ({{ getWines.length }})
            .item-card(v-for="wine in getWines" :key="wine.id")
              .item-info
                .item-name {{ wine.name }}
                .item-type {{ wine.subtype }}
                .item-badge(:class="{ 'in-stock': wine.inStock, 'out-of-stock': !wine.inStock }")
                  | {{ wine.inStock ? 'In Stock' : 'Out of Stock' }}
              .item-actions
                button.btn-toggle(@click="toggleStock(wine)" :class="{ 'in-stock': wine.inStock }")
                  | {{ wine.inStock ? '✓' : '○' }}
                button.btn-delete(@click="deleteItem(wine)") ✕
</template>

<script setup lang="ts">
import type { BeerWine } from '~/types'

const { loadBeerWine, getBeers, getWines, loading, error } = useBeerWine()

const beerForm = ref({
  name: '',
  subtype: '',
})

const wineForm = ref({
  name: '',
  subtype: '',
})

const beerSuccess = ref('')
const wineSuccess = ref('')

onMounted(async () => {
  await loadBeerWine()
})

async function addBeer() {
  if (!beerForm.value.name) return
  
  try {
    await $fetch('/api/beer-wine', {
      method: 'POST',
      body: {
        name: beerForm.value.name,
        type: 'beer',
        subtype: beerForm.value.subtype || undefined,
        inStock: true,
      },
    })
    
    beerSuccess.value = 'Beer added successfully!'
    beerForm.value = { name: '', subtype: '' }
    await loadBeerWine()
    
    setTimeout(() => {
      beerSuccess.value = ''
    }, 3000)
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Failed to add beer')
  }
}

async function addWine() {
  if (!wineForm.value.name || !wineForm.value.subtype) return
  
  try {
    await $fetch('/api/beer-wine', {
      method: 'POST',
      body: {
        name: wineForm.value.name,
        type: 'wine',
        subtype: wineForm.value.subtype,
        inStock: true,
      },
    })
    
    wineSuccess.value = 'Wine added successfully!'
    wineForm.value = { name: '', subtype: '' }
    await loadBeerWine()
    
    setTimeout(() => {
      wineSuccess.value = ''
    }, 3000)
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Failed to add wine')
  }
}

async function toggleStock(item: BeerWine) {
  try {
    await $fetch(`/api/beer-wine/${item.id}`, {
      method: 'PUT',
      body: {
        ...item,
        inStock: !item.inStock,
      },
    })
    await loadBeerWine()
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Failed to update stock')
  }
}

async function deleteItem(item: BeerWine) {
  const itemType = item.type === 'beer' ? 'beer' : 'wine'
  if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
    return
  }
  
  try {
    await $fetch(`/api/beer-wine/${item.id}`, {
      method: 'DELETE',
    })
    await loadBeerWine()
  } catch (e: any) {
    alert(e.data?.statusMessage || `Failed to delete ${itemType}`)
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;

.beer-wine-page {
  min-height: 60vh;
  padding-bottom: $spacing-xxl;

  h2 {
    color: $dark-bg;
    margin-bottom: $spacing-sm;
  }

  p {
    color: color.adjust($text-dark, $lightness: 20%);
  }

  .loading,
  .error {
    text-align: center;
    padding: $spacing-xl;
    font-size: 1.2rem;
  }

  .error {
    color: #dc3545;
    background: #f8d7da;
    border-radius: $border-radius-md;
    margin-bottom: $spacing-lg;
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

.section-card {
  background: white;
  padding: $spacing-xl;
  border-radius: $border-radius-lg;
  box-shadow: $shadow-md;
}

.section-title {
  color: $dark-bg;
  margin: 0 0 $spacing-lg 0;
  font-size: 1.5rem;
}

.add-form {
  margin-bottom: $spacing-xl;
  padding-bottom: $spacing-xl;
  border-bottom: 2px solid $border-color;
}

.form-group {
  margin-bottom: $spacing-md;

  label {
    display: block;
    font-weight: 600;
    color: $text-dark;
    margin-bottom: $spacing-xs;
  }

  input,
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
}

.btn-primary {
  width: 100%;
  padding: $spacing-md;
  background: $accent-color;
  color: white;
  border: none;
  border-radius: $border-radius-md;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: color.adjust($accent-color, $lightness: -10%);
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.success-message {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: color.adjust(green, $lightness: 45%);
  color: color.adjust(green, $lightness: -30%);
  border-radius: $border-radius-md;
  border-left: 4px solid green;
}

.items-list {
  h4 {
    color: $dark-bg;
    margin: 0 0 $spacing-md 0;
    font-size: 1.125rem;
  }
}

.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  margin-bottom: $spacing-sm;
  background: color.adjust($border-color, $lightness: 15%);
  border-radius: $border-radius-md;
  transition: all 0.3s ease;

  &:hover {
    background: color.adjust($border-color, $lightness: 10%);
    transform: translateX(4px);
  }
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 600;
  color: $dark-bg;
  margin-bottom: $spacing-xs;
}

.item-type {
  font-size: 0.875rem;
  color: color.adjust($text-dark, $lightness: 20%);
  margin-bottom: $spacing-xs;
}

.item-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: 0.75rem;
  font-weight: 600;

  &.in-stock {
    background: color.adjust(green, $lightness: 40%);
    color: color.adjust(green, $lightness: -30%);
  }

  &.out-of-stock {
    background: color.adjust(red, $lightness: 40%);
    color: color.adjust(red, $lightness: -20%);
  }
}

.item-actions {
  display: flex;
  gap: $spacing-sm;
}

.btn-toggle {
  width: 40px;
  height: 40px;
  border: 2px solid $border-color;
  border-radius: $border-radius-md;
  background: white;
  color: $text-dark;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &.in-stock {
    background: color.adjust(green, $lightness: 40%);
    border-color: color.adjust(green, $lightness: -20%);
    color: color.adjust(green, $lightness: -30%);
  }

  &:hover {
    transform: scale(1.1);
  }
}

.btn-delete {
  width: 40px;
  height: 40px;
  border: 2px solid color.adjust(red, $lightness: -20%);
  border-radius: $border-radius-md;
  background: color.adjust(red, $lightness: 40%);
  color: color.adjust(red, $lightness: -20%);
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: red;
    color: white;
    transform: scale(1.1);
  }
}
</style>
