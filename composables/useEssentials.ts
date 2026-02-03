// Composable for managing essential ingredients checklist
import type { Essential, EssentialsData } from '~/types'

export const useEssentials = () => {
  const essentials = useState<Essential[]>('essentials', () => [])
  const originalEssentials = useState<Essential[]>('originalEssentials', () => [])
  const loading = useState<boolean>('essentialsLoading', () => false)
  const saving = useState<boolean>('essentialsSaving', () => false)
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
      essentials.value = JSON.parse(JSON.stringify(data.essentials))
      originalEssentials.value = JSON.parse(JSON.stringify(data.essentials))
    } catch (e: any) {
      error.value = e.message || 'Failed to load essentials'
      console.error('Failed to fetch essentials:', e)
    } finally {
      loading.value = false
    }
  }

  // Toggle essential stock status (local only)
  const toggleEssential = (id: string) => {
    const essential = essentials.value.find(e => e.id === id)
    if (!essential) return
    essential.inStock = !essential.inStock
  }

  // Check if there are unsaved changes
  const hasUnsavedChanges = computed(() => {
    return JSON.stringify(essentials.value) !== JSON.stringify(originalEssentials.value)
  })

  // Save changes to server
  const saveChanges = async () => {
    saving.value = true
    error.value = null
    try {
      // Find which essentials have changed
      const changedEssentials = essentials.value.filter((essential, index) => {
        const original = originalEssentials.value[index]
        return essential.inStock !== original.inStock
      })

      // Update each changed essential
      const updates = changedEssentials.map(essential =>
        $fetch(`/api/essentials/${essential.id}`, {
          method: 'PUT',
          body: { id: essential.id, inStock: essential.inStock },
        })
      )

      await Promise.all(updates)

      // Update the original state to match current state
      originalEssentials.value = JSON.parse(JSON.stringify(essentials.value))
    } catch (e: any) {
      error.value = e.message || 'Failed to save changes'
      console.error('Failed to save changes:', e)
    } finally {
      saving.value = false
    }
  }

  const clearAll = () => {
    essentials.value.forEach(e => (e.inStock = false))
  }

  const checkAll = () => {
    essentials.value.forEach(e => (e.inStock = true))
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
    saving,
    error,
    fetchEssentials,
    toggleEssential,
    hasUnsavedChanges,
    saveChanges,
    clearAll,
    checkAll,
    getItemsForCategory,
    totalEssentials,
    checkedCount,
    completionPercentage,
  }
}
