export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (msg: string) => new AppError(404, msg, "NOT_FOUND");
export const conflict = (msg: string) => new AppError(409, msg, "CONFLICT");
export const forbidden = (msg: string) => new AppError(403, msg, "FORBIDDEN");
export const badRequest = (msg: string) =>
  new AppError(400, msg, "BAD_REQUEST");
export const unauthorized = (msg: string) =>
  new AppError(401, msg, "UNAUTHORIZED");
