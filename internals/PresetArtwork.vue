<script setup lang="ts">
import { resolveAssetUrl } from '@slidev/client'
import { computed, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import type { PresentationArtwork } from '../setup/presentation-config'

const props = defineProps<{ artwork: PresentationArtwork }>()

const style = computed<CSSProperties>(() => ({
  '--presentation-artwork-fit': props.artwork.fit,
  '--presentation-artwork-position': props.artwork.position,
  ...(props.artwork.opacity === null ? {} : { '--presentation-artwork-opacity': props.artwork.opacity }),
}))
const failedSources = ref<string[]>([])
watch(() => [props.artwork.src, props.artwork.darkSrc], () => { failedSources.value = [] })
const lightSource = computed(() => props.artwork.src && !failedSources.value.includes(props.artwork.src)
  ? resolveAssetUrl(props.artwork.src) : null)
const darkSource = computed(() => props.artwork.darkSrc && !failedSources.value.includes(props.artwork.darkSrc)
  ? resolveAssetUrl(props.artwork.darkSrc) : null)
const onError = (source: string | null) => {
  if (source && !failedSources.value.includes(source)) failedSources.value.push(source)
}

// Original, resolution-independent line studies. No external requests or SVG IDs:
// the same artwork can safely appear on every slide in overview and export mode.
const folds = Array.from({ length: 15 }, (_, i) => {
  const x = 55 + i * 12
  return `M ${x} -30 C ${x - 155} 135 ${x + 180} 180 ${x + 86} 336 S ${x - 110} 485 ${x + 56} 610`
})
const orbits = [108, 136, 164, 192, 220]
const grid = [40, 100, 160, 220, 280, 340]
const flows = Array.from({ length: 13 }, (_, i) => (
  `M -75 ${500 + i * 5} C ${90 + i * 3} ${475 - i * 14}, ${96 + i * 13} ${160 + i * 8}, 450 ${110 + i * 17}`
))
const crossFlows = Array.from({ length: 6 }, (_, i) => (
  `M -65 ${105 + i * 10} C 90 ${160 + i * 15}, 290 ${280 - i * 12}, 430 ${435 - i * 28}`
))
const flowNodes = [[5, 0.4], [9, 0.72], [2, 0.88]].map(([i, t]) => {
  const u = 1 - t
  return {
    x: u ** 3 * -75 + 3 * u ** 2 * t * (90 + i * 3) + 3 * u * t ** 2 * (96 + i * 13) + t ** 3 * 450,
    y: u ** 3 * (500 + i * 5) + 3 * u ** 2 * t * (475 - i * 14) + 3 * u * t ** 2 * (160 + i * 8) + t ** 3 * (110 + i * 17),
  }
})
// A deterministic point field keeps overview, export, and revisited slides identical.
const dots = Array.from({ length: 180 }, (_, i) => {
  const radius = Math.sqrt(i / 180) * 190
  const angle = i * 2.399963229728653
  return {
    x: 205 + Math.cos(angle) * radius * 0.83,
    y: 290 + Math.sin(angle) * radius,
    radius: 0.7 + (1 - i / 180) * 1.1,
    opacity: 0.15 + (1 - i / 180) * 0.6,
  }
})
</script>

<template>
  <div class="preset-artwork" :data-artwork="artwork.type" :style="style" aria-hidden="true">
    <svg
      v-if="artwork.type === 'folds'"
      class="preset-artwork__drawing preset-artwork__fold"
      viewBox="0 0 400 560"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <path class="preset-artwork__wash" d="M 155 -30 C 0 135 335 180 241 336 S 45 485 211 610 H 410 V -30 Z" />
      <path v-for="(path, i) in folds" :key="i" :d="path" pathLength="1" class="preset-artwork__line" :style="{ '--artwork-line-index': i }" />
      <circle cx="132" cy="365" r="5" class="preset-artwork__point" />
    </svg>

    <svg
      v-else-if="artwork.type === 'orbits'"
      class="preset-artwork__drawing preset-artwork__orbits"
      viewBox="0 0 400 560"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <circle v-for="(r, i) in orbits" :key="r" cx="255" cy="275" :r="r" pathLength="1" class="preset-artwork__line" :style="{ '--artwork-line-index': i * 2 }" />
      <path d="M 255 0 V 560 M 0 275 H 400" class="preset-artwork__guide" />
      <circle cx="147" cy="275" r="4" class="preset-artwork__point" />
    </svg>

    <svg
      v-else-if="artwork.type === 'lattice'"
      class="preset-artwork__drawing preset-artwork__lattice"
      viewBox="0 0 400 560"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <g class="preset-artwork__guide">
        <path v-for="x in grid" :key="x" :d="`M ${x} 40 V 520 M 20 ${x + 60} H 380`" />
        <path d="M 28 40 H 52 M 40 28 V 52 M 328 520 H 352 M 340 508 V 532" />
      </g>
      <path d="M 200 156 L 320 225 L 200 294 L 80 225 Z" class="preset-artwork__wash" />
      <g class="preset-artwork__line">
        <path d="M 200 156 L 320 225 V 363 L 200 432 L 80 363 V 225 Z M 80 225 L 200 294 L 320 225 M 200 294 V 432" pathLength="1" />
        <path d="M 200 196 L 286 245 V 344 L 200 393 L 114 344 V 245 Z M 114 245 L 200 294 L 286 245" pathLength="1" />
        <path d="M 200 236 L 251 265 V 325 L 200 354 L 149 325 V 265 Z M 149 265 L 200 294 L 251 265" pathLength="1" />
      </g>
      <path d="M 200 156 V 294 L 80 363 M 200 294 L 320 363" class="preset-artwork__guide" />
      <rect x="195" y="151" width="10" height="10" class="preset-artwork__point" />
      <rect x="195" y="289" width="10" height="10" class="preset-artwork__point" />
    </svg>

    <svg
      v-else-if="artwork.type === 'flow'"
      class="preset-artwork__drawing preset-artwork__flow"
      viewBox="0 0 400 560"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <path v-for="(path, i) in crossFlows" :key="`cross-${i}`" :d="path" class="preset-artwork__guide" />
      <path v-for="(path, i) in flows" :key="i" :d="path" pathLength="1" class="preset-artwork__line" :style="{ '--artwork-line-index': i }" />
      <circle v-for="(point, i) in flowNodes" :key="`point-${i}`" :cx="point.x" :cy="point.y" r="3" class="preset-artwork__point" />
    </svg>

    <div v-else-if="artwork.type === 'field'" class="preset-artwork__field">
      <svg class="preset-artwork__drawing" viewBox="0 0 400 560" fill="none" preserveAspectRatio="xMidYMid slice">
        <circle cx="195" cy="336" r="100" class="preset-artwork__line" pathLength="1" />
        <path d="M 248 35 C 98 171 415 165 328 284" class="preset-artwork__guide" />
        <circle cx="302" cy="163" r="3" class="preset-artwork__point" />
        <circle cx="97" cy="414" r="2.5" class="preset-artwork__point" />
      </svg>
    </div>

    <svg
      v-else-if="artwork.type === 'dots'"
      class="preset-artwork__drawing preset-artwork__dots"
      viewBox="0 0 400 560"
      fill="currentColor"
      preserveAspectRatio="xMidYMid slice"
    >
      <circle v-for="(dot, i) in dots" :key="i" :cx="dot.x" :cy="dot.y" :r="dot.radius" :opacity="dot.opacity" />
      <circle cx="289" cy="153" r="3.5" class="preset-artwork__point" />
      <circle cx="135" cy="363" r="3" class="preset-artwork__point" />
      <circle cx="350" cy="342" r="3.5" class="preset-artwork__point" />
    </svg>

    <div v-else-if="artwork.type === 'custom'" class="preset-artwork__custom">
      <img
        v-if="lightSource"
        :key="`light-${lightSource}`"
        class="preset-artwork__image preset-artwork__image--light"
        :src="lightSource"
        alt=""
        decoding="async"
        @error="onError(artwork.src)"
      />
      <img
        v-if="darkSource"
        :key="`dark-${darkSource}`"
        class="preset-artwork__image preset-artwork__image--dark"
        :src="darkSource"
        alt=""
        decoding="async"
        @error="onError(artwork.darkSrc)"
      />
    </div>
  </div>
</template>
