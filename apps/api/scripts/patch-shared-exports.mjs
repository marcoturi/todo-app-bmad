#!/usr/bin/env node
// Patch @todo-app/shared package.json to point all exports at compiled JS in dist/.
// Run this after `tsc --outDir packages/shared/dist` in the Docker build stage.
// Keeping export paths here (rather than an inline eval) makes future additions easy to track.
import { readFileSync, writeFileSync } from 'node:fs';

const pkgPath = 'packages/shared/package.json';
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

pkg.main = './dist/index.js';
pkg.exports = {
  '.': './dist/index.js',
  './todos/schema': './dist/todos/todos.schema.js',
  './todos/types': './dist/todos/todos.types.js',
  './user/schema': './dist/user/user.schema.js',
  './user/types': './dist/user/user.types.js',
};

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log(`Patched ${pkgPath} → exports now point to dist/`);
