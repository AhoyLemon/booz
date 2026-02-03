import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { BeerWine, BeerWineData } from '~/types'

const DATA_DIR = join(process.cwd(), 'data')
const BEER_WINE_PATH = join(DATA_DIR, 'beer-wine.json')
const PUBLIC_DATA_DIR = join(process.cwd(), 'public', 'data')
const PUBLIC_BEER_WINE_PATH = join(PUBLIC_DATA_DIR, 'beer-wine.json')

export function readBeerWineData(): BeerWine[] {
  if (!existsSync(BEER_WINE_PATH)) {
    return []
  }

  try {
    const content = readFileSync(BEER_WINE_PATH, 'utf-8')
    const data: BeerWineData = JSON.parse(content)
    return data.items || []
  } catch (error) {
    console.error('Error reading beer-wine.json:', error)
    return []
  }
}

export function writeBeerWineData(items: BeerWine[]): void {
  try {
    const data: BeerWineData = {
      items,
      lastUpdated: new Date().toISOString(),
    }

    // Write to data directory
    writeFileSync(BEER_WINE_PATH, JSON.stringify(data, null, 2), 'utf-8')

    // Also write to public directory
    writeFileSync(PUBLIC_BEER_WINE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing beer-wine.json:', error)
    throw error
  }
}

export function getNextBeerWineId(items: BeerWine[]): string {
  if (items.length === 0) return '1'

  const numericIds = items.map(item => parseInt(item.id, 10)).filter(id => !isNaN(id))

  if (numericIds.length === 0) return '1'

  return String(Math.max(...numericIds) + 1)
}
