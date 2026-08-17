import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { readFrontmatter } from './helpers';

export const quadrants = [
  {
    id: 'techniques',
    name: 'Techniques',
    description: 'Ways of working, practices, and design approaches.',
  },
  {
    id: 'tools',
    name: 'Tools',
    description: 'Software we run to build, verify, or operate things.',
  },
  {
    id: 'platforms',
    name: 'Platforms',
    description: 'Things we build on top of, such as runtimes, infrastructure, and hosted services.',
  },
  {
    id: 'languages-and-frameworks',
    name: 'Languages & Frameworks',
    description: 'Programming languages and the libraries we write code against.',
  },
] as const;

export const rings = [
  {
    id: 'adopt',
    name: 'Adopt',
    description: 'The default choice. Picking something else needs a justification.',
  },
  {
    id: 'trial',
    name: 'Trial',
    description: 'Worth pursuing on real work, with someone accountable for the outcome.',
  },
  {
    id: 'assess',
    name: 'Assess',
    description: 'Worth understanding and prototyping, not yet worth committing to.',
  },
  {
    id: 'hold',
    name: 'Hold',
    description: 'Do not start anything new with it. Existing usage is not an emergency.',
  },
] as const;

export const editions = [{ id: '2026.2', publishedOn: '2026-08-17' }] as const;

type QuadrantId = (typeof quadrants)[number]['id'];
type RingId = (typeof rings)[number]['id'];
type EditionId = (typeof editions)[number]['id'];

const quadrantIds = quadrants.map((quadrant) => quadrant.id) as [QuadrantId, ...QuadrantId[]];
const ringIds = rings.map((ring) => ring.id) as [RingId, ...RingId[]];
const editionIds = editions.map((edition) => edition.id) as [EditionId, ...EditionId[]];

export const RadarItemFrontmatter = z.object({
  name: z.string().min(1),
  quadrant: z.enum(quadrantIds),
  history: z
    .array(
      z.object({
        edition: z.enum(editionIds),
        ring: z.enum(ringIds),
      }),
    )
    .min(1),
  adr: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

type IRadarItemFrontmatter = z.infer<typeof RadarItemFrontmatter>;

type HistoryEntry = IRadarItemFrontmatter['history'][number];

export type Movement = 'new' | 'in' | 'out' | 'none';

export type RadarBlip = {
  slug: string;
  name: string;
  quadrant: QuadrantId;
  ring: RingId;
  movement: Movement;
  previousRing: RingId | null;
  tags: string[];
  adr: string | null;
  link: string;
};

export type RadarData = {
  edition: (typeof editions)[number];
  isFirstEdition: boolean;
  quadrants: Array<{ id: string; name: string; description: string; link: string }>;
  rings: Array<{ id: string; name: string; description: string }>;
  blips: RadarBlip[];
};

export function quadrantLink(quadrant: string) {
  return `/radar/quadrants/${quadrant}`;
}

class InvalidRadarItemError extends Error {
  constructor(filePath: string, reason: string) {
    super(`${filePath}\n\n    ${reason}\n`);
    this.name = 'InvalidRadarItemError';
  }
}

function editionIndex(edition: EditionId) {
  return editions.findIndex((candidate) => candidate.id === edition);
}

function ringIndex(ring: RingId) {
  return rings.findIndex((candidate) => candidate.id === ring);
}

function toMovement(current: HistoryEntry, previous: HistoryEntry | null, upToEdition: EditionId): Movement {
  if (current.edition !== upToEdition) {
    return 'none';
  }
  if (previous === null) {
    return 'new';
  }
  if (previous.ring === current.ring) {
    return 'none';
  }
  return ringIndex(current.ring) < ringIndex(previous.ring) ? 'in' : 'out';
}

function toBlip(
  filePath: string,
  slug: string,
  frontmatter: IRadarItemFrontmatter,
  upToEdition: EditionId,
  adrIds: Set<string>,
): RadarBlip | null {
  if (frontmatter.adr !== undefined && !adrIds.has(frontmatter.adr)) {
    throw new InvalidRadarItemError(filePath, `adr "${frontmatter.adr}" does not match any ADR under src/adrs`);
  }

  const timeline = [...frontmatter.history].sort((a, b) => editionIndex(a.edition) - editionIndex(b.edition));
  const uniqueEditions = new Set(timeline.map((entry) => entry.edition));

  if (uniqueEditions.size !== timeline.length) {
    throw new InvalidRadarItemError(filePath, 'history has more than one entry for the same edition');
  }

  const published = timeline.filter((entry) => editionIndex(entry.edition) <= editionIndex(upToEdition));

  if (published.length === 0) {
    return null;
  }

  const current = published[published.length - 1];
  const previous = published[published.length - 2] ?? null;

  return {
    slug,
    name: frontmatter.name,
    quadrant: frontmatter.quadrant,
    ring: current.ring,
    movement: toMovement(current, previous, upToEdition),
    previousRing: previous?.ring ?? null,
    tags: frontmatter.tags,
    adr: frontmatter.adr ?? null,
    link: `/radar/items/${slug}`,
  };
}

export async function loadRadar(rootDir = path.resolve(process.cwd(), 'src')): Promise<RadarData> {
  const adrIds = new Set(
    fs
      .readdirSync(path.join(rootDir, 'adrs'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name),
  );

  const entries = await readFrontmatter(['radar/items/*.md'], {
    rootDir,
    schema: RadarItemFrontmatter,
  });

  const edition = editions[editions.length - 1];
  const blips = entries
    .map((entry) => toBlip(entry.filePath, path.basename(entry.filePath, '.md'), entry.frontmatter, edition.id, adrIds))
    .filter((blip): blip is RadarBlip => blip !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    edition,
    isFirstEdition: editions.length === 1,
    quadrants: quadrants.map((quadrant) => ({ ...quadrant, link: quadrantLink(quadrant.id) })),
    rings: rings.map((ring) => ({ ...ring })),
    blips,
  };
}
