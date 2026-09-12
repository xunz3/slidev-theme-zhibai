<script setup lang="ts">
import { useSlideContext } from '@slidev/client'
import { computed } from 'vue'
import Authors from '../components/Authors.vue'
import SlideFrame from '../components/SlideFrame.vue'
import ClosingLogo from './ClosingLogo.vue'
import {
  isActionableEmail,
  resolveDeckAuthors,
} from '../setup/authors'
import type { PresentationChrome } from '../setup/presentation-config'

const props = withDefaults(defineProps<{
  chrome?: PresentationChrome | boolean
  contact?: string
  logo?: string
  logoAlt?: string
  showAuthors?: boolean
  subtitle?: string
  title?: string
}>(), {
  chrome: undefined,
  showAuthors: false,
})

const { $slidev } = useSlideContext()
const configs = computed(() => (($slidev.configs ?? {}) as Record<string, unknown>))
const contact = computed(() => (
  typeof props.contact === 'string' ? props.contact.trim() : ''
))
const contactHref = computed(() => (
  isActionableEmail(contact.value) ? `mailto:${contact.value}` : null
))
const logo = computed(() => (
  typeof props.logo === 'string' ? props.logo.trim() : ''
))
const logoAlt = computed(() => (
  props.logoAlt === undefined ? 'Presentation logo' : props.logoAlt.trim()
))
const showAuthorCollection = computed(() => (
  props.showAuthors && resolveDeckAuthors(configs.value).length > 0
))
const closingState = computed<'minimal' | 'rich'>(() => (
  contact.value || showAuthorCollection.value || logo.value
    ? 'rich'
    : 'minimal'
))
</script>

<template>
  <SlideFrame
    :artwork="closingState === 'rich' ? 'none' : undefined"
    :chrome="props.chrome"
    :subtitle="props.subtitle"
    :title="props.title"
    variant="closing"
  >
    <div
      class="presentation-closing"
      :class="[
        `presentation-closing--${closingState}`,
        { 'presentation-closing--has-logo': logo },
      ]"
      :data-closing-state="closingState"
    >
      <div class="presentation-closing__message">
        <slot />
      </div>
      <a
        v-if="contact && contactHref"
        class="presentation-closing__contact"
        :href="contactHref"
      >
        {{ contact }}
      </a>
      <div v-else-if="contact" class="presentation-closing__contact">
        {{ contact }}
      </div>
      <div
        v-if="showAuthorCollection"
        class="presentation-closing__authors"
      >
        <Authors />
      </div>
      <ClosingLogo
        v-if="logo"
        class="presentation-closing__logo"
        :src="logo"
        :alt="logoAlt"
      />
    </div>
  </SlideFrame>
</template>
