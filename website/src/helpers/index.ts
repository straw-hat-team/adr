export function adrFormat(adr: string) {
  return `ADR#${adr}`;
}

export function pageAnchor(id?: string) {
  return id ? `#${id}` : undefined;
}
