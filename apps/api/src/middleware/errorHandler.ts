import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { logAudit, logSecurityEvent } from './auditLog';

export const errorHandler: ErrorRequestHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log to audit
  await logAudit(
    (req.user as any)?.id || null,
    'ERROR',
    req.path,
    { error: err.message, stack: err.stack, status: res.statusCode },
    req
  );

  // Security: Don't leak stack in prod
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

// 500 catch-all
export const catch500s = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  errorHandler(err, req, res, next);
};

