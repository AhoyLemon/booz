// Composable for managing essential ingredients checklist
import type { Essential, EssentialsData } from '~/types'

export const useEssentials = () => {
  const essentials = useState<Essential[]>('essentials', () => [])
  const loading = useState<boolean>('essentialsLoading', () => false)
  const error = useState<string | null>('essentialsError', () => null)

  // Category configuration
  const essentialCategories = [
    { name: 'Basics', icon: '🧊' },
    { name: 'Carbonated & Mixers', icon: '🥤' },
    { name: 'Citrus & Fruit', icon: '🍋' },
    { name: 'Sweeteners', icon: '🍯' },
    { name: 'Bitters & Aromatics', icon: '🌿' },
    { name: 'Dairy & Cream', icon: '🥛' },
    { name: 'Garnishes', icon: '🍒' },
  ]

  // Fetch essentials from server
  const fetchEssentials = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await $fetch<EssentialsData>('/api/essentials')
      essentials.value = data.essentials
    } catch (e: any) {
      error.value = e.message || 'Failed to load essentials'
      console.error('Failed to fetch essentials:', e)
    } finally {
      loading.value = false
    }
  }

  // Toggle essential stock status
  const toggleEssential = async (id: string) => {
    const essential = essentials.value.find(e => e.id === id)
    if (!essential) return

    // Optimistic update
    const previousState = essential.inStock
    essential.inStock = !essential.inStock

    try {
      await $fetch(`/api/essentials/${id}`, {
        method: 'PUT',
        body: { id, inStock: essential.inStock },
      })
    } catch (e: any) {
      // Revert on error
      essential.inStock = previousState
      error.value = e.message || 'Failed to update essential'
      console.error('Failed to toggle essential:', e)
    }
  }

  const isChecked = (itemName: string) => {
    const essential = essentials.value.find(e => e.name === itemName)
    return essential?.inStock || false
  }

  const clearAll = async () => {
    // Update all essentials to false
    const updates = essentials.value.map(essential =>
      $fetch(`/api/essentials/${essential.id}`, {
        method: 'PUT',
        body: { id: essential.id, inStock: false },
      })
    )

    try {
      await Promise.all(updates)
      essentials.value.forEach(e => (e.inStock = false))
    } catch (e: any) {
      error.value = e.message || 'Failed to clear all essentials'
      console.error('Failed to clear all:', e)
      // Refetch to get correct state
      await fetchEssentials()
    }
  }

  const checkAll = async () => {
    // Update all essentials to true
    const updates = essentials.value.map(essential =>
      $fetch(`/api/essentials/${essential.id}`, {
        method: 'PUT',
        body: { id: essential.id, inStock: true },
      })
    )

    try {
      await Promise.all(updates)
      essentials.value.forEach(e => (e.inStock = true))
    } catch (e: any) {
      error.value = e.message || 'Failed to check all essentials'
      console.error('Failed to check all:', e)
      // Refetch to get correct state
      await fetchEssentials()
    }
  }

  // Get items for a category
  const getItemsForCategory = (categoryName: string) => {
    return essentials.value.filter(e => e.category === categoryName)
  }

  const totalEssentials = computed(() => essentials.value.length)

  const checkedCount = computed(() => essentials.value.filter(e => e.inStock).length)

  const completionPercentage = computed(() => {
    if (totalEssentials.value === 0) return 0
    return Math.round((checkedCount.value / totalEssentials.value) * 100)
  })

  return {
    essentials,
    essentialCategories,
    loading,
    error,
    fetchEssentials,
    toggleEssential,
    isChecked,
    clearAll,
    checkAll,
    getItemsForCategory,
    totalEssentials,
    checkedCount,
    completionPercentage,
  }
}
