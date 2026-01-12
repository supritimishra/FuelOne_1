// This file is deprecated. MongoDB architecture does not require per-tenant pools.
// Keeping file to avoid import errors until all references are removed.

export function getTenantDb() {
  throw new Error("getTenantDb is deprecated. Use Mongoose models.");
}

export function closeAllTenantConnections() {
  // No-op
  return Promise.resolve();
}
