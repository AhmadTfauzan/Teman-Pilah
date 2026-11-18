import Module from "module";
import path from "path";

type ResolveFilenameFn = (
  request: string,
  parent: unknown,
  isMain: boolean,
  options: unknown,
) => string;

interface PatchedModuleConstructor {
  _resolveFilename: ResolveFilenameFn;
  _distPathsRegistered?: boolean;
}

/**
 * Memetakan path alias TypeScript (`@/*`, `@modules/*`, dll.) ke folder `dist/`
 * saat aplikasi dijalankan dari hasil kompilasi JS di luar ts-node/tsx.
 * Tidak melakukan apa-apa saat dijalankan langsung dari source `.ts`.
 */
if (path.extname(__filename) === ".js") {
  const distRoot = __dirname;
  const aliasPrefixes: ReadonlyArray<readonly [string, string]> = [
    ["@/", ""],
    ["@domain/", "domain/"],
    ["@application/", "application/"],
    ["@infrastructure/", "infrastructure/"],
    ["@presentation/", "presentation/"],
    ["@shared/", "shared/"],
    ["@modules/", "modules/"],
    ["@middlewares/", "middlewares/"],
    ["@utils/", "utils/"],
    ["@lib/", "lib/"],
    ["@routes/", "routes/"],
  ];

  const nodeModule = Module as unknown as PatchedModuleConstructor;

  if (!nodeModule._distPathsRegistered) {
    nodeModule._distPathsRegistered = true;
    const originalResolveFilename = nodeModule._resolveFilename;

    nodeModule._resolveFilename = function (
      request: string,
      parent: unknown,
      isMain: boolean,
      options: unknown,
    ): string {
      for (const [prefix, subdir] of aliasPrefixes) {
        if (request.startsWith(prefix)) {
          const relativeTarget = request.slice(prefix.length);
          const resolvedTarget = path.join(distRoot, subdir, relativeTarget);
          return originalResolveFilename.call(
            this,
            resolvedTarget,
            parent,
            isMain,
            options,
          );
        }
      }

      return originalResolveFilename.call(
        this,
        request,
        parent,
        isMain,
        options,
      );
    };
  }
}
