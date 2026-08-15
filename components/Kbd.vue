<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  accessibleSeparator?: string
  keys?: string[]
}>(), {
  accessibleSeparator: ' plus ',
  keys: () => [],
})

const normalizedKeys = computed(() => {
  const keys: unknown = props.keys
  if (!Array.isArray(keys)) return []

  return keys
    .filter((key): key is string => typeof key === 'string')
    .map(key => key.trim())
    .filter(Boolean)
})

const accessibleSeparator = computed(() => (
  typeof props.accessibleSeparator === 'string'
    ? props.accessibleSeparator
    : ' plus '
))
const accessibleText = computed(() => normalizedKeys.value.join(accessibleSeparator.value))
</script>

<template>
  <span
    v-if="normalizedKeys.length > 0"
    class="presentation-kbd-sequence"
    :data-key-count="normalizedKeys.length"
  >
    <span class="presentation-kbd-accessible">{{ accessibleText }}</span>
    <template v-for="(key, index) in normalizedKeys" :key="`${index}-${key}`">
      <span
        v-if="index > 0"
        class="presentation-kbd-separator"
        aria-hidden="true"
      >+</span>
      <kbd class="presentation-kbd-key" aria-hidden="true">{{ key }}</kbd>
    </template>
  </span>
  <kbd v-else class="presentation-kbd presentation-kbd--single">
    <slot />
  </kbd>
</template>
