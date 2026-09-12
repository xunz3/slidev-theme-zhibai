<script setup lang="ts">
import type {
  FrameVariant,
  PresentationArtwork,
  PresentationCoverAlign,
  PresentationPreset,
} from '../setup/presentation-config'
import ictWordmark from '../assets/ICT/emblem-name-bilingual-stacked.svg'
import ucasEmblem from '../assets/UCAS/emblem.svg'
import ucasSignature from '../assets/UCAS/emblem-name-bilingual-hz.svg'
import PresetArtwork from './PresetArtwork.vue'

withDefaults(defineProps<{
  artwork: PresentationArtwork
  coverAlign: PresentationCoverAlign
  preset: PresentationPreset
  showHeader?: boolean
  variant: FrameVariant
}>(), {
  showHeader: false,
})
</script>

<template>
  <PresetArtwork
    v-if="artwork.type !== 'none' && ['cover', 'section', 'closing'].includes(variant)"
    :artwork="artwork"
  />
  <template v-if="preset === 'ucas'">
    <template v-if="variant === 'cover'">
      <aside class="slide-frame__ucas-rail">
        <img
          class="slide-frame__ucas-rail-brand"
          :src="ucasSignature"
          alt="University of Chinese Academy of Sciences"
          width="1016"
          height="213"
          decoding="async"
        />
      </aside>
      <img
        v-if="artwork.type === 'orbits' && artwork.placement === 'right' && coverAlign === 'left'"
        class="slide-frame__ucas-watermark"
        :style="artwork.opacity === null ? undefined : { opacity: artwork.opacity }"
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
        :src="ucasSignature"
        alt=""
        aria-hidden="true"
        width="1016"
        height="213"
        decoding="async"
      />
    </template>

    <template v-else-if="variant === 'closing'">
      <aside class="slide-frame__ucas-rail slide-frame__ucas-rail--closing">
        <img
          class="slide-frame__ucas-rail-brand"
          :src="ucasSignature"
          alt=""
          aria-hidden="true"
          width="1016"
          height="213"
          decoding="async"
        />
      </aside>
      <img
        v-if="artwork.type === 'orbits' && artwork.placement === 'right'"
        class="slide-frame__ucas-watermark slide-frame__ucas-watermark--closing"
        :style="artwork.opacity === null ? undefined : { opacity: artwork.opacity }"
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
    <template v-if="variant === 'cover'">
      <img
        class="slide-frame__ict-lockup"
        :src="ictWordmark"
        alt="Institute of Computing Technology, Chinese Academy of Sciences"
        width="728"
        height="542"
        decoding="async"
      />
    </template>

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
    </template>
  </template>
</template>
