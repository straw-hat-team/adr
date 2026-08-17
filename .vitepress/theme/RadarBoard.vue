<script setup lang="ts">
import { computed, ref } from 'vue';
import { useData, withBase } from 'vitepress';
import { data as radar } from './radar.data';

type Point = { x: number; y: number };

type PositionedBlip = (typeof radar.blips)[number] &
  Point & {
    number: number;
    quadrantIndex: number;
    ringIndex: number;
  };

const MAX_RADIUS = 460;
const BLIP_RADIUS = 15;
const QUADRANT_GAP_DEGREES = 1.8;
const BLIP_PADDING = 6;
const BLIP_ANGLE_PADDING = 4;
const PLACEMENT_ATTEMPTS = 80;

const { site } = useData();

const active = ref<string | null>(null);
const focusedQuadrant = ref<string | null>(null);

const movementLabels: Record<string, string> = {
  new: 'new in this edition',
  in: 'moved in',
  out: 'moved out',
  none: 'no change',
};

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function unit(value: string) {
  return (hash(value) % 100000) / 100000;
}

function frac(value: number) {
  return value - Math.floor(value);
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function toPoint(degrees: number, radius: number): Point {
  return {
    x: Math.cos(toRadians(degrees)) * radius,
    y: Math.sin(toRadians(degrees)) * radius,
  };
}

function quadrantAngles(quadrantIndex: number) {
  const span = 360 / radar.quadrants.length;
  const start = -90 + quadrantIndex * span;
  return [start + QUADRANT_GAP_DEGREES, start + span - QUADRANT_GAP_DEGREES] as const;
}

function ringRadii(ringIndex: number) {
  const outer = MAX_RADIUS * Math.sqrt((ringIndex + 1) / radar.rings.length);
  const inner = ringIndex === 0 ? 0 : MAX_RADIUS * Math.sqrt(ringIndex / radar.rings.length);
  return [inner, outer] as const;
}

function sectorPath(quadrantIndex: number, ringIndex: number) {
  const [from, to] = quadrantAngles(quadrantIndex);
  const [inner, outer] = ringRadii(ringIndex);
  const outerFrom = toPoint(from, outer);
  const outerTo = toPoint(to, outer);

  if (inner === 0) {
    return `M 0 0 L ${outerFrom.x} ${outerFrom.y} A ${outer} ${outer} 0 0 1 ${outerTo.x} ${outerTo.y} Z`;
  }

  const innerFrom = toPoint(from, inner);
  const innerTo = toPoint(to, inner);

  return [
    `M ${innerFrom.x} ${innerFrom.y}`,
    `A ${inner} ${inner} 0 0 1 ${innerTo.x} ${innerTo.y}`,
    `L ${outerTo.x} ${outerTo.y}`,
    `A ${outer} ${outer} 0 0 0 ${outerFrom.x} ${outerFrom.y}`,
    'Z',
  ].join(' ');
}

function place(slug: string, quadrantIndex: number, ringIndex: number, placed: Point[]) {
  const [from, to] = quadrantAngles(quadrantIndex);
  const [inner, outer] = ringRadii(ringIndex);
  const lowerBound = Math.min(inner + BLIP_RADIUS + BLIP_PADDING, outer - BLIP_RADIUS - BLIP_PADDING);
  const upperBound = Math.max(outer - BLIP_RADIUS - BLIP_PADDING, lowerBound);
  const angleSpan = Math.max(to - from - BLIP_ANGLE_PADDING * 2, 0);
  const seedAngle = unit(slug);
  const seedRadius = unit(`${slug}:radius`);

  for (let attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt += 1) {
    const angle = from + BLIP_ANGLE_PADDING + frac(seedAngle + attempt * 0.6180339887) * angleSpan;
    const ratio = frac(seedRadius + attempt * 0.3819660113);
    const radius = Math.sqrt(lowerBound ** 2 + ratio * (upperBound ** 2 - lowerBound ** 2));
    const candidate = toPoint(angle, radius);
    const collides = placed.some(
      (other) => Math.hypot(other.x - candidate.x, other.y - candidate.y) < BLIP_RADIUS * 2 + 3,
    );

    if (!collides) {
      return candidate;
    }
  }

  return toPoint(from + (to - from) / 2, (lowerBound + upperBound) / 2);
}

function cornerLabel(quadrantIndex: number) {
  const [from, to] = quadrantAngles(quadrantIndex);
  const middle = toPoint(from + (to - from) / 2, 1);

  return {
    x: Math.sign(middle.x) * (MAX_RADIUS + 88) || MAX_RADIUS + 88,
    y: Math.sign(middle.y) * (MAX_RADIUS - 60) || 0,
    anchor: middle.x >= 0 ? 'end' : 'start',
  };
}

const positioned = computed<PositionedBlip[]>(() => {
  const placed: PositionedBlip[] = [];

  radar.quadrants.forEach((quadrant, quadrantIndex) => {
    radar.rings.forEach((ring, ringIndex) => {
      radar.blips
        .filter((blip) => blip.quadrant === quadrant.id && blip.ring === ring.id)
        .forEach((blip) => {
          placed.push({
            ...blip,
            number: placed.length + 1,
            quadrantIndex,
            ringIndex,
            ...place(blip.slug, quadrantIndex, ringIndex, placed),
          });
        });
    });
  });

  return placed;
});

const quadrantSections = computed(() =>
  radar.quadrants.map((quadrant, quadrantIndex) => ({
    ...quadrant,
    quadrantIndex,
    label: cornerLabel(quadrantIndex),
    rings: radar.rings.map((ring) => ({
      ...ring,
      blips: positioned.value.filter((blip) => blip.quadrant === quadrant.id && blip.ring === ring.id),
    })),
  })),
);

const ringLabels = computed(() =>
  radar.rings.map((ring, ringIndex) => {
    const [inner, outer] = ringRadii(ringIndex);
    return { ...ring, y: -((inner + outer) / 2), width: ring.name.length * 13 + 24 };
  }),
);

function href(link: string) {
  return withBase(site.value.cleanUrls ? link : `${link}.html`);
}

function quadrantColor(quadrantIndex: number) {
  return `var(--radar-quadrant-${(quadrantIndex % 4) + 1})`;
}

function isDimmed(quadrantId: string) {
  return focusedQuadrant.value !== null && focusedQuadrant.value !== quadrantId;
}

function toggleQuadrant(quadrantId: string) {
  focusedQuadrant.value = focusedQuadrant.value === quadrantId ? null : quadrantId;
}

function blipShape(blip: PositionedBlip) {
  const size = BLIP_RADIUS * 1.35;

  if (blip.movement === 'in') {
    return `M 0 ${-size} L ${size} ${size * 0.75} L ${-size} ${size * 0.75} Z`;
  }

  if (blip.movement === 'out') {
    return `M 0 ${size} L ${size} ${-size * 0.75} L ${-size} ${-size * 0.75} Z`;
  }

  return null;
}

function showMovement(blip: PositionedBlip) {
  if (blip.movement === 'none') {
    return false;
  }

  return !(blip.movement === 'new' && radar.isFirstEdition);
}

function blipTitle(blip: PositionedBlip) {
  const ring = radar.rings.find((candidate) => candidate.id === blip.ring);
  const movement = showMovement(blip) ? `, ${movementLabels[blip.movement]}` : '';
  return `${blip.number}. ${blip.name} (${ring?.name}${movement})`;
}
</script>

<template>
  <div class="radar">
    <div class="radar-controls">
      <button
        v-for="quadrant in radar.quadrants"
        :key="quadrant.id"
        type="button"
        class="radar-chip"
        :class="{ 'radar-chip-on': focusedQuadrant === quadrant.id }"
        :style="{ '--chip-color': quadrantColor(radar.quadrants.indexOf(quadrant)) }"
        :aria-pressed="focusedQuadrant === quadrant.id"
        @click="toggleQuadrant(quadrant.id)"
      >
        {{ quadrant.name }}
      </button>
      <p class="radar-edition">Edition {{ radar.edition.id }} &middot; {{ radar.edition.publishedOn }}</p>
    </div>

    <svg
      class="radar-svg"
      viewBox="-560 -540 1120 1080"
      role="img"
      :aria-label="`Tech radar, edition ${radar.edition.id}`"
    >
      <g v-for="section in quadrantSections" :key="section.id" :class="{ 'radar-dim': isDimmed(section.id) }">
        <path
          v-for="(ring, ringIndex) in radar.rings"
          :key="ring.id"
          :d="sectorPath(section.quadrantIndex, ringIndex)"
          class="radar-sector"
          :class="ringIndex % 2 === 0 ? 'radar-sector-even' : 'radar-sector-odd'"
        />
        <text
          :x="section.label.x"
          :y="section.label.y"
          :text-anchor="section.label.anchor"
          class="radar-quadrant-label"
          :style="{ fill: quadrantColor(section.quadrantIndex) }"
        >
          {{ section.name }}
        </text>
      </g>

      <g v-for="ring in ringLabels" :key="ring.id">
        <rect
          :x="-ring.width / 2"
          :y="ring.y - 14"
          :width="ring.width"
          :height="28"
          :rx="6"
          class="radar-ring-label-background"
        />
        <text :x="0" :y="ring.y" class="radar-ring-label">{{ ring.name }}</text>
      </g>

      <a
        v-for="blip in positioned"
        :key="blip.slug"
        :href="href(blip.link)"
        :class="{ 'radar-dim': isDimmed(blip.quadrant), 'radar-blip-active': active === blip.slug }"
        class="radar-blip"
        @mouseenter="active = blip.slug"
        @mouseleave="active = null"
        @focus="active = blip.slug"
        @blur="active = null"
      >
        <title>{{ blipTitle(blip) }}</title>
        <g :transform="`translate(${blip.x} ${blip.y})`">
          <circle
            v-if="blip.movement === 'new' && showMovement(blip)"
            :r="BLIP_RADIUS + 5"
            class="radar-blip-halo"
            :style="{ stroke: quadrantColor(blip.quadrantIndex) }"
          />
          <path v-if="blipShape(blip)" :d="blipShape(blip)!" :style="{ fill: quadrantColor(blip.quadrantIndex) }" />
          <circle v-else :r="BLIP_RADIUS" :style="{ fill: quadrantColor(blip.quadrantIndex) }" />
          <text class="radar-blip-number">{{ blip.number }}</text>
        </g>
      </a>
    </svg>

    <div class="radar-legend">
      <section v-for="section in quadrantSections" :key="section.id" :class="{ 'radar-dim': isDimmed(section.id) }">
        <h3 :style="{ borderColor: quadrantColor(section.quadrantIndex) }">{{ section.name }}</h3>
        <p class="radar-legend-description">{{ section.description }}</p>
        <template v-for="ring in section.rings" :key="ring.id">
          <h4 v-if="ring.blips.length > 0">{{ ring.name }}</h4>
          <ul v-if="ring.blips.length > 0">
            <li
              v-for="blip in ring.blips"
              :key="blip.slug"
              :class="{ 'radar-legend-active': active === blip.slug }"
              @mouseenter="active = blip.slug"
              @mouseleave="active = null"
            >
              <a :href="href(blip.link)">{{ blip.number }}. {{ blip.name }}</a>
              <span v-if="showMovement(blip)" class="radar-tag">{{ movementLabels[blip.movement] }}</span>
            </li>
          </ul>
        </template>
        <p v-if="section.rings.every((ring) => ring.blips.length === 0)" class="radar-legend-description">
          Nothing placed yet.
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.radar {
  --radar-quadrant-1: #2f6feb;
  --radar-quadrant-2: #1f9d55;
  --radar-quadrant-3: #c2410c;
  --radar-quadrant-4: #7c3aed;
}

html.dark .radar {
  --radar-quadrant-1: #6ea8fe;
  --radar-quadrant-2: #4ade80;
  --radar-quadrant-3: #fb923c;
  --radar-quadrant-4: #c4b5fd;
}

.radar-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 24px 0 8px;
}

.radar-chip {
  border: 1px solid var(--chip-color);
  border-radius: 999px;
  color: var(--chip-color);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  padding: 6px 12px;
  transition: background-color 0.2s;
}

.radar-chip-on {
  background-color: var(--chip-color);
  color: var(--vp-c-bg);
}

.radar-edition {
  color: var(--vp-c-text-2);
  font-size: 13px;
  margin-left: auto;
}

.radar-svg {
  display: block;
  width: 100%;
  height: auto;
}

.radar-sector {
  stroke: var(--vp-c-divider);
  stroke-width: 1.5;
}

.radar-sector-even {
  fill: color-mix(in srgb, var(--vp-c-text-1) 3%, transparent);
}

.radar-sector-odd {
  fill: color-mix(in srgb, var(--vp-c-text-1) 8%, transparent);
}

.radar-quadrant-label {
  font-size: 26px;
  font-weight: 700;
  dominant-baseline: middle;
}

.radar-ring-label {
  fill: var(--vp-c-text-2);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-anchor: middle;
  text-transform: uppercase;
  dominant-baseline: central;
}

.radar-ring-label-background {
  fill: var(--vp-c-bg);
  stroke: var(--vp-c-divider);
}

.radar-blip {
  cursor: pointer;
  text-decoration: none;
}

.radar-blip-number {
  fill: var(--vp-c-bg);
  font-size: 15px;
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: central;
}

.radar-blip-halo {
  fill: none;
  stroke-dasharray: 4 4;
  stroke-width: 2;
}

.radar-blip-active g,
.radar-blip:hover g,
.radar-blip:focus-visible g {
  transform-box: fill-box;
  filter: drop-shadow(0 0 6px var(--vp-c-text-3));
}

.radar-dim {
  opacity: 0.22;
}

.radar-legend {
  display: grid;
  gap: 32px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  margin-top: 32px;
}

.radar-legend h3 {
  border-bottom: 2px solid;
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  padding-bottom: 6px;
}

.radar-legend h4 {
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin: 16px 0 6px;
  text-transform: uppercase;
}

.radar-legend-description {
  color: var(--vp-c-text-2);
  font-size: 13px;
  margin: 8px 0 0;
}

.radar-legend ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.radar-legend li {
  border-radius: 4px;
  font-size: 14px;
  padding: 2px 4px;
}

.radar-legend-active {
  background-color: var(--vp-c-default-soft);
}

.radar-tag {
  color: var(--vp-c-text-3);
  font-size: 11px;
  margin-left: 6px;
}
</style>
