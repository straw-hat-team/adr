import { normalizePath } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import glob from 'fast-glob';
import { z } from 'zod';

type FrontmatterEntry<T> = { filePath: string; frontmatter: T };

/**
 * Read frontmatter from files.
 *
 * @param patterns the glob pattern to search for files.
 * @param opts
 * @param opts.rootDir the root directory to search for files.
 * @param opts.schema the Zod Schema to validate the frontmatter.
 * @returns a list of frontmatter objects.
 */
export async function readFrontmatter<S extends z.ZodType>(
  patterns: string[],
  opts?: {
    rootDir?: string;
    schema?: S;
  },
): Promise<Array<FrontmatterEntry<z.output<S>>>> {
  const pattern = patterns.map((pattern) => {
    const finalPath = opts?.rootDir ? path.join(opts.rootDir, pattern) : pattern;
    return normalizePath(finalPath);
  });
  const files = await glob(pattern, { ignore: ['**/node_modules/**', '**/dist/**'] });

  return files.sort().map((filePath: string) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(content);

    try {
      const frontmatter = opts?.schema?.parse(data) ?? data;
      return {
        filePath,
        frontmatter,
      };
    } catch (e) {
      if (e instanceof z.ZodError) {
        throw new InvalidFrontmatterError(filePath, e);
      }
      throw e;
    }
  });
}

class InvalidFrontmatterError extends Error {
  constructor(filePath: string, zodErr: z.ZodError) {
    const issues = zodErr.issues
      .map((zodIssue, index) => {
        return [
          `    ${index + 1}. Error Code: ${zodIssue.code}`,
          `       - Path: ${zodIssue.path.join(' > ')}`,
          ...('expected' in zodIssue ? [`       - Expected: ${zodIssue.expected}`] : []),
          `       - Message: ${zodIssue.message}`,
        ];
      })
      .flat()
      .join('\n');

    super(`${filePath}\n\n${issues}\n`);
    this.name = 'InvalidFrontmatterError';
  }
}

const categories = ['General', 'Platform', 'Elixir', 'JavaScript'] as const;

type Category = (typeof categories)[number];

export const AdrFrontmatter = z.object({
  id: z.string(),
  title: z.string(),
  created: z.coerce.date(),
  state: z.enum(['Draft', 'Reviewing', 'Approved', 'Withdrawn', 'Rejected', 'Deferred', 'Replaced']),
  tags: z.array(z.string()),
  category: z.enum(categories),
});

type IAdrFrontmatter = z.infer<typeof AdrFrontmatter>;

export function orderByCreated(r1: FrontmatterEntry<IAdrFrontmatter>, r2: FrontmatterEntry<IAdrFrontmatter>) {
  return r1.frontmatter.created.getTime() - r2.frontmatter.created.getTime();
}

export function groupByCategory(
  acc: Record<Category, Array<FrontmatterEntry<IAdrFrontmatter>>>,
  r: FrontmatterEntry<IAdrFrontmatter>,
) {
  acc[r.frontmatter.category] ??= [];
  acc[r.frontmatter.category].push(r);
  return acc;
}

export function toSidebarItem(r: FrontmatterEntry<IAdrFrontmatter>) {
  return {
    text: r.frontmatter.title,
    link: `/adrs/${r.frontmatter.id}/README.md`,
  };
}

export function hasAnyCategory(categories: Record<Category, Array<FrontmatterEntry<IAdrFrontmatter>>>) {
  return (category: Category) => categories[category]?.length > 0;
}
