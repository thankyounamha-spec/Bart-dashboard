import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * async 라우트 핸들러를 감싸서 에러를 자동으로 next()로 전달
 * try-catch 보일러플레이트 제거 목적
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
