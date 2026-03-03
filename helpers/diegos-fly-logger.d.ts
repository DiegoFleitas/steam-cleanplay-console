declare module 'diegos-fly-logger/index.mjs' {
  import type { RequestHandler } from 'express';

  export const logging: RequestHandler;
}

