import { parse } from 'csv-parse/sync'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Bottle, Recipe, InventoryData, RecipeData } from '../types'

// ⚠️ Notion Integration - Uncomment the line below to enable Notion sync
// import { fetchFromNotion } from './notion-sync'

const DATA_DIR = join(process.cwd(), 'data')
const PUBLIC_DATA_DIR = join(process.cwd(), 'public', 'data')

// Stub function when Notion is disabled
async function fetchFromNotion(): Promise<Bottle[]> {
  return []
}

function parseCSV(): Bottle[] {
  const csvPath = join(DATA_DIR, 'inventory.csv')

  if (!existsSync(csvPath)) {
    console.log('⚠️  inventory.csv not found, skipping CSV parsing')
    return []
  }

  try {
    console.log('📄 Parsing inventory.csv...')
    const csvContent = readFileSync(csvPath, 'utf-8')
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    })

    const bottles: Bottle[] = records.map((record: any) => {
      let imagePath = record.image || undefined
      // Normalize image path to ensure it has the correct prefix
      if (imagePath && !imagePath.startsWith('/images/bottles/') && !imagePath.startsWith('/')) {
        imagePath = `/images/bottles/${imagePath}`
      }

      return {
        id: record.id,
        name: record.name,
        category: record.category,
        tags: record.tags.split(',').map((tag: string) => tag.trim()),
        inStock: record.inStock === 'true',
        bottleSize: record.bottleSize || undefined,
        bottleState: (record.bottleState as 'unopened' | 'opened' | 'empty') || undefined,
        image: imagePath,
        aka: record.aka ? record.aka.split(',').map((name: string) => name.trim()) : undefined,
      }
    })

    console.log(`✅ Parsed ${bottles.length} bottles from CSV`)
    return bottles
  } catch (error) {
    console.error('❌ Error parsing CSV:', error)
    return []
  }
}

function loadLocalRecipes(): Recipe[] {
  const recipesPath = join(DATA_DIR, 'recipes.json')

  if (!existsSync(recipesPath)) {
    console.log('⚠️  recipes.json not found, skipping local recipes')
    return []
  }

  try {
    console.log('📖 Loading local recipes...')
    const recipesContent = readFileSync(recipesPath, 'utf-8')
    const data = JSON.parse(recipesContent)
    console.log(`✅ Loaded ${data.recipes.length} local recipes`)
    return data.recipes
  } catch (error) {
    console.error('❌ Error loading recipes:', error)
    return []
  }
}

async function syncData() {
  console.log('🔄 Starting data synchronization...\n')

  // Fetch inventory from all sources
  const notionBottles = await fetchFromNotion()
  const csvBottles = parseCSV()

  // Merge bottles (Notion takes priority, then CSV)
  const bottlesMap = new Map<string, Bottle>()

  // Add CSV bottles first
  csvBottles.forEach(bottle => {
    bottlesMap.set(bottle.id, bottle)
  })

  // Override with Notion bottles (they take priority)
  notionBottles.forEach(bottle => {
    bottlesMap.set(bottle.id, bottle)
  })

  const bottles = Array.from(bottlesMap.values())

  // Load local recipes
  const localRecipes = loadLocalRecipes()

  // Create inventory data
  const inventoryData: InventoryData = {
    bottles,
    lastUpdated: new Date().toISOString(),
  }

  // Create recipes data
  const recipesData: RecipeData = {
    recipes: localRecipes,
    lastUpdated: new Date().toISOString(),
  }

  // Write to public directory
  console.log('\n💾 Writing normalized data to public/data/...')
  writeFileSync(join(PUBLIC_DATA_DIR, 'inventory.json'), JSON.stringify(inventoryData, null, 2))
  writeFileSync(join(PUBLIC_DATA_DIR, 'recipes.json'), JSON.stringify(recipesData, null, 2))

  console.log('✅ Inventory data written to public/data/inventory.json')
  console.log('✅ Recipes data written to public/data/recipes.json')
  console.log(`\n🎉 Sync complete! ${bottles.length} bottles, ${localRecipes.length} local recipes`)
}

// Run the sync
syncData().catch(console.error)
