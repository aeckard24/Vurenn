import { apiClient } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/api/endpoints'
import { normalizeApiError } from '@/lib/api/errors'
import type { HealthResponse, ModelsResponse } from '@/lib/api/types'
import { getFrontendEnv } from '@/lib/config/env'
import { services } from '@/lib/services'

export interface DiagnosticCheck {
  name: string
  ok: boolean
  latencyMs?: number
  detail: string
}

export interface BackendDiagnosticsResult {
  checkedAt: string
  backendEnabled: boolean
  apiBaseUrlPresent: boolean
  authenticationTokenAvailable: boolean
  checks: DiagnosticCheck[]
  lastError: {
    status: number
    code: string
    message: string
    requestId?: string
  } | null
}

async function endpointCheck<T>(
  name: string,
  path: string,
  validate: (value: T) => boolean,
): Promise<{ check: DiagnosticCheck; error: BackendDiagnosticsResult['lastError'] }> {
  const started = performance.now()
  try {
    const response = await apiClient.request<T>(path, {
      authenticated: false,
      timeoutMs: 10_000,
    })
    const ok = validate(response)
    return {
      check: {
        name,
        ok,
        latencyMs: Math.round(performance.now() - started),
        detail: ok ? 'Reachable and contract-compatible.' : 'Reachable, but the response shape did not match the contract.',
      },
      error: null,
    }
  } catch (reason) {
    const error = normalizeApiError(reason)
    return {
      check: {
        name,
        ok: false,
        latencyMs: Math.round(performance.now() - started),
        detail: error.message,
      },
      error: {
        status: error.status,
        code: error.code,
        message: error.message,
        requestId: error.requestId,
      },
    }
  }
}

export async function runBackendDiagnostics(): Promise<BackendDiagnosticsResult> {
  const env = getFrontendEnv()
  const token = await services.auth.getAccessToken()
  const checks: DiagnosticCheck[] = [
    {
      name: 'Backend mode',
      ok: env.backendEnabled,
      detail: env.backendEnabled ? 'Enabled.' : 'Disabled; frontend is using mock mode.',
    },
    {
      name: 'API base URL',
      ok: Boolean(env.apiUrl),
      detail: env.apiUrl ? 'Configured.' : 'NEXT_PUBLIC_API_URL is not set.',
    },
    {
      name: 'Authentication token',
      ok: Boolean(token),
      detail: token ? 'Available (value hidden).' : 'No access token is available.',
    },
  ]

  if (!env.apiUrl) {
    return {
      checkedAt: new Date().toISOString(),
      backendEnabled: env.backendEnabled,
      apiBaseUrlPresent: false,
      authenticationTokenAvailable: Boolean(token),
      checks,
      lastError: {
        status: 0,
        code: 'api_not_configured',
        message: 'NEXT_PUBLIC_API_URL is not set.',
      },
    }
  }

  const [health, models] = await Promise.all([
    endpointCheck<HealthResponse>(
      'GET /health',
      API_ENDPOINTS.health,
      (value) => value.status === 'ok' && value.service === 'vurenn-api',
    ),
    endpointCheck<ModelsResponse>(
      'GET /v1/models',
      API_ENDPOINTS.models,
      (value) => Array.isArray(value.models),
    ),
  ])
  checks.push(health.check, models.check)

  return {
    checkedAt: new Date().toISOString(),
    backendEnabled: env.backendEnabled,
    apiBaseUrlPresent: true,
    authenticationTokenAvailable: Boolean(token),
    checks,
    lastError: models.error ?? health.error,
  }
}
