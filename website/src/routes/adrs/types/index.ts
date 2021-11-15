import { ReadTimeResults } from 'reading-time';
import { TocEntry } from '@stefanprobst/rehype-extract-toc';

export type AdrStatus = 'DRAFT' | 'REVIEWING' | 'APPROVED' | 'WITHDRAWN' | 'REJECTED' | 'DEFERRED' | 'REPLACED';

export type AdrFrontmatter = {
  status: AdrStatus;
  tags: string[];
  created_at: string;
};

export type AdrMdxModuleExports = {
  readingTime: ReadTimeResults;
  frontmatter: AdrFrontmatter;
  tableOfContents: TocEntry[];
  title: string;
};
