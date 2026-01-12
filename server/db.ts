import { config } from "dotenv";
import path from "path";
const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });

// Re-export Mongo connection logic
export * from "./db-mongo.js";

export const dbState = {
  type: 'mongodb',
  status: 'connected'
};
