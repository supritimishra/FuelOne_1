// @ts-nocheck
// This file is deprecated. MongoDB architecture does not require per-tenant pools.
// Keeping file to avoid import errors until all references are removed.

export function getTenantDb(): any {
  throw new Error("getTenantDb is deprecated. Use Mongoose models.");
}

export function closeAllTenantConnections(): Promise<void> {
  // No-op
  return Promise.resolve();
}

export function getTenantPool(...args: any[]): any {
  throw new Error("getTenantPool is deprecated.");
}
