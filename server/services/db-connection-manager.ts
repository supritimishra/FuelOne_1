import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../../shared/schema.js';

// Connection pool cache for tenant databases
const tenantConnectionPools = new Map<string, Pool>();
const tenantDbInstances = new Map<string, NodePgDatabase<typeof schema>>();

// Configuration
const MAX_IDLE_TIME = 30 * 60 * 1000; // 30 minutes
const POOL_CONFIG = {
  max: 10, // Maximum pool size per tenant
  min: 2,  // Minimum pool size per tenant
  idleTimeoutMillis: MAX_IDLE_TIME,
  connectionTimeoutMillis: 30000, // Increased to 30 seconds for Neon
  acquireTimeoutMillis: 30000, // Time to wait for a connection from pool
  statement_timeout: 60000, // Query timeout: 60 seconds
  query_timeout: 60000, // Query timeout: 60 seconds
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

/**
 * Clear cache for a specific tenant (forces reconnection with fresh schema)
 */
export function clearTenantCache(tenantId: string): void {
  const pool = tenantConnectionPools.get(tenantId);
  if (pool) {
    pool.end();
  }
  tenantConnectionPools.delete(tenantId);
  tenantDbInstances.delete(tenantId);
  console.log(`🔄 Cleared connection cache for tenant: ${tenantId}`);
}

/**
 * Gets or creates a database connection pool for a tenant
 */
export function getTenantPool(connectionString: string, tenantId: string): Pool {
  let pool = tenantConnectionPools.get(tenantId);
  
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      ...POOL_CONFIG,
    });
    
    // Handle pool errors with better logging
    pool.on('error', (err: any) => {
      console.error(`Database pool error for tenant ${tenantId}:`, {
        message: err.message,
        code: err.code,
        severity: err.severity,
        timestamp: new Date().toISOString()
      });
      
      // If it's a connection error, remove the pool to force recreation
      if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        console.log(`🔄 Removing failed pool for tenant ${tenantId} to force recreation`);
        tenantConnectionPools.delete(tenantId);
        tenantDbInstances.delete(tenantId);
      }
    });
    
    // Handle connect events
    pool.on('connect', (client) => {
      console.log(`🔗 New connection established for tenant ${tenantId}`);
    });
    
    // Handle acquire events
    pool.on('acquire', (client) => {
      console.log(`📥 Connection acquired from pool for tenant ${tenantId}`);
    });
    
    // Handle remove events
    pool.on('remove', (client) => {
      console.log(`📤 Connection removed from pool for tenant ${tenantId}`);
    });
    
    tenantConnectionPools.set(tenantId, pool);
    console.log(`✅ Created connection pool for tenant: ${tenantId}`);
  }
  
  return pool;
}

/**
 * Gets or creates a Drizzle database instance for a tenant
 */
export function getTenantDb(
  connectionString: string,
  tenantId: string
): NodePgDatabase<typeof schema> {
  let db = tenantDbInstances.get(tenantId);
  
  if (!db) {
    const pool = getTenantPool(connectionString, tenantId);
    db = drizzle({ client: pool, schema });
    tenantDbInstances.set(tenantId, db);
    console.log(`✅ Created Drizzle instance for tenant: ${tenantId}`);
  }
  
  return db;
}

/**
 * Closes a specific tenant's database connection pool
 */
export async function closeTenantDb(tenantId: string): Promise<void> {
  const pool = tenantConnectionPools.get(tenantId);
  
  if (pool) {
    await pool.end();
    tenantConnectionPools.delete(tenantId);
    tenantDbInstances.delete(tenantId);
    console.log(`✅ Closed connection pool for tenant: ${tenantId}`);
  }
}

/**
 * Closes all tenant database connection pools
 */
export async function closeAllTenantConnections(): Promise<void> {
  console.log(`Closing ${tenantConnectionPools.size} tenant connection pools...`);
  
  const closePromises = Array.from(tenantConnectionPools.keys()).map(
    tenantId => closeTenantDb(tenantId)
  );
  
  await Promise.all(closePromises);
  console.log('✅ All tenant connections closed');
}

/**
 * Gets statistics about current connections
 */
export function getConnectionStats(): {
  activeTenants: number;
  totalPools: number;
  poolDetails: Array<{
    tenantId: string;
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  }>;
} {
  const poolDetails = Array.from(tenantConnectionPools.entries()).map(
    ([tenantId, pool]) => ({
      tenantId,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    })
  );
  
  return {
    activeTenants: tenantConnectionPools.size,
    totalPools: tenantConnectionPools.size,
    poolDetails,
  };
}

/**
 * Cleans up idle connections (runs periodically)
 */
export async function cleanupIdleConnections(): Promise<void> {
  // This is handled automatically by the pool's idleTimeoutMillis setting
  // But we can add additional cleanup logic here if needed
  const stats = getConnectionStats();
  console.log(`Connection stats: ${stats.activeTenants} active tenants`);
}

/**
 * Retry mechanism with exponential backoff
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error && typeof error === 'object' && 'code' in error) {
        const errorCode = (error as any).code;
        if (errorCode === '42P01' || errorCode === '42703') { // Table/column doesn't exist
          throw error;
        }
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries + 1} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Tests a tenant database connection with retry logic
 */
export async function testTenantConnection(
  connectionString: string,
  tenantId: string
): Promise<boolean> {
  try {
    return await retryWithBackoff(async () => {
      const db = getTenantDb(connectionString, tenantId);
      // Simple query to test connection
      await db.execute(sql`SELECT 1`);
      return true;
    });
  } catch (error) {
    console.error(`Failed to test connection for tenant ${tenantId}:`, error);
    return false;
  }
}

// Graceful shutdown handler
let isShuttingDown = false;

export async function gracefulShutdown(): Promise<void> {
  if (isShuttingDown) return;
  
  isShuttingDown = true;
  console.log('🛑 Initiating graceful shutdown of tenant connections...');
  
  await closeAllTenantConnections();
  
  console.log('✅ Graceful shutdown complete');
}

// Register shutdown handlers
if (process.env.NODE_ENV === 'production') {
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  process.on('beforeExit', gracefulShutdown);
}

// Periodic cleanup (every 10 minutes)
setInterval(cleanupIdleConnections, 10 * 60 * 1000);
