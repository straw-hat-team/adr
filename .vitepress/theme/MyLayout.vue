<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';
import { useData } from 'vitepress';
import { computed } from 'vue';
import { data as radar } from './radar.data';
import { useHref } from './use-href';

const { Layout } = DefaultTheme;
const data = useData();
const href = useHref();

const radarPlacement = computed(() => {
  const slug = /^radar\/items\/(.+)\.md$/.exec(data.page.value.relativePath)?.[1];
  const blip = radar.blips.find((candidate) => candidate.slug === slug);

  if (blip === undefined) {
    return null;
  }

  const quadrant = radar.quadrants.find((candidate) => candidate.id === blip.quadrant);

  return {
    quadrant: quadrant?.name ?? blip.quadrant,
    quadrantLink: quadrant?.link ?? null,
    ring: radar.rings.find((candidate) => candidate.id === blip.ring)?.name ?? blip.ring,
    tags: blip.tags,
  };
});
</script>
<template>
  <Layout>
    <template #doc-before>
      <div v-if="data.frontmatter.value.state" class="flex gap-4 items-center mb-4">
        <div class="flex gap-2">
          <span
            class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset text-gray-900 dark:text-white"
            :class="{
              'dark:ring-yellow-400 ring-yellow-500': data.frontmatter.value.state === 'Draft',
              'dark:ring-blue-400 ring-blue-500': data.frontmatter.value.state === 'Reviewing',
              'dark:ring-green-400 ring-green-500': data.frontmatter.value.state === 'Approved',
              'dark:ring-red-400 ring-red-500': ['Withdrawn', 'Rejected'].includes(data.frontmatter.value.state),
              'dark:ring-gray-400 ring-gray-500': ['Deferred', 'Replaced'].includes(data.frontmatter.value.state),
            }"
          >
            <svg
              class="size-1.5"
              :class="{
                'dark:fill-yellow-400 fill-yellow-500': data.frontmatter.value.state === 'Draft',
                'dark:fill-blue-400 fill-blue-500': data.frontmatter.value.state === 'Reviewing',
                'dark:fill-green-400 fill-green-500': data.frontmatter.value.state === 'Approved',
                'dark:fill-red-400 fill-red-500': ['Withdrawn', 'Rejected'].includes(data.frontmatter.value.state),
                'dark:fill-gray-400 fill-gray-500': ['Deferred', 'Replaced'].includes(data.frontmatter.value.state),
              }"
              viewBox="0 0 6 6"
              aria-hidden="true"
            >
              <circle cx="3" cy="3" r="3" />
            </svg>
            State: <span class="font-bold">{{ data.frontmatter.value.state }}</span>
          </span>
          <p>
            <span class="font-light">ADR#</span>
            <span class="font-bold">{{ data.frontmatter.value.id }}</span>
          </p>
        </div>
        <div class="flex gap-2">
          <span
            v-for="tag in data.frontmatter.value.tags"
            class="rounded-full px-1.5 py-0.5 text-xs font-medium text-gray-900 ring-1 ring-inset ring-gray-200 dark:ring-gray-200 dark:text-gray-200"
          >
            {{ tag }}
          </span>
        </div>
      </div>
      <div v-else-if="radarPlacement" class="flex gap-4 items-center mb-4">
        <div class="flex gap-2">
          <span
            class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-400 text-gray-900 dark:text-white"
          >
            Ring: <span class="font-bold">{{ radarPlacement.ring }}</span>
          </span>
          <span
            class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-400 text-gray-900 dark:text-white"
          >
            Quadrant:
            <a v-if="radarPlacement.quadrantLink" class="font-bold" :href="href(radarPlacement.quadrantLink)">
              {{ radarPlacement.quadrant }}
            </a>
            <span v-else class="font-bold">{{ radarPlacement.quadrant }}</span>
          </span>
          <a class="inline-flex items-center text-xs" :href="href('/radar/')">Back to the radar</a>
        </div>
        <div class="flex gap-2">
          <span
            v-for="tag in radarPlacement.tags"
            class="rounded-full px-1.5 py-0.5 text-xs font-medium text-gray-900 ring-1 ring-inset ring-gray-200 dark:ring-gray-200 dark:text-gray-200"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </template>
  </Layout>
</template>
