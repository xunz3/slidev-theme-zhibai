<script setup lang="ts">
import { computed } from 'vue'
import { normalizeSeal } from '../setup/presentation-config'

const props = withDefaults(defineProps<{
  text?: string | false | null
  small?: boolean
}>(), {
  small: false,
})

const label = computed(() => normalizeSeal(props.text))
const characters = computed(() => typeof label.value === 'string' ? Array.from(label.value) : [])
</script>

<template>
  <span
    v-if="characters.length"
    class="presentation-seal"
    :class="{ 'presentation-seal--small': small, 'presentation-seal--multiple': characters.length > 1 }"
    :data-seal-length="characters.length"
    role="img"
    :aria-label="`Seal: ${label}`"
  >
    <span v-for="(character, index) in characters" :key="index" aria-hidden="true">{{ character }}</span>
  </span>
</template>

<style scoped>
.presentation-seal {
  display: inline-grid;
  grid-template-columns: 1fr;
  align-content: center;
  place-items: center;
  flex: none;
  box-sizing: border-box;
  width: 36px;
  height: 36px;
  padding: 3px;
  border-radius: 2.5px;
  color: var(--presentation-seal-text);
  background: var(--presentation-seal-background);
  font-family: var(--presentation-seal-font);
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  text-align: center;
  transform: rotate(-2deg);
}

.presentation-seal--multiple {
  grid-template-columns: repeat(2, 1fr);
  font-size: 14px;
}

.presentation-seal--small {
  width: 24px;
  height: 24px;
  padding: 2px;
  font-size: 17px;
}

.presentation-seal--small.presentation-seal--multiple {
  font-size: 9px;
}

</style>
