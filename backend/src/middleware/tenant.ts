import type { NextFunction, Request, Response } from "express";

export type TenantRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any> = Request<P, ResBody, ReqBody, ReqQuery> & {
  businessId: string;
  actorId: string;
};

export function tenantContext(req: Request, _res: Response, next: NextFunction) {
  const businessId = (req.header("x-business-id") || process.env.DEMO_BUSINESS_ID || "demo-business").trim();
  const actorId = (req.header("x-user-id") || "demo-owner").trim();
  (req as TenantRequest).businessId = businessId;
  (req as TenantRequest).actorId = actorId;
  next();
}
