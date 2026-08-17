<script setup lang="ts">
import { computed, ref } from 'vue';
import { data as radar } from './radar.data';
import { useHref } from './use-href';

type Point = { x: number; y: number };

type Movement = (typeof radar.blips)[number]['movement'];

type PositionedBlip = (typeof radar.blips)[number] &
  Point & {
    number: number;
    quadrantIndex: number;
    ringIndex: number;
  };

const FULL_VIEW_BOX = { x: -560, y: -540, width: 1120, height: 1080 };
const MAX_RADIUS = 460;
const BLIP_RADIUS = 15;
const QUADRANT_GAP_DEGREES = 1.8;
const BLIP_PADDING = 6;
const BLIP_ANGLE_PADDING = 4;
const PLACEMENT_ATTEMPTS = 80;
const FOCUS_MARGIN = 24;
const RING_LABEL_GUTTER = 10;

const props = defineProps<{ quadrant?: string }>();

const href = useHref();

const focusIndex = computed(() => radar.quadrants.findIndex((candidate) => candidate.id === props.quadrant));
const isFocused = computed(() => focusIndex.value >= 0);
const quadrantSpan = computed(() => 360 / radar.quadrants.length);
const angleOffset = computed(() => (isFocused.value ? -focusIndex.value * quadrantSpan.value : 0));

const active = ref<string | null>(null);

const movementLabels: Record<Movement, string> = {
  new: 'new in this edition',
  in: 'moved in',
  out: 'moved out',
  none: 'no change',
};

const movementOrder: Movement[] = ['new', 'in', 'out', 'none'];

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

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function toPoint(degrees: number, radius: number): Point {
  return {
    x: round(Math.cos(toRadians(degrees)) * radius),
    y: round(Math.sin(toRadians(degrees)) * radius),
  };
}

function quadrantRange(quadrantIndex: number) {
  const span = quadrantSpan.value;
  const start = -90 + quadrantIndex * span + angleOffset.value;
  return [start, start + span] as const;
}

function quadrantAngles(quadrantIndex: number) {
  const [start, end] = quadrantRange(quadrantIndex);
  return [start + QUADRANT_GAP_DEGREES, end - QUADRANT_GAP_DEGREES] as const;
}

function drawnAngles(quadrantIndex: number) {
  return isFocused.value ? quadrantRange(quadrantIndex) : quadrantAngles(quadrantIndex);
}

function sectorBounds(quadrantIndex: number) {
  const [from, to] = drawnAngles(quadrantIndex);
  const points: Point[] = [{ x: 0, y: 0 }, toPoint(to, MAX_RADIUS)];

  for (let angle = from; angle < to; angle += 1) {
    points.push(toPoint(angle, MAX_RADIUS));
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function ringRadii(ringIndex: number) {
  const outer = MAX_RADIUS * Math.sqrt((ringIndex + 1) / radar.rings.length);
  const inner = ringIndex === 0 ? 0 : MAX_RADIUS * Math.sqrt(ringIndex / radar.rings.length);
  return [inner, outer] as const;
}

function sectorPath(quadrantIndex: number, ringIndex: number) {
  const [from, to] = drawnAngles(quadrantIndex);
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
    const width = ring.name.length * 13 + 24;

    return {
      ...ring,
      width,
      y: -((inner + outer) / 2),
      x: isFocused.value ? -(width / 2) - RING_LABEL_GUTTER : 0,
    };
  }),
);

const viewBox = computed(() => {
  if (!isFocused.value) {
    return FULL_VIEW_BOX;
  }

  const bounds = sectorBounds(focusIndex.value);
  const gutter = Math.max(...ringLabels.value.map((ring) => ring.width)) + RING_LABEL_GUTTER * 2;
  const x = Math.round(bounds.minX - gutter);
  const y = Math.round(bounds.minY - FOCUS_MARGIN);

  return {
    x,
    y,
    width: Math.round(bounds.maxX + FOCUS_MARGIN) - x,
    height: Math.round(bounds.maxY + FOCUS_MARGIN) - y,
  };
});

const visibleSections = computed(() =>
  isFocused.value ? [quadrantSections.value[focusIndex.value]] : quadrantSections.value,
);

const visibleBlips = computed(() =>
  isFocused.value ? positioned.value.filter((blip) => blip.quadrant === props.quadrant) : positioned.value,
);

const legendGroups = computed(() => {
  if (isFocused.value) {
    return radar.rings.map((ring) => ({
      id: ring.id,
      name: ring.name,
      description: ring.description,
      color: quadrantColor(focusIndex.value),
      link: null as string | null,
      subgroups: [
        {
          id: ring.id,
          name: null as string | null,
          blips: visibleBlips.value.filter((blip) => blip.ring === ring.id),
        },
      ],
    }));
  }

  return quadrantSections.value.map((section) => ({
    id: section.id,
    name: section.name,
    description: section.description,
    color: quadrantColor(section.quadrantIndex),
    link: section.link as string | null,
    subgroups: section.rings.map((ring) => ({
      id: ring.id,
      name: ring.name as string | null,
      blips: ring.blips,
    })),
  }));
});

function quadrantColor(quadrantIndex: number) {
  return `var(--radar-quadrant-${(quadrantIndex % 4) + 1})`;
}

function shapeFor(movement: Movement) {
  const size = BLIP_RADIUS * 1.35;

  if (movement === 'in') {
    return `M 0 ${-size} L ${size} ${size * 0.75} L ${-size} ${size * 0.75} Z`;
  }

  if (movement === 'out') {
    return `M 0 ${size} L ${size} ${-size * 0.75} L ${-size} ${-size * 0.75} Z`;
  }

  return null;
}

function blipShape(blip: PositionedBlip) {
  return shapeFor(blip.movement);
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

const movementKey = computed(() =>
  movementOrder.map((movement) => ({
    movement,
    label: movementLabels[movement],
    shape: shapeFor(movement),
  })),
);

function ringName(ring: string) {
  return radar.rings.find((candidate) => candidate.id === ring)?.name ?? ring;
}

const tooltip = computed(() => {
  const blip = positioned.value.find((candidate) => candidate.slug === active.value);

  if (blip === undefined) {
    return null;
  }

  const left = ((blip.x - viewBox.value.x) / viewBox.value.width) * 100;
  const top = ((blip.y - viewBox.value.y) / viewBox.value.height) * 100;
  const moved = showMovement(blip) && blip.movement !== 'new';
  const anchor = left <= 25 ? 12 : left >= 75 ? 88 : 50;

  return {
    blip,
    ring: ringName(blip.ring),
    movement: showMovement(blip) ? movementLabels[blip.movement] : null,
    previousRing: moved && blip.previousRing !== null ? ringName(blip.previousRing) : null,
    quadrant: radar.quadrants.find((candidate) => candidate.id === blip.quadrant)?.name ?? blip.quadrant,
    below: top < 16,
    style: {
      left: `${left}%`,
      top: `${top}%`,
      '--tooltip-color': quadrantColor(blip.quadrantIndex),
      '--tooltip-anchor': `${anchor}%`,
    },
  };
});
</script>

<template>
  <div class="radar">
    <div class="radar-controls">
      <ul class="radar-key">
        <li v-for="entry in movementKey" :key="entry.movement">
          <svg class="radar-key-glyph" viewBox="-24 -24 48 48" aria-hidden="true">
            <circle v-if="entry.movement === 'new'" :r="BLIP_RADIUS + 5" class="radar-blip-halo" />
            <path v-if="entry.shape" :d="entry.shape" class="radar-key-mark" />
            <circle v-else :r="BLIP_RADIUS" class="radar-key-mark" />
          </svg>
          {{ entry.label }}
        </li>
      </ul>
      <p class="radar-edition">Edition {{ radar.edition.id }} &middot; {{ radar.edition.publishedOn }}</p>
    </div>

    <div class="radar-stage" :class="{ 'radar-stage-focused': isFocused }">
      <svg
        class="radar-svg"
        :viewBox="`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`"
        :aria-label="`Tech radar, edition ${radar.edition.id}`"
      >
        <g v-for="section in visibleSections" :key="section.id">
          <path
            v-for="(ring, ringIndex) in radar.rings"
            :key="ring.id"
            :d="sectorPath(section.quadrantIndex, ringIndex)"
            class="radar-sector"
            :class="ringIndex % 2 === 0 ? 'radar-sector-even' : 'radar-sector-odd'"
          />
          <a v-if="!isFocused" :href="href(section.link)">
            <text
              :x="section.label.x"
              :y="section.label.y"
              :text-anchor="section.label.anchor"
              class="radar-quadrant-label"
              :style="{ fill: quadrantColor(section.quadrantIndex) }"
            >
              {{ section.name }}
            </text>
          </a>
        </g>

        <g v-for="ring in ringLabels" :key="ring.id">
          <rect
            :x="ring.x - ring.width / 2"
            :y="ring.y - 14"
            :width="ring.width"
            :height="28"
            :rx="6"
            class="radar-ring-label-background"
          />
          <text :x="ring.x" :y="ring.y" class="radar-ring-label">{{ ring.name }}</text>
        </g>

        <a
          v-for="blip in visibleBlips"
          :key="blip.slug"
          :href="href(blip.link)"
          :class="{ 'radar-blip-active': active === blip.slug }"
          :aria-label="blipTitle(blip)"
          class="radar-blip"
          @mouseenter="active = blip.slug"
          @mouseleave="active = null"
          @focus="active = blip.slug"
          @blur="active = null"
        >
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

      <div
        v-if="tooltip"
        class="radar-tooltip"
        :class="{ 'radar-tooltip-below': tooltip.below }"
        :style="tooltip.style"
        aria-hidden="true"
      >
        <p class="radar-tooltip-name">{{ tooltip.blip.number }}. {{ tooltip.blip.name }}</p>
        <p class="radar-tooltip-meta">
          <span class="radar-tooltip-ring">{{ tooltip.ring }}</span>
          <span v-if="tooltip.previousRing">was {{ tooltip.previousRing }}</span>
          <span v-else-if="tooltip.movement">{{ tooltip.movement }}</span>
        </p>
        <p class="radar-tooltip-quadrant">{{ tooltip.quadrant }}</p>
        <ul v-if="tooltip.blip.tags.length > 0" class="radar-tooltip-tags">
          <li v-for="tag in tooltip.blip.tags" :key="tag">{{ tag }}</li>
        </ul>
      </div>
    </div>

    <div class="radar-legend">
      <section v-for="group in legendGroups" :key="group.id">
        <h3 :style="{ borderColor: group.color }">
          <a v-if="group.link" :href="href(group.link)">{{ group.name }}</a>
          <template v-else>{{ group.name }}</template>
        </h3>
        <p class="radar-legend-description">{{ group.description }}</p>
        <template v-for="subgroup in group.subgroups" :key="subgroup.id">
          <h4 v-if="subgroup.name && subgroup.blips.length > 0">{{ subgroup.name }}</h4>
          <ul v-if="subgroup.blips.length > 0">
            <li
              v-for="blip in subgroup.blips"
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
        <p v-if="group.subgroups.every((subgroup) => subgroup.blips.length === 0)" class="radar-legend-description">
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

.radar-edition {
  color: var(--vp-c-text-2);
  font-size: 13px;
  margin-left: auto;
}

.radar-stage {
  position: relative;
}

.radar-stage-focused {
  margin-inline: auto;
  max-width: 840px;
}

.radar-svg a {
  text-decoration: none;
}

.radar-svg {
  display: block;
  width: 100%;
  height: auto;
}

.radar-tooltip {
  background-color: var(--vp-c-bg-elv);
  border: 1px solid var(--tooltip-color);
  border-radius: 8px;
  box-shadow: var(--vp-shadow-3);
  left: 0;
  max-width: min(260px, 60vw);
  padding: 8px 12px;
  pointer-events: none;
  position: absolute;
  top: 0;
  transform: translate(calc(-1 * var(--tooltip-anchor)), calc(-100% - 22px));
  width: max-content;
  z-index: 2;
}

.radar-tooltip::after {
  background-color: var(--vp-c-bg-elv);
  border-bottom: 1px solid var(--tooltip-color);
  border-right: 1px solid var(--tooltip-color);
  content: '';
  height: 8px;
  left: var(--tooltip-anchor);
  position: absolute;
  top: 100%;
  transform: translate(-50%, -50%) rotate(45deg);
  width: 8px;
}

.radar-tooltip-below {
  transform: translate(calc(-1 * var(--tooltip-anchor)), 22px);
}

.radar-tooltip-below::after {
  border-bottom: none;
  border-left: 1px solid var(--tooltip-color);
  border-right: none;
  border-top: 1px solid var(--tooltip-color);
  top: 0;
}

.radar-tooltip-name {
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
}

.radar-tooltip-meta {
  align-items: center;
  color: var(--vp-c-text-2);
  display: flex;
  flex-wrap: wrap;
  font-size: 12px;
  gap: 6px;
  margin: 4px 0 0;
}

.radar-tooltip-ring {
  color: var(--tooltip-color);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.radar-tooltip-quadrant {
  color: var(--vp-c-text-3);
  font-size: 12px;
  margin: 2px 0 0;
}

.radar-tooltip-tags {
  color: var(--vp-c-text-3);
  display: flex;
  flex-wrap: wrap;
  font-size: 11px;
  gap: 4px 8px;
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
}

.radar-tooltip-tags li {
  background-color: var(--vp-c-default-soft);
  border-radius: 4px;
  margin: 0;
  padding: 1px 6px;
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
  cursor: pointer;
  font-size: 26px;
  font-weight: 700;
  dominant-baseline: middle;
}

.radar-svg a:hover .radar-quadrant-label,
.radar-svg a:focus-visible .radar-quadrant-label {
  text-decoration: underline;
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

.radar-key {
  color: var(--vp-c-text-2);
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  font-size: 13px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.radar-key li {
  align-items: center;
  display: flex;
  gap: 6px;
  margin: 0;
}

.radar-key-glyph {
  color: var(--vp-c-text-3);
  flex: none;
  height: 18px;
  width: 18px;
}

.radar-key-mark {
  fill: currentColor;
}

.radar-key-glyph .radar-blip-halo {
  stroke: currentColor;
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

.radar-legend h3 a {
  color: inherit;
  font-weight: inherit;
  text-decoration: none;
}

.radar-legend h3 a:hover {
  text-decoration: underline;
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
