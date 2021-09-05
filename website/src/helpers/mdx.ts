// import readingTime from 'reading-time';
import { bundleMDX } from 'mdx-bundler';
import { SRC_DIR } from '@/constants';
import { BundleMDXOptions } from 'mdx-bundler/dist/types';
import * as fs from 'fs';
import * as path from 'path';
import grayMatter from 'gray-matter';

type RouteDirEntry = { path: string; dirent: fs.Dirent };

export type MdxFileRoute<FM = unknown> = {
  mdxFile: MdxFile<FM>;
  routeDir: RouteDirEntry;
};

export type ReadFileConfig = { atRootDir: string };

export type ReadMdxFileConfig = {
  mdxOptions?: Exclude<BundleMDXOptions, 'cwd'>;
  atRootDir?: string;
};

export type MdxFile<FM = unknown> = {
  code: string;
  frontmatter: FM;
  matter: grayMatter.GrayMatterFile<any>;
};

function getRouteMdxIndex(filePath: string) {
  return path.join(filePath, 'index.mdx');
}

function isMdxRoute(route: RouteDirEntry) {
  return fs.existsSync(getRouteMdxIndex(route.path));
}

function readMdxForRoute<FM>(config: ReadMdxFileConfig) {
  return async (routeDir: RouteDirEntry) => {
    const filePath = path.join(routeDir.path, 'index.mdx');
    const mdxFile = await readMdxFile<FM>(path.join(filePath), config);

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

export function readMdxFilesOfRoute<FM = unknown>(pathSegment: string, config: ReadMdxFileConfig) {
  const mdxFiles = readSubRouteOfRoute(pathSegment, { atRootDir: config.atRootDir ?? SRC_DIR })
    .filter(isMdxRoute)
    .map(readMdxForRoute<FM>(config));

  return Promise.all(mdxFiles);
}

export async function readMdxFile<FM = unknown>(
  pathSegment: string,
  config: ReadMdxFileConfig = {}
): Promise<MdxFile<FM>> {
  const source = await readFile(pathSegment, {
    atRootDir: config.atRootDir ?? SRC_DIR,
  });

  const compiled = await bundleMDX(source, {
    ...config.mdxOptions,
    cwd: SRC_DIR,
  });

  // TODO: Handle `compiled.errors` from `esbuild`

  return {
    code: compiled.code,
    frontmatter: compiled.frontmatter as FM,
    matter: compiled.matter,
  };
}
