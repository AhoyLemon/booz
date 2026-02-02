import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { readInventoryCSV, writeInventoryCSV, getNextId, normalizeImagePath } from '../server/utils/csvHelper'
import type { Bottle } from '../types'

const TEST_CSV_PATH = join(process.cwd(), 'data', 'inventory.test.csv')
const ORIGINAL_CSV_PATH = join(process.cwd(), 'data', 'inventory.csv')

describe('CSV Helper Functions', () => {
  let originalData: string

  beforeEach(() => {
    // Backup original CSV if it exists
    if (existsSync(ORIGINAL_CSV_PATH)) {
      originalData = readFileSync(ORIGINAL_CSV_PATH, 'utf-8')
    }
  })

  afterEach(() => {
    // Restore original CSV
    if (originalData) {
      writeFileSync(ORIGINAL_CSV_PATH, originalData, 'utf-8')
    }
  })

  describe('normalizeImagePath', () => {
    it('should add prefix to simple filename', () => {
      expect(normalizeImagePath('test.jpg')).toBe('/images/bottles/test.jpg')
    })

    it('should not modify path that already has prefix', () => {
      expect(normalizeImagePath('/images/bottles/test.jpg')).toBe('/images/bottles/test.jpg')
    })

    it('should return undefined for empty input', () => {
      expect(normalizeImagePath(undefined)).toBe(undefined)
      expect(normalizeImagePath('')).toBe(undefined)
    })

    it('should handle paths that start with slash', () => {
      expect(normalizeImagePath('/other/path/test.jpg')).toBe('/other/path/test.jpg')
    })
  })

  it('should read bottles from CSV correctly', () => {
    const csvContent = `id,name,category,tags,inStock,bottleSize,bottleState,image
1,Test Gin,Staples,"gin, london dry",true,750ml,opened,test.jpg
2,Test Rum,Staples,"rum, white",false,1l,empty,`

    writeFileSync(ORIGINAL_CSV_PATH, csvContent, 'utf-8')

    const bottles = readInventoryCSV()

    expect(bottles).toHaveLength(2)
    expect(bottles[0]).toEqual({
      id: '1',
      name: 'Test Gin',
      category: 'Staples',
      tags: ['gin', 'london dry'],
      inStock: true,
      bottleSize: '750ml',
      bottleState: 'opened',
      image: 'test.jpg',
    })
    expect(bottles[1]).toEqual({
      id: '2',
      name: 'Test Rum',
      category: 'Staples',
      tags: ['rum', 'white'],
      inStock: false,
      bottleSize: '1l',
      bottleState: 'empty',
      image: undefined,
    })
  })

  it('should write bottles to CSV correctly', () => {
    const bottles: Bottle[] = [
      {
        id: '1',
        name: 'Test Vodka',
        category: 'Staples',
        tags: ['vodka', 'premium'],
        inStock: true,
        bottleSize: '750ml',
        bottleState: 'unopened',
        image: 'vodka.jpg',
      },
      {
        id: '2',
        name: 'Test Whiskey',
        category: 'Special Occasion',
        tags: ['whiskey', 'bourbon'],
        inStock: false,
      },
    ]

    writeInventoryCSV(bottles)

    const content = readFileSync(ORIGINAL_CSV_PATH, 'utf-8')
    expect(content).toContain('Test Vodka')
    expect(content).toContain('Test Whiskey')
    expect(content).toContain('vodka, premium')
    expect(content).toContain('whiskey, bourbon')
  })

  it('should generate next ID correctly', () => {
    const bottles: Bottle[] = [
      {
        id: '1',
        name: 'Test 1',
        category: 'Staples',
        tags: [],
        inStock: true,
      },
      {
        id: '3',
        name: 'Test 3',
        category: 'Staples',
        tags: [],
        inStock: true,
      },
    ]

    const nextId = getNextId(bottles)
    expect(nextId).toBe('4')
  })

  it('should generate ID 1 for empty list', () => {
    const nextId = getNextId([])
    expect(nextId).toBe('1')
  })

  it('should handle non-numeric IDs', () => {
    const bottles: Bottle[] = [
      {
        id: 'abc',
        name: 'Test',
        category: 'Staples',
        tags: [],
        inStock: true,
      },
    ]

    const nextId = getNextId(bottles)
    expect(nextId).toBe('1')
  })
})
