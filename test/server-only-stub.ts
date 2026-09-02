// vitest runs in plain Node, not a webpack/Next.js server bundle, so the real
// "server-only" package (which unconditionally throws to catch accidental
// client-bundle imports) is aliased to this no-op for tests.
export {};
