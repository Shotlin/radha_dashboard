// Noop stub for the `server-only` package under Vitest.
//
// `server-only` has no standalone implementation in this project — Next.js
// aliases it at compile time, and its default (non-`react-server`) entry throws
// to prevent server modules from being bundled into the client. Under Vitest
// (jsdom, no `react-server` condition) that throw would make any module that
// begins with `import 'server-only'` impossible to import. Aliasing the
// specifier to this empty module lets the pure logic in those modules
// (e.g. `lib/demo/scope.ts`) be unit/property-tested directly.
export {};
