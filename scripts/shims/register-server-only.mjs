import { register } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const shim = pathToFileURL(path.join(process.cwd(), "scripts/shims/server-only.js")).href;

register("data:text/javascript," + encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { shortCircuit: true, url: ${JSON.stringify(shim)} };
    }
    return nextResolve(specifier, context);
  }
`), pathToFileURL("./"));
