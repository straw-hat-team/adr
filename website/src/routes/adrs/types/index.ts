export type AdrStatus = 'DRAFT' | 'REVIEWING' | 'APPROVED' | 'WITHDRAWN' | 'REJECTED' | 'DEFERRED' | 'REPLACED';

export type AdrFrontmatter = {
  status: AdrStatus;
  tags: string[];
};
