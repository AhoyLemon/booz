import { describe, it, expect } from 'vitest'
import { parse } from 'csv-parse/sync'

describe('Data Sync - CSV Parsing', () => {
  it('should parse CSV data correctly', () => {
    const csvData = `id,name,category,tags,inStock,bottleSize,bottleState,image
1,Test Gin,Staples,"gin,london-dry",true,750ml,opened,/test.jpg
2,Test Rum,Staples,"rum,white-rum",false,1l,empty,/rum.jpg`

    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    })

    expect(records).toHaveLength(2)
    expect(records[0].name).toBe('Test Gin')
    expect(records[0].category).toBe('Staples')
    expect(records[0].inStock).toBe('true')
    expect(records[0].bottleSize).toBe('750ml')
    expect(records[1].name).toBe('Test Rum')
    expect(records[1].inStock).toBe('false')
  })

  it('should handle tags as comma-separated values', () => {
    const csvData = `id,name,category,tags,inStock
1,Test,Staples,"gin,london-dry,premium",true`

    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    })

    const tags = records[0].tags.split(',').map((t: string) => t.trim())
    expect(tags).toEqual(['gin', 'london-dry', 'premium'])
  })
})
