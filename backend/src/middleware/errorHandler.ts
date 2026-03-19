import type { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Express 전역 에러 핸들러
 * 잡히지 않은 에러를 ApiResponse 형식으로 변환하여 반환
 */
export function errorHandler(
  err: Error & { statusCode?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  logger.error(`Unhandled error: ${err.message}`, {
    code,
    statusCode,
    stack: err.stack,
  });

  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: {
      code,
      message: err.message || 'Internal server error',
    },
  };

  res.status(statusCode).json(response);
}
