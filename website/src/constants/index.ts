import * as path from 'path';

export const ORGANIZATION_NAME = 'Straw Hat Team';
export const DISCUSSIONS_QA_URL = 'https://github.com/straw-hat-team/adr/discussions/categories/q-a';
export const GENESIS_ADR = '0000000000';
export const PAGE_TITLE_PREFIX = 'ADR';
export const CWD = process.cwd();
export const SRC_DIR = path.join(CWD, 'src');
export const REGEX_ADR_LINK = /^ADR#(?<adr>[0-9]+)$/;
export const REGEX_HTTPS_HOST = /^https?:\/\//i;
