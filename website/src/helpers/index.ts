import { REGEX_ADR_LINK } from '@/constants';

export function adrFormat(adr: string) {
  return `ADR#${adr}`;
}

export function adrFromHref(href?: string) {
  if (!href) {
    return undefined;
  }

  return REGEX_ADR_LINK.exec(href!)?.groups?.adr;
}

export function pageAnchor(id?: string) {
  return id ? `#${id}` : undefined;
}
