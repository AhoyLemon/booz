import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'
import type { Bottle } from '~/types'

const DATA_DIR = join(process.cwd(), 'data')
const CSV_PATH = join(DATA_DIR, 'inventory.csv')

export interface CSVBottle {
  id: string
  name: string
  category: string
  tags: string
  inStock: string
  bottleSize: string
  bottleState: string
  image: string
}

export function readInventoryCSV(): Bottle[] {
  if (!existsSync(CSV_PATH)) {
    return []
  }

  try {
    const csvContent = readFileSync(CSV_PATH, 'utf-8')
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    }) as CSVBottle[]

    return records.map((record) => ({
      id: record.id,
      name: record.name,
      category: record.category,
      tags: record.tags.split(',').map((tag) => tag.trim()),
      inStock: record.inStock === 'true',
      bottleSize: record.bottleSize || undefined,
      bottleState: (record.bottleState as 'unopened' | 'opened' | 'empty') || undefined,
      image: record.image || undefined,
    }))
  } catch (error) {
    console.error('Error reading CSV:', error)
    throw error
  }
}

export function writeInventoryCSV(bottles: Bottle[]): void {
  try {
    const records: CSVBottle[] = bottles.map((bottle) => ({
      id: bottle.id,
      name: bottle.name,
      category: bottle.category,
      tags: bottle.tags.join(', '),
      inStock: String(bottle.inStock),
      bottleSize: bottle.bottleSize || '',
      bottleState: bottle.bottleState || '',
      image: bottle.image || '',
    }))

    const csv = stringify(records, {
      header: true,
      columns: ['id', 'name', 'category', 'tags', 'inStock', 'bottleSize', 'bottleState', 'image'],
    })

    writeFileSync(CSV_PATH, csv, 'utf-8')
  } catch (error) {
    console.error('Error writing CSV:', error)
    throw error
  }
}

/**
 * Normalizes image path to ensure it has the correct prefix
 * Converts "bibandtucker.webp" to "/images/bottles/bibandtucker.webp"
 */
export function normalizeImagePath(imagePath: string | undefined): string | undefined {
  if (!imagePath || imagePath.trim() === '') return undefined
  
  // If already has the prefix, return as-is
  if (imagePath.startsWith('/images/bottles/')) {
    return imagePath
  }
  
  // If it's just a filename, add the prefix
  if (!imagePath.startsWith('/')) {
    return `/images/bottles/${imagePath}`
  }
  
  // Otherwise return as-is
  return imagePath
}

export function getNextId(bottles: Bottle[]): string {
  if (bottles.length === 0) return '1'
  
  const numericIds = bottles
    .map((b) => parseInt(b.id, 10))
    .filter((id) => !isNaN(id))
  
  if (numericIds.length === 0) return '1'
  
  return String(Math.max(...numericIds) + 1)
}
