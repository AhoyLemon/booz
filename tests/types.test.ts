import { describe, it, expect } from 'vitest'
import type { Bottle } from '~/types'

describe('Bottle Type', () => {
  it('should create a valid bottle object', () => {
    const bottle: Bottle = {
      id: '1',
      name: 'Test Gin',
      category: 'Staples',
      tags: ['gin', 'london-dry'],
      inStock: true,
      bottleSize: '750ml',
      bottleState: 'opened',
      image: '/test.jpg',
    }

    expect(bottle.id).toBe('1')
    expect(bottle.name).toBe('Test Gin')
    expect(bottle.category).toBe('Staples')
    expect(bottle.tags).toContain('gin')
    expect(bottle.inStock).toBe(true)
    expect(bottle.bottleSize).toBe('750ml')
    expect(bottle.bottleState).toBe('opened')
  })

  it('should handle optional fields', () => {
    const bottle: Bottle = {
      id: '2',
      name: 'Basic Bottle',
      category: 'Mixers',
      tags: ['mixer'],
      inStock: false,
    }

    expect(bottle.bottleSize).toBeUndefined()
    expect(bottle.bottleState).toBeUndefined()
    expect(bottle.image).toBeUndefined()
  })
})
