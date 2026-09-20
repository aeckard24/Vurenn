export interface ApiErrorShape {
  status: number
  code: string
  message: string
  details?: unknown
  requestId?: string
  retryAfter?: number
  retryable?: boolean
}

const STATUS_CODES: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'validation_error',
  429: 'rate_limited',
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request was not accepted.',
  401: 'Your session is missing or has expired.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'The request conflicts with the current resource state.',
  422: 'The request contains invalid data.',
  429: 'Too many requests. Please try again later.',
}

export class ApiError extends Error implements ApiErrorShape {
  readonly status: number
  readonly code: string
  readonly details?: unknown
  readonly requestId?: string
  readonly retryAfter?: number
  readonly retryable: boolean

  constructor(shape: ApiErrorShape, options?: ErrorOptions) {
    super(shape.message, options)
    this.name = 'ApiError'
    this.status = shape.status
    this.code = shape.code
    this.details = shape.details
    this.requestId = shape.requestId
    this.retryAfter = shape.retryAfter
    this.retryable =
      shape.retryable ??
      (shape.status === 0 || shape.status === 429 || shape.status >= 500)
  }
}

export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined
  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds
  const date = Date.parse(value)
  if (Number.isNaN(date)) return undefined
  return Math.max(0, Math.ceil((date - Date.now()) / 1000))
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError({
      status: 0,
      code: 'request_aborted',
      message: 'The request was stopped.',
      retryable: false,
    })
  }
  if (error instanceof Error) {
    return new ApiError(
      {
        status: 0,
        code: 'network_error',
        message: 'Unable to reach the Vurenn service.',
        details: { cause: error.message },
        retryable: true,
      },
      { cause: error },
    )
  }
  return new ApiError({
    status: 0,
    code: 'unknown_error',
    message: 'An unexpected request error occurred.',
    details: error,
    retryable: false,
  })
}

export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  const requestId = response.headers.get('x-request-id') ?? undefined
  const retryAfter = parseRetryAfter(response.headers.get('retry-after'))
  let payload: Record<string, unknown> | null = null

  try {
    payload = (await response.json()) as Record<string, unknown>
  } catch {
    payload = null
  }

  const nested =
    payload?.error && typeof payload.error === 'object'
      ? (payload.error as Record<string, unknown>)
      : payload
  const code =
    (typeof nested?.code === 'string' && nested.code) ||
    STATUS_CODES[response.status] ||
    (response.status >= 500 ? 'server_error' : 'request_failed')
  const message =
    (typeof nested?.message === 'string' && nested.message) ||
    STATUS_MESSAGES[response.status] ||
    (response.status >= 500
      ? 'The Vurenn service encountered an error.'
      : `The request failed with status ${response.status}.`)

  return new ApiError({
    status: response.status,
    code,
    message,
    details: nested?.details ?? payload,
    requestId,
    retryAfter,
    retryable:
      typeof nested?.retryable === 'boolean'
        ? nested.retryable
        : undefined,
  })
}
