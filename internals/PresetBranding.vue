<script setup lang="ts">
import type {
  FrameVariant,
  PresentationPreset,
} from '../setup/presentation-config'
import ictWordmark from '../assets/ICT/signature-official.png'
import ucasSignature from '../assets/UCAS/emblem-name-bilingual-hz.svg'

defineProps<{
  preset: PresentationPreset
  variant: FrameVariant
}>()
</script>

<template>
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
    </template>

    <template v-else-if="variant === 'section'">
      <img
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
    </template>
  </template>

  <template v-else-if="preset === 'ict'">
    <template v-if="variant === 'cover'">
      <img
        class="slide-frame__ict-lockup"
        :src="ictWordmark"
        alt="Institute of Computing Technology, Chinese Academy of Sciences"
        width="569"
        height="86"
        decoding="async"
      />
    </template>

    <template v-else-if="variant === 'section'">
      <img
        class="slide-frame__ict-lockup slide-frame__ict-lockup--section"
        :src="ictWordmark"
        alt=""
        aria-hidden="true"
        width="569"
        height="86"
        decoding="async"
      />
    </template>

    <template v-else-if="variant === 'closing'">
      <img
        class="slide-frame__ict-lockup slide-frame__ict-lockup--closing"
        :src="ictWordmark"
        alt=""
        aria-hidden="true"
        width="569"
        height="86"
        decoding="async"
      />
    </template>
  </template>
</template>
