import type { Transformer } from 'unified';
import { name as isIdentifierName } from 'estree-util-is-identifier-name';
import { valueToEstree } from 'estree-util-value-to-estree';
import { ReadTimeResults } from 'reading-time';

type ReadingTimeData = {
  readingTime: ReadTimeResults;
};

export function remarkMdxReadingTime(opts?: { name?: string }): Transformer {
  const name = opts?.name ?? 'readingTime';

  if (!isIdentifierName(name)) {
    throw new Error(`The name should be a valid identifier name, got: ${JSON.stringify(name)}`);
  }

  return function transformer(tree, vfile) {
    const readingTime = (vfile.data.fm as ReadingTimeData | undefined)?.readingTime;

    if (readingTime === undefined) return;

    // @ts-ignore :shrug:
    tree.children.unshift({
      type: 'mdxjsEsm',
      data: {
        estree: {
          type: 'Program',
          sourceType: 'module',
          body: [
            {
              type: 'ExportNamedDeclaration',
              source: null,
              specifiers: [],
              declaration: {
                type: 'VariableDeclaration',
                kind: 'const',
                declarations: [
                  {
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name },
                    init: valueToEstree(readingTime),
                  },
                ],
              },
            },
          ],
        },
      },
    });
  };
}
