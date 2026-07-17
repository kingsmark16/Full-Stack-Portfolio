import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

type RequestIdLocals = {
  requestId: string
}

export function requestIdMiddleware(
  _request: Request,
  response: Response<unknown, RequestIdLocals>,
  next: NextFunction,
): void {
  const requestId = randomUUID()

  response.locals.requestId = requestId
  response.setHeader('x-request-id', requestId)

  next()
}
