import { describe, it, expect } from 'vitest'

describe('Tag Filtering', () => {
  it('should extract unique tags from inventory', () => {
    const inventory = [
      { id: '1', name: 'Bottle 1', category: 'Staples', tags: ['tequila', 'reposado'], inStock: true },
      { id: '2', name: 'Bottle 2', category: 'Staples', tags: ['gin', 'london dry'], inStock: true },
      { id: '3', name: 'Bottle 3', category: 'Liqueur', tags: ['tequila', 'blanco'], inStock: false },
    ]

    const tags = new Set<string>()
    inventory.forEach(bottle => {
      bottle.tags.forEach(tag => tags.add(tag))
    })
    const uniqueTags = Array.from(tags).sort()

    expect(uniqueTags).toEqual(['blanco', 'gin', 'london dry', 'reposado', 'tequila'])
  })

  it('should filter bottles by tag', () => {
    const inventory = [
      { id: '1', name: 'Bottle 1', category: 'Staples', tags: ['tequila', 'reposado'], inStock: true },
      { id: '2', name: 'Bottle 2', category: 'Staples', tags: ['gin', 'london dry'], inStock: true },
      { id: '3', name: 'Bottle 3', category: 'Liqueur', tags: ['tequila', 'blanco'], inStock: false },
    ]

    const tagFilter = 'tequila'
    const filtered = inventory.filter(b => b.tags.includes(tagFilter))

    expect(filtered).toHaveLength(2)
    expect(filtered.map(b => b.id)).toEqual(['1', '3'])
  })

  it('should combine tag and category filters', () => {
    const inventory = [
      { id: '1', name: 'Bottle 1', category: 'Staples', tags: ['tequila', 'reposado'], inStock: true },
      { id: '2', name: 'Bottle 2', category: 'Staples', tags: ['gin', 'london dry'], inStock: true },
      { id: '3', name: 'Bottle 3', category: 'Liqueur', tags: ['tequila', 'blanco'], inStock: false },
    ]

    const categoryFilter = 'Staples'
    const tagFilter = 'tequila'

    let filtered = inventory
    filtered = filtered.filter(b => b.category === categoryFilter)
    filtered = filtered.filter(b => b.tags.includes(tagFilter))

    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('1')
  })

  it('should count bottles for each tag', () => {
    const inventory = [
      { id: '1', name: 'Bottle 1', category: 'Staples', tags: ['tequila', 'reposado'], inStock: true },
      { id: '2', name: 'Bottle 2', category: 'Staples', tags: ['gin', 'london dry'], inStock: true },
      { id: '3', name: 'Bottle 3', category: 'Liqueur', tags: ['tequila', 'blanco'], inStock: false },
    ]

    const getBottleCountForTag = (tag: string) => {
      return inventory.filter(b => b.tags.includes(tag)).length
    }

    expect(getBottleCountForTag('tequila')).toBe(2)
    expect(getBottleCountForTag('gin')).toBe(1)
    expect(getBottleCountForTag('reposado')).toBe(1)
    expect(getBottleCountForTag('vodka')).toBe(0)
  })
})

describe('Tag Hierarchy', () => {
  interface TagCategory {
    name: string
    tags: string[]
    parent?: string
  }

  const tagHierarchy: TagCategory[] = [
    {
      name: 'Base Spirits',
      tags: ['vodka', 'gin', 'rum', 'tequila', 'whiskey'],
    },
    {
      name: 'Whiskey Types',
      tags: ['bourbon', 'scotch', 'rye', 'irish whiskey'],
      parent: 'whiskey',
    },
    {
      name: 'Tequila Types',
      tags: ['blanco', 'reposado', 'añejo'],
      parent: 'tequila',
    },
    {
      name: 'Gin Types',
      tags: ['london dry', 'old tom', 'navy strength'],
      parent: 'gin',
    },
  ]

  const isTagDisabled = (tag: string, categoryName: string, selectedTags: string[]): boolean => {
    const category = tagHierarchy.find(c => c.name === categoryName)
    if (category?.parent) {
      return !selectedTags.includes(category.parent)
    }
    return false
  }

  it('should disable child tags when parent is not selected', () => {
    const selectedTags: string[] = []

    expect(isTagDisabled('bourbon', 'Whiskey Types', selectedTags)).toBe(true)
    expect(isTagDisabled('scotch', 'Whiskey Types', selectedTags)).toBe(true)
    expect(isTagDisabled('reposado', 'Tequila Types', selectedTags)).toBe(true)
  })

  it('should enable child tags when parent is selected', () => {
    const selectedTags = ['whiskey']

    expect(isTagDisabled('bourbon', 'Whiskey Types', selectedTags)).toBe(false)
    expect(isTagDisabled('scotch', 'Whiskey Types', selectedTags)).toBe(false)
    expect(isTagDisabled('rye', 'Whiskey Types', selectedTags)).toBe(false)
  })

  it('should enable tequila child tags when tequila is selected', () => {
    const selectedTags = ['tequila']

    expect(isTagDisabled('blanco', 'Tequila Types', selectedTags)).toBe(false)
    expect(isTagDisabled('reposado', 'Tequila Types', selectedTags)).toBe(false)
    expect(isTagDisabled('añejo', 'Tequila Types', selectedTags)).toBe(false)
  })

  it('should not disable base spirit tags', () => {
    const selectedTags: string[] = []

    expect(isTagDisabled('vodka', 'Base Spirits', selectedTags)).toBe(false)
    expect(isTagDisabled('gin', 'Base Spirits', selectedTags)).toBe(false)
    expect(isTagDisabled('whiskey', 'Base Spirits', selectedTags)).toBe(false)
  })

  it('should remove dependent tags when parent is removed', () => {
    let selectedTags = ['whiskey', 'bourbon', 'scotch']

    // Remove whiskey
    const tagToRemove = 'whiskey'
    const index = selectedTags.indexOf(tagToRemove)
    if (index > -1) {
      const newTags = [...selectedTags]
      newTags.splice(index, 1)

      // Remove dependent tags
      const dependentTags = tagHierarchy
        .filter(c => c.parent === tagToRemove)
        .flatMap(c => c.tags)

      selectedTags = newTags.filter(t => !dependentTags.includes(t))
    }

    expect(selectedTags).toEqual([])
  })

  it('should keep independent tags when removing a tag', () => {
    let selectedTags = ['whiskey', 'bourbon', 'tequila', 'reposado']

    // Remove whiskey and its dependents
    const tagToRemove = 'whiskey'
    const index = selectedTags.indexOf(tagToRemove)
    if (index > -1) {
      const newTags = [...selectedTags]
      newTags.splice(index, 1)

      const dependentTags = tagHierarchy
        .filter(c => c.parent === tagToRemove)
        .flatMap(c => c.tags)

      selectedTags = newTags.filter(t => !dependentTags.includes(t))
    }

    // tequila and reposado should remain
    expect(selectedTags).toEqual(['tequila', 'reposado'])
  })
})

describe('Tag Selector State Management', () => {
  it('should add tag to selected tags', () => {
    const selectedTags: string[] = []
    const tagToAdd = 'tequila'

    const newTags = [...selectedTags, tagToAdd]

    expect(newTags).toEqual(['tequila'])
  })

  it('should remove tag from selected tags', () => {
    const selectedTags = ['tequila', 'reposado', 'gin']
    const tagToRemove = 'reposado'

    const newTags = selectedTags.filter(t => t !== tagToRemove)

    expect(newTags).toEqual(['tequila', 'gin'])
  })

  it('should toggle tag selection', () => {
    let selectedTags = ['tequila']

    // Add gin
    if (!selectedTags.includes('gin')) {
      selectedTags = [...selectedTags, 'gin']
    }
    expect(selectedTags).toEqual(['tequila', 'gin'])

    // Remove tequila
    if (selectedTags.includes('tequila')) {
      selectedTags = selectedTags.filter(t => t !== 'tequila')
    }
    expect(selectedTags).toEqual(['gin'])

    // Add tequila back
    if (!selectedTags.includes('tequila')) {
      selectedTags = [...selectedTags, 'tequila']
    }
    expect(selectedTags).toEqual(['gin', 'tequila'])
  })
})
