import { normalizePath } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import glob from 'fast-glob';
import { z } from 'zod';

type ReadFrontmatterResult<T> = Array<{ filePath: string; frontmatter: T }>;

/**
 * Read frontmatter from files.
 *
 * @param patterns the glob pattern to search for files.
 * @param opts
 * @param opts.rootDir the root directory to search for files.
 * @param opts.schema the Zod Schema to validate the frontmatter.
 * @returns a list of frontmatter objects.
 */
export async function readFrontmatter<T>(
  patterns: string[],
  opts?: {
    rootDir?: string;
    schema?: z.ZodObject<T>;
  },
): Promise<ReadFrontmatterResult<T>> {
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
      throw new InvalidFrontmatterError(filePath, e);
    }
  });
}

class InvalidFrontmatterError extends Error {
  #zodError: z.ZodError;
  #filePath: string;

  constructor(filePath: string, zodErr: z.ZodError) {
    super();
    this.name = 'InvalidFrontmatterError';
    this.#zodError = zodErr;
    this.#filePath = filePath;
  }

  get message() {
    const issues = this.#zodError.errors
      .map((zodIssue, index) => {
        return [
          `    ${index + 1}. Error Code: ${zodIssue.code}`,
          `       - Path: ${zodIssue.path.join(' > ')}`,
          `       - Expected: ${zodIssue.expected}`,
          `       - Received: ${zodIssue.received}`,
          `       - Message: ${zodIssue.message}`,
        ];
      })
      .flat()
      .join('\n');

    return `${this.#filePath}\n\n${issues}\n`;
  }
}

export const AdrFrontmatter = z.object({
  id: z.string(),
  title: z.string(),
  created: z.coerce.date(),
  state: z.enum(['Draft', 'Reviewing', 'Approved', 'Withdrawn', 'Rejected', 'Deferred', 'Replaced']),
  tags: z.array(z.string()),
  category: z.enum(['General', 'JavaScript']),
});

type IAdrFrontmatter = z.infer<typeof AdrFrontmatter>;

export function orderByCreated(r1: ReadFrontmatterResult<IAdrFrontmatter>, r2: ReadFrontmatterResult<IAdrFrontmatter>) {
  return r1.frontmatter.created - r2.frontmatter.created;
}

export function groupByCategory<TKeys extends string>(
  acc: Record<TKeys, Array<ReadFrontmatterResult<IAdrFrontmatter>>>,
  r: ReadFrontmatterResult<IAdrFrontmatter>,
) {
  acc[r.frontmatter.category] ??= [];
  acc[r.frontmatter.category].push(r);
  return acc;
}

export function toSidebarItem(r: ReadFrontmatterResult<IAdrFrontmatter>) {
  return {
    text: r.frontmatter.title,
    link: `/adrs/${r.frontmatter.id}/README.md`,
  };
}
