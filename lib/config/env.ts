export interface FrontendEnv {
  apiUrl: string | null
  supabaseUrl: string | null
  supabaseAnonKey: string | null
  backendEnabled: boolean
}

export interface FrontendEnvInput {
  NEXT_PUBLIC_API_URL?: string
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  NEXT_PUBLIC_VURENN_BACKEND_ENABLED?: string
}

export type ServiceMode = 'mock' | 'backend'

const BUILD_TIME_ENV: FrontendEnvInput = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_VURENN_BACKEND_ENABLED:
    process.env.NEXT_PUBLIC_VURENN_BACKEND_ENABLED,
}

function optionalValue(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function readBoolean(value: string | undefined): boolean {
  if (!value) return false
  return value === 'true' || value === '1'
}

function assertHttpUrl(name: string, value: string | null): void {
  if (!value) return
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${name} must be a valid absolute URL.`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${name} must use http:// or https://.`)
  }
}

export function validateFrontendEnv(
  input: FrontendEnvInput,
  options: { development?: boolean } = {},
): FrontendEnv {
  const apiUrl = optionalValue(input.NEXT_PUBLIC_API_URL)
  const supabaseUrl = optionalValue(input.NEXT_PUBLIC_SUPABASE_URL)
  const supabaseAnonKey = optionalValue(input.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const backendEnabled = readBoolean(
    input.NEXT_PUBLIC_VURENN_BACKEND_ENABLED,
  )

  assertHttpUrl('NEXT_PUBLIC_API_URL', apiUrl)
  assertHttpUrl('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl)

  if (Boolean(supabaseUrl) !== Boolean(supabaseAnonKey)) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured together.',
    )
  }

  if (backendEnabled && !apiUrl) {
    const prefix = options.development
      ? 'Backend mode is enabled, but development configuration is incomplete.'
      : 'Backend mode configuration is incomplete.'
    throw new Error(`${prefix} Set NEXT_PUBLIC_API_URL.`)
  }

  return {
    apiUrl,
    supabaseUrl,
    supabaseAnonKey,
    backendEnabled,
  }
}

let cachedEnv: FrontendEnv | null = null

export function getFrontendEnv(): FrontendEnv {
  if (!cachedEnv) {
    cachedEnv = validateFrontendEnv(BUILD_TIME_ENV, {
      development: process.env.NODE_ENV === 'development',
    })
  }
  return cachedEnv
}

export function isBackendEnabled(): boolean {
  return getFrontendEnv().backendEnabled
}

export function selectServiceMode(backendEnabled: boolean): ServiceMode {
  return backendEnabled ? 'backend' : 'mock'
}
