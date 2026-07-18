import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { Request, Response } from 'express'

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNPROCESSABLE_ENTITY: 422,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const

type RequestIdLocals = {
  requestId?: string
}

type ErrorResponse = Record<string, unknown>

function asRecord(value: unknown): ErrorResponse {
  return typeof value === 'object' && value !== null
    ? (value as ErrorResponse)
    : {}
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function titleForStatus(status: number): string {
  if (status === HTTP_STATUS.NOT_FOUND) return 'Not Found'
  if (status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
    return 'Validation Failed'
  }
  if (status === HTTP_STATUS.TOO_MANY_REQUESTS) return 'Too Many Requests'
  if (status >= 500) return 'Internal Server Error'

  return 'Request Failed'
}

function codeForStatus(status: number, path: string): string {
  if (path === '/portfolio' && status === HTTP_STATUS.NOT_FOUND) {
    return 'PORTFOLIO_NOT_PUBLISHED'
  }

  if (path === '/portfolio' && status >= 500) {
    return 'PORTFOLIO_UNAVAILABLE'
  }

  if (status === HTTP_STATUS.TOO_MANY_REQUESTS) return 'RATE_LIMITED'
  if (
    status === HTTP_STATUS.BAD_REQUEST ||
    status === HTTP_STATUS.UNPROCESSABLE_ENTITY
  ) {
    return 'VALIDATION_FAILED'
  }

  return 'REQUEST_FAILED'
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter<unknown> {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp()
    const request = context.getRequest<Request>()
    const response = context.getResponse<Response<unknown, RequestIdLocals>>()

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HTTP_STATUS.INTERNAL_SERVER_ERROR

    const exceptionBody =
      exception instanceof HttpException ? exception.getResponse() : undefined

    const fields = asRecord(exceptionBody)
    const requestId = response.locals.requestId ?? randomUUID()
    const detail =
      asString(fields.detail) ??
      asString(fields.message) ??
      (typeof exceptionBody === 'string'
        ? exceptionBody
        : status >= 500
          ? 'Unexpected server error'
          : 'Request failed')

    const problem = {
      type: asString(fields.type) ?? 'about:blank',
      title: asString(fields.title) ?? titleForStatus(status),
      status,
      detail,
      code: asString(fields.code) ?? codeForStatus(status, request.path),
      requestId,
    }

    response.setHeader('x-request-id', requestId)
    response.status(status).type('application/problem+json').json(problem)
  }
}
