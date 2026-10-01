<script setup lang="ts">
import { useSlideContext } from '@slidev/client'
import { computed, useId } from 'vue'
import { composeCoverAuthors, resolveDeckAuthors } from '../setup/authors'

const props = withDefaults(defineProps<{
  variant?: 'cards' | 'cover'
}>(), {
  variant: 'cards',
})

const { $slidev } = useSlideContext()
const configs = computed(() => (($slidev.configs ?? {}) as Record<string, unknown>))
const authors = computed(() => resolveDeckAuthors(configs.value))
const collaboration = computed(() => props.variant === 'cover' && authors.value.length > 1)
const cover = computed(() => composeCoverAuthors(authors.value))
const id = useId()
const emailLocalPart = (email?: string) => (email ?? '').split('@')[0]
const emailDomain = (email?: string) => `@${(email ?? '').split('@')[1] ?? ''}`
const classes = computed(() => props.variant === 'cover'
  ? {
      collection: 'slide-cover__authors',
      email: 'slide-cover__author-email slide-cover__author-details',
      emailInvalid: 'slide-cover__author-email slide-cover__author-details',
      institution: 'slide-cover__author-institution slide-cover__author-details',
      item: 'slide-cover__author',
      primary: 'slide-cover__author-primary slide-cover__author-name',
    }
  : {
      collection: 'presentation-authors',
      email: 'presentation-author__email',
      emailInvalid: 'presentation-author__email presentation-author__email--invalid',
      institution: 'presentation-author__institution',
      item: 'presentation-author',
      primary: 'presentation-author__primary presentation-author__name',
    })
</script>

<template>
  <div v-if="collaboration" class="slide-cover__credits" :data-author-count="authors.length">
    <ul class="slide-cover__authors">
      <li
        v-for="author in cover.authors"
        :key="author.sourceIndex"
        class="slide-cover__author"
        :aria-describedby="author.institutionNumber ? `${id}-institution-${author.institutionNumber}` : undefined"
      >
        <div class="slide-cover__author-byline">
          <a v-if="author.primaryHref" :class="classes.primary" :href="author.primaryHref">{{ emailLocalPart(author.primary) }}<wbr>{{ emailDomain(author.primary) }}</a>
          <span v-else :class="classes.primary">{{ author.primary }}</span>
          <sup v-if="cover.numbered && author.institutionNumber" class="slide-cover__affiliation-mark" aria-hidden="true">{{ author.institutionNumber }}</sup>
        </div>
        <a v-if="author.emailHref" :class="classes.email" :href="author.emailHref">{{ emailLocalPart(author.email) }}<wbr>{{ emailDomain(author.email) }}</a>
        <div v-else-if="author.email" :class="classes.emailInvalid">{{ author.email }}</div>
      </li>
    </ul>
    <ul v-if="cover.institutions.length" class="slide-cover__institutions">
      <li v-for="(institution, index) in cover.institutions" :id="`${id}-institution-${index + 1}`" :key="institution" class="slide-cover__institution">
        <sup v-if="cover.numbered" class="slide-cover__affiliation-mark" aria-hidden="true">{{ index + 1 }}</sup>
        <span class="slide-cover__author-institution">{{ institution }}</span>
      </li>
    </ul>
  </div>
  <ul v-else-if="authors.length" :class="classes.collection">
    <li
      v-for="author in authors"
      :key="author.sourceIndex"
      :class="classes.item"
    >
      <a
        v-if="author.primaryHref"
        :class="classes.primary"
        :href="author.primaryHref"
      >
        <template v-if="variant === 'cover'">{{ emailLocalPart(author.primary) }}<wbr>{{ emailDomain(author.primary) }}</template>
        <template v-else>{{ author.primary }}</template>
      </a>
      <div
        v-else
        :class="classes.primary"
      >
        {{ author.primary }}
      </div>
      <div v-if="author.institution" :class="classes.institution">
        {{ author.institution }}
      </div>
      <a
        v-if="author.emailHref"
        :class="classes.email"
        :href="author.emailHref"
      >
        <template v-if="variant === 'cover'">{{ emailLocalPart(author.email) }}<wbr>{{ emailDomain(author.email) }}</template>
        <template v-else>{{ author.email }}</template>
      </a>
      <div
        v-else-if="author.email"
        :class="classes.emailInvalid"
      >
        {{ author.email }}
      </div>
    </li>
  </ul>
</template>
