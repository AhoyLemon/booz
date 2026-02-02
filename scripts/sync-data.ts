import { Client } from '@notionhq/client'
import { parse } from 'csv-parse/sync'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { Bottle, Recipe, InventoryData, RecipeData } from '../types'

const DATA_DIR = join(process.cwd(), 'data')
const PUBLIC_DATA_DIR = join(process.cwd(), 'public', 'data')

interface NotionBottle {
  '': { title: Array<{ plain_text: string }> } // Empty string for title column
  Category: { select: { name: string } }
  'Type(s)': { multi_select: Array<{ name: string }> }
  Status: { select: { name: string } }
  Photo: { files: Array<{ file?: { url: string }; external?: { url: string } }> }
}

async function fetchFromNotion(): Promise<Bottle[]> {
  const apiKey = process.env.NOTION_API_KEY
  const databaseId = process.env.NOTION_DATABASE_ID

  if (!apiKey || !databaseId) {
    console.log('⚠️  Notion API credentials not found, skipping Notion sync')
    return []
  }

  try {
    console.log('📡 Fetching inventory from Notion...')
    const notion = new Client({ auth: apiKey })

    const response = await notion.databases.query({
      database_id: databaseId,
    })

    const bottles: Bottle[] = response.results.map((page: any) => {
      const props = page.properties as NotionBottle
      const imageFile = props.Photo?.files?.[0]
      const imageUrl = imageFile?.file?.url || imageFile?.external?.url
      const status = props.Status?.select?.name?.toLowerCase()

      return {
        id: page.id,
        name: props[''].title[0]?.plain_text || '',
        category: props.Category.select?.name || 'Other',
        tags: props['Type(s)']?.multi_select?.map(tag => tag.name) || [],
        inStock: status !== 'empty',
        bottleSize: undefined,
        bottleState:
          (status as 'unopened' | 'opened' | 'empty') || undefined,
        image: imageUrl || undefined,
      }
    })

    console.log(`✅ Fetched ${bottles.length} bottles from Notion`)
    return bottles
  } catch (error) {
    console.error('❌ Error fetching from Notion:', error)
    return []
  }
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
