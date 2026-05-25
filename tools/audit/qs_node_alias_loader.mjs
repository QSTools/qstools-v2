import { pathToFileURL } from "url";
import path from "path";
import fs from "fs";

const projectRoot = process.cwd();

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.startsWith("@/")) {
    const relativePath = specifier.slice(2);
    const absolutePath = path.join(projectRoot, relativePath);

    const candidates = [
      absolutePath,
      `${absolutePath}.js`,
      `${absolutePath}.jsx`,
      `${absolutePath}.ts`,
      `${absolutePath}.tsx`,
      path.join(absolutePath, "index.js"),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return {
          url: pathToFileURL(candidate).href,
          shortCircuit: true,
        };
      }
    }

    return {
      url: pathToFileURL(`${absolutePath}.js`).href,
      shortCircuit: true,
    };
  }

  return defaultResolve(specifier, context, defaultResolve);
}