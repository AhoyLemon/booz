<template lang="pug">
.tag-filter-select
  .select-wrapper
    .selected-display(@click="toggleDropdown" :class="{ active: isOpen }")
      span.selected-text {{ displayText }}
      span.dropdown-icon {{ isOpen ? '▲' : '▼' }}
    
    .dropdown-menu(v-if="isOpen")
      .search-input-wrapper
        input.search-input(
          v-model="searchQuery"
          placeholder="Type to search tags..."
          aria-label="Search tags"
          @click.stop
          @keydown.esc="closeDropdown"
          ref="searchInput"
        )
      
      .options-list
        .option-item(
          v-for="tag in filteredTags"
          :key="tag.value"
          @click="selectTag(tag.value)"
          :class="{ selected: modelValue === tag.value }"
        )
          span.option-text {{ tag.label }}
          span.option-count ({{ tag.count }})
</template>

<script setup lang="ts">
interface TagOption {
  label: string
  value: string
  count: number
}

const props = defineProps<{
  modelValue: string
  tags: TagOption[]
  totalCount?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement>()

const displayText = computed(() => {
  if (props.modelValue === 'all') {
    return 'All Tags'
  }
  const selected = props.tags.find(t => t.value === props.modelValue)
  return selected ? `${selected.label} (${selected.count})` : 'All Tags'
})

// Compute total count once
const totalTagCount = computed(() => {
  return props.totalCount || props.tags.reduce((sum, tag) => sum + tag.count, 0)
})

const filteredTags = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  
  // Always include "All Tags" option with total count
  const allOption: TagOption = { 
    label: 'All Tags', 
    value: 'all', 
    count: totalTagCount.value
  }
  
  if (!query) {
    return [allOption, ...props.tags]
  }
  
  const filtered = props.tags.filter(tag => 
    tag.label.toLowerCase().includes(query)
  )
  
  return [allOption, ...filtered]
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      searchInput.value?.focus()
    })
  }
}

const selectTag = (value: string) => {
  emit('update:modelValue', value)
  closeDropdown()
}

const closeDropdown = () => {
  isOpen.value = false
  searchQuery.value = ''
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.tag-filter-select')) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/variables' as *;

.tag-filter-select {
  position: relative;
  min-width: 250px;
}

.select-wrapper {
  position: relative;
}

.selected-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm $spacing-lg;
  background: white;
  border: 2px solid $border-color;
  border-radius: $border-radius-md;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  user-select: none;

  &:hover {
    border-color: $accent-color;
    background: color.adjust($accent-color, $lightness: 45%);
  }

  &.active {
    border-color: $accent-color;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}

.selected-text {
  flex: 1;
  color: $text-dark;
}

.dropdown-icon {
  font-size: 0.75rem;
  color: $text-dark;
  margin-left: $spacing-sm;
  transition: transform 0.2s ease;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid $accent-color;
  border-top: none;
  border-radius: 0 0 $border-radius-md $border-radius-md;
  box-shadow: $shadow-md;
  z-index: 1000;
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.search-input-wrapper {
  padding: $spacing-sm;
  border-bottom: 1px solid $border-color;
  background: color.adjust($light-bg, $lightness: 2%);
}

.search-input {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  border: 2px solid $border-color;
  border-radius: $border-radius-sm;
  font-size: 0.875rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: $accent-color;
  }

  &::placeholder {
    color: color.adjust($text-dark, $lightness: 40%);
  }
}

.options-list {
  overflow-y: auto;
  max-height: 320px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: color.adjust($border-color, $lightness: 10%);
  }

  &::-webkit-scrollbar-thumb {
    background: $border-color;
    border-radius: 4px;

    &:hover {
      background: color.adjust($border-color, $lightness: -10%);
    }
  }
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm $spacing-lg;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid color.adjust($border-color, $lightness: 15%);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: color.adjust($accent-color, $lightness: 48%);
  }

  &.selected {
    background: color.adjust($primary-color, $lightness: 45%);
    font-weight: 600;
    color: $primary-color;
  }
}

.option-text {
  flex: 1;
  font-size: 0.875rem;
}

.option-count {
  font-size: 0.75rem;
  color: color.adjust($text-dark, $lightness: 30%);
  margin-left: $spacing-sm;
}
</style>
