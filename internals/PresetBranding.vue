<script setup lang="ts">
import type {
  FrameVariant,
  PresentationPreset,
} from '../setup/presentation-config'
import ictEmblem from '../assets/ICT/emblem.svg'
import ictWordmark from '../assets/ICT/emblem-name-bilingual-stacked.svg'
import ucasEmblem from '../assets/UCAS/emblem.svg'
import ucasEmblemWhite from '../assets/UCAS/emblem-white.png'
import ucasWordmark from '../assets/UCAS/emblem-name-bilingual-hz.svg'
import ucasWordmarkWhite from '../assets/UCAS/emblem-name-bilingual-hz-white.png'
import ucasVerticalWordmark from '../assets/UCAS/emblem-name-bilingual-vt-white.png'

defineProps<{
  preset: PresentationPreset
  variant: FrameVariant
}>()
</script>

<template>
  <aside v-if="preset === 'ucas' && variant === 'cover'" class="slide-frame__ucas-rail">
    <img
      class="slide-frame__ucas-rail-brand"
      :src="ucasVerticalWordmark"
      alt="University of Chinese Academy of Sciences"
      width="185"
      height="946"
      decoding="async"
    />
  </aside>

  <img
    v-if="preset === 'ict' && variant === 'cover'"
    class="slide-frame__ict-lockup"
    :src="ictWordmark"
    alt="Institute of Computing Technology, Chinese Academy of Sciences"
    width="728"
    height="542"
    decoding="async"
  />

  <img
    v-if="preset === 'ict' && variant === 'section'"
    class="slide-frame__ict-lockup slide-frame__ict-lockup--section"
    :src="ictWordmark"
    alt=""
    aria-hidden="true"
    width="728"
    height="542"
    decoding="async"
  />

  <img
    v-if="preset === 'ict' && variant === 'section'"
    class="slide-frame__ict-watermark"
    :src="ictEmblem"
    alt=""
    aria-hidden="true"
    width="384"
    height="316"
    decoding="async"
  />

  <template v-if="preset === 'ucas' && variant === 'section'">
    <img
      class="slide-frame__ucas-wordmark slide-frame__ucas-wordmark--theme-light"
      :src="ucasWordmark"
      alt=""
      aria-hidden="true"
      width="1016"
      height="213"
      decoding="async"
    />
    <img
      class="slide-frame__ucas-wordmark slide-frame__ucas-wordmark--theme-dark"
      :src="ucasWordmarkWhite"
      alt=""
      aria-hidden="true"
      width="1016"
      height="213"
      decoding="async"
    />
  </template>

  <img
    v-if="preset === 'ucas' && ['cover', 'section'].includes(variant)"
    class="slide-frame__ucas-watermark"
    :src="variant === 'section' ? ucasEmblemWhite : ucasEmblem"
    alt=""
    aria-hidden="true"
    width="397"
    height="397"
    decoding="async"
  />
</template>
