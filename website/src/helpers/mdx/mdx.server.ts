import * as fs from 'fs';
import * as path from 'path';
import type { VFileData } from 'vfile/lib';
import * as mdx from '@mdx-js/mdx';
import { CompileOptions } from '@mdx-js/mdx/lib/compile';

import { SRC_DIR } from '@/constants';

type RouteDirEntry = {
  path: string;
  dirent: fs.Dirent;
};

export type MdxFileRoute<TData extends VFileData = {}> = {
  mdxFile: MdxFile<TData>;
  routeDir: RouteDirEntry;
};

export type ReadFileConfig = {
  atRootDir: string;
};

export type ReadMdxFileConfig = {
  compileOptions?: Pick<CompileOptions, 'remarkPlugins' | 'rehypePlugins'>;
  atRootDir?: string;
};

export type MdxFile<TData extends VFileData = {}> = {
  code: string;
  data: TData;
};

function getRouteMdxIndex(filePath: string) {
  return path.join(filePath, 'index.mdx');
}

function isMdxRoute(route: RouteDirEntry) {
  return fs.existsSync(getRouteMdxIndex(route.path));
}

function compileMdxForRoute<TData extends VFileData>(config: ReadMdxFileConfig) {
  return async (routeDir: RouteDirEntry) => {
    const filePath = path.join(routeDir.path, 'index.mdx');
    const mdxFile = await compileMdxFile<TData>(path.join(filePath), config);

    return {
      mdxFile,
      routeDir,
    };
  };
}

function normalizePath(pathSegment: string, config: ReadFileConfig) {
  return pathSegment.replace(/^@/, config.atRootDir);
}

function isDirectory(dirent: fs.Dirent) {
  return dirent.isDirectory();
}

function withFilePath(routesDir: string) {
  return (dirent: fs.Dirent): RouteDirEntry => ({
    path: path.join(routesDir, dirent.name),
    dirent,
  });
}

function readSubRouteOfRoute(pathSegment: string, config: ReadFileConfig) {
  const routesDir = path.join(normalizePath(pathSegment, config), 'routes');
  return fs.readdirSync(routesDir, { withFileTypes: true }).filter(isDirectory).map(withFilePath(routesDir));
}

function readFile(pathSegment: string, config: ReadFileConfig) {
  return fs.promises.readFile(normalizePath(pathSegment, config), {
    encoding: 'utf8',
  });
}

export function compileMdxFilesOfRoute<TData extends VFileData = {}>(pathSegment: string, config: ReadMdxFileConfig) {
  const mdxFiles = readSubRouteOfRoute(pathSegment, { atRootDir: config.atRootDir ?? SRC_DIR })
    .filter(isMdxRoute)
    .map(compileMdxForRoute<TData>(config));

  return Promise.all(mdxFiles);
}

export async function compileMdxFile<TData extends VFileData = {}>(
  pathSegment: string,
  config: ReadMdxFileConfig = {}
): Promise<MdxFile<TData>> {
  const source = await readFile(pathSegment, {
    atRootDir: config.atRootDir ?? SRC_DIR,
  });

  const compiled = await mdx.compile(source, {
    ...config.compileOptions,
    outputFormat: 'function-body',
  });

  return {
    code: compiled.value as string,
    data: compiled.data as TData,
  };
}
