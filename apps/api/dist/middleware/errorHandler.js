"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catch500s = exports.errorHandler = void 0;
const auditLog_1 = require("./auditLog");
const errorHandler = async (err, req, res, next) => {
    // Log to audit
    await (0, auditLog_1.logAudit)(req.user?.id || null, 'ERROR', req.path, { error: err.message, stack: err.stack, status: res.statusCode }, req);
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
exports.errorHandler = errorHandler;
// 500 catch-all
const catch500s = (err, req, res, next) => {
    if (res.headersSent)
        return next(err);
    (0, exports.errorHandler)(err, req, res, next);
};
exports.catch500s = catch500s;
