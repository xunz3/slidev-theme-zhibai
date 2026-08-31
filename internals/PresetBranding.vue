<script setup lang="ts">
import type {
  FrameVariant,
  PresentationPreset,
} from '../setup/presentation-config'
import ictEmblem from '../assets/ICT/emblem.svg'
import ictWordmark from '../assets/ICT/emblem-name-bilingual-stacked.svg'
import ucasEmblem from '../assets/UCAS/emblem.svg'
import ucasEmblemWhite from '../assets/UCAS/emblem-white.png'
import ucasWordmarkWhite from '../assets/UCAS/emblem-name-bilingual-hz-white.png'
import ucasVerticalWordmark from '../assets/UCAS/emblem-name-bilingual-vt-white.png'

withDefaults(defineProps<{
  preset: PresentationPreset
  showHeader?: boolean
  variant: FrameVariant
}>(), {
  showHeader: false,
})
</script>

<template>
  <template v-if="preset === 'ucas'">
    <template v-if="variant === 'cover'">
      <aside class="slide-frame__ucas-rail">
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
        class="slide-frame__ucas-watermark"
        :src="ucasEmblem"
        alt=""
        aria-hidden="true"
        width="397"
        height="397"
        decoding="async"
      />
    </template>

    <template v-else-if="variant === 'section'">
      <img
        v-if="!showHeader"
        class="slide-frame__ucas-wordmark"
        :src="ucasWordmarkWhite"
        alt=""
        aria-hidden="true"
        width="1016"
        height="213"
        decoding="async"
      />
      <img
        class="slide-frame__ucas-watermark"
        :src="ucasEmblemWhite"
        alt=""
        aria-hidden="true"
        width="397"
        height="397"
        decoding="async"
      />
    </template>

    <template v-else-if="variant === 'closing'">
      <aside class="slide-frame__ucas-rail slide-frame__ucas-rail--closing">
        <img
          class="slide-frame__ucas-rail-brand"
          :src="ucasVerticalWordmark"
          alt=""
          aria-hidden="true"
          width="185"
          height="946"
          decoding="async"
        />
      </aside>
      <img
        class="slide-frame__ucas-watermark slide-frame__ucas-watermark--closing"
        :src="ucasEmblem"
        alt=""
        aria-hidden="true"
        width="397"
        height="397"
        decoding="async"
      />
    </template>
  </template>

  <template v-else-if="preset === 'ict'">
    <img
      v-if="variant === 'cover'"
      class="slide-frame__ict-lockup"
      :src="ictWordmark"
      alt="Institute of Computing Technology, Chinese Academy of Sciences"
      width="728"
      height="542"
      decoding="async"
    />

    <template v-else-if="variant === 'section'">
      <img
        v-if="!showHeader"
        class="slide-frame__ict-lockup slide-frame__ict-lockup--section"
        :src="ictWordmark"
        alt=""
        aria-hidden="true"
        width="728"
        height="542"
        decoding="async"
      />
      <img
        class="slide-frame__ict-watermark"
        :src="ictEmblem"
        alt=""
        aria-hidden="true"
        width="384"
        height="316"
        decoding="async"
      />
    </template>

    <template v-else-if="variant === 'closing'">
      <img
        class="slide-frame__ict-lockup slide-frame__ict-lockup--closing"
        :src="ictWordmark"
        alt=""
        aria-hidden="true"
        width="728"
        height="542"
        decoding="async"
      />
      <img
        class="slide-frame__ict-watermark slide-frame__ict-watermark--closing"
        :src="ictEmblem"
        alt=""
        aria-hidden="true"
        width="384"
        height="316"
        decoding="async"
      />
    </template>
  </template>
</template>
