import { JWTPayload } from './auth';

declare global {
  namespace Express {
    interface Request {
      tenantDb?: any;
      user?: JWTPayload;
    }
  }
}

export {};
