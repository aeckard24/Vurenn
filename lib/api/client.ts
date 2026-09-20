import { getFrontendEnv } from '@/lib/config/env'
import {
  ApiError,
  apiErrorFromResponse,
  normalizeApiError,
} from './errors'

export type AccessTokenProvider = () => Promise<string | null>

export interface ApiRequestOptions {
  method?: string
  body?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
  timeoutMs?: number
  authenticated?: boolean
}

export interface ApiClientOptions {
  baseUrl?: string | null
  getAccessToken?: AccessTokenProvider
  onUnauthorized?: () => void | Promise<void>
  defaultTimeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 30_000

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

export class ApiClient {
  private readonly baseUrl: string | null
  private accessTokenProvider: AccessTokenProvider
  private onUnauthorized?: () => void | Promise<void>
  private readonly defaultTimeoutMs: number

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? getFrontendEnv().apiUrl
    this.accessTokenProvider =
      options.getAccessToken ?? (async () => null)
    this.onUnauthorized = options.onUnauthorized
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  setAccessTokenProvider(provider: AccessTokenProvider): void {
    this.accessTokenProvider = provider
  }

  setUnauthorizedHandler(handler: () => void | Promise<void>): void {
    this.onUnauthorized = handler
  }

  async request<T>(
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const response = await this.fetchResponse(path, options)
    if (response.status === 204) return undefined as T
    try {
      return (await response.json()) as T
    } catch (error) {
      throw new ApiError(
        {
          status: response.status,
          code: 'invalid_json',
          message: 'The Vurenn service returned an invalid JSON response.',
          requestId: response.headers.get('x-request-id') ?? undefined,
          retryable: false,
        },
        { cause: error },
      )
    }
  }

  async fetchResponse(
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<Response> {
    if (!this.baseUrl) {
      throw new ApiError({
        status: 0,
        code: 'api_not_configured',
        message:
          'The Vurenn API is not configured. Set NEXT_PUBLIC_API_URL before enabling backend mode.',
        retryable: false,
      })
    }

    const controller = new AbortController()
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
    const abortFromCaller = () => controller.abort()
    options.signal?.addEventListener('abort', abortFromCaller, { once: true })

    try {
      const headers = new Headers(options.headers)
      headers.set('accept', headers.get('accept') ?? 'application/json')

      const token = options.authenticated === false
        ? null
        : await this.accessTokenProvider()
      if (token) headers.set('authorization', `Bearer ${token}`)

      let body: BodyInit | undefined
      if (options.body !== undefined) {
        const isFormData =
          typeof FormData !== 'undefined' && options.body instanceof FormData
        const isBlob =
          typeof Blob !== 'undefined' && options.body instanceof Blob
        if (isFormData || isBlob || typeof options.body === 'string') {
          body = options.body as BodyInit
        } else {
          headers.set('content-type', 'application/json')
          body = JSON.stringify(options.body)
        }
      }

      const response = await fetch(joinUrl(this.baseUrl, path), {
        method: options.method ?? (body ? 'POST' : 'GET'),
        headers,
        body,
        signal: controller.signal,
        cache: 'no-store',
      })

      if (!response.ok) {
        const error = await apiErrorFromResponse(response)
        if (error.status === 401) await this.onUnauthorized?.()
        throw error
      }

      return response
    } catch (error) {
      if (timedOut) {
        throw new ApiError({
          status: 0,
          code: 'request_timeout',
          message: `The request timed out after ${timeoutMs} ms.`,
          retryable: true,
        })
      }
      throw normalizeApiError(error)
    } finally {
      clearTimeout(timeout)
      options.signal?.removeEventListener('abort', abortFromCaller)
    }
  }
}

export const apiClient = new ApiClient()
