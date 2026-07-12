const Module = require("node:module");
const path = require("node:path");

const shim = path.join(__dirname, "server-only.js");
const originalResolve = Module._resolveFilename;

Module._resolveFilename = function resolveServerOnlyShim(request, parent, isMain, options) {
  if (request === "server-only") {
    return shim;
  }
  return originalResolve.call(this, request, parent, isMain, options);
};
