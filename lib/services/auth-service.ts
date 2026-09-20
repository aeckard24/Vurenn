import { analytics } from '@heycatch/sdk'
import { ApiError } from '@/lib/api/errors'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'
import type { Session } from '@supabase/supabase-js'

export interface AuthSession {
  user: User | null
  accessToken: string | null
  expiresAt: number | null
  authenticated: boolean
}

export interface AuthCredentials {
  email: string
  password: string
  displayName?: string
  legalVersion?: string
  legalAcceptedAt?: string
  ageConfirmed?: boolean
  betaInviteTokenHash?: string
}

export type AuthStateListener = (session: AuthSession) => void

export interface AuthService {
  getSession(): Promise<AuthSession>
  getAccessToken(): Promise<string | null>
  signIn(credentials: AuthCredentials): Promise<AuthSession>
  signUp(credentials: AuthCredentials): Promise<AuthSession>
  verifySignupOtp(email: string, token: string): Promise<AuthSession>
  signInWithOAuth(provider: 'google' | 'github'): Promise<void>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
  onAuthStateChange(listener: AuthStateListener): () => void
}

function toAuthSession(session: Session | null): AuthSession {
  const source = session?.user
  const plan = source?.app_metadata?.plan
  return {
    user: source
      ? {
          id: source.id,
          email: source.email ?? '',
          displayName:
            source.user_metadata?.display_name ??
            source.user_metadata?.full_name ??
            source.email?.split('@')[0] ??
            'Vurenn user',
          avatarUrl: source.user_metadata?.avatar_url ?? null,
          plan: plan === 'pro' || plan === 'premier' ? plan : 'free',
        }
      : null,
    accessToken: session?.access_token ?? null,
    expiresAt: session?.expires_at ?? null,
    authenticated: Boolean(session?.user && session.access_token),
  }
}

function identify(authSession: AuthSession): void {
  if (!authSession.user) return
  analytics.setIdentity(authSession.user.id, {
    email: authSession.user.email,
    name: authSession.user.displayName,
    plan: authSession.user.plan,
  })
}

function supabaseError(
  error: { message: string; status?: number; code?: string } | null,
): ApiError {
  return new ApiError({
    status: error?.status ?? 0,
    code: error?.code ?? 'authentication_failed',
    message: error?.message ?? 'Authentication failed.',
    retryable: false,
  })
}

export function createSupabaseAuthService(): AuthService {
  const client = getSupabaseClient()

  return {
    async getSession() {
      const { data, error } = await client.auth.getSession()
      if (error) throw supabaseError(error)
      return toAuthSession(data.session)
    },
    async getAccessToken() {
      const { data, error } = await client.auth.getSession()
      if (error) throw supabaseError(error)
      return data.session?.access_token ?? null
    },
    async signIn({ email, password }) {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw supabaseError(error)
      const authSession = toAuthSession(data.session)
      identify(authSession)
      return authSession
    },
    async signUp({ email, password, displayName, legalVersion, legalAcceptedAt, ageConfirmed, betaInviteTokenHash }) {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName?.trim() || undefined,
            legal_version: legalVersion,
            legal_accepted_at: legalAcceptedAt,
            terms_accepted: Boolean(legalVersion && legalAcceptedAt),
            privacy_accepted: Boolean(legalVersion && legalAcceptedAt),
            acceptable_use_accepted: Boolean(legalVersion && legalAcceptedAt),
            age_confirmed: ageConfirmed === true,
            beta_invite_token_hash: betaInviteTokenHash,
          },
          emailRedirectTo:
            typeof window === 'undefined'
              ? undefined
              : `${window.location.origin}/onboarding`,
        },
      })
      if (error) throw supabaseError(error)
      const authSession = toAuthSession(data.session)
      // `data.session` is null when email confirmation is still pending (or
      // Supabase is obfuscating an existing account) — only a session here
      // proves this is a completed signup. The pending case is reported as
      // `signup_completed` from `verifySignupOtp` below once confirmed.
      if (authSession.authenticated) {
        identify(authSession)
        analytics.trackEvent('signup_completed')
      }
      return authSession
    },
    async verifySignupOtp(email, token) {
      const { data, error } = await client.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })
      if (error) throw supabaseError(error)
      const authSession = toAuthSession(data.session)
      // This is where a pending signup's session is confirmed for the
      // email-code flow, so it's the completion point for that path.
      if (authSession.authenticated) {
        identify(authSession)
        analytics.trackEvent('signup_completed')
      }
      return authSession
    },
    async signInWithOAuth(provider) {
      const { error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo:
            typeof window === 'undefined'
              ? undefined
              : `${window.location.origin}/onboarding`,
        },
      })
      if (error) throw supabaseError(error)
    },
    async signOut() {
      const { error } = await client.auth.signOut()
      if (error) throw supabaseError(error)
      analytics.resetIdentity()
    },
    async resetPassword(email) {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window === 'undefined'
            ? undefined
            : `${window.location.origin}/login?reset=1`,
      })
      if (error) throw supabaseError(error)
    },
    onAuthStateChange(listener) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        const authSession = toAuthSession(session)
        // Covers identity for paths with no explicit call site above
        // (OAuth redirect, magic-link confirmation redirect, token
        // refresh) — setIdentity is safe to call repeatedly.
        if (authSession.user) {
          identify(authSession)
        } else {
          analytics.resetIdentity()
        }
        listener(authSession)
      })
      return () => data.subscription.unsubscribe()
    },
  }
}

export function createUnconfiguredAuthService(): AuthService {
  const unavailable = () =>
    new ApiError({
      status: 0,
      code: 'auth_not_configured',
      message:
        'Authentication is not connected. Configure the approved Supabase client before enabling sign-in.',
      retryable: false,
    })

  return {
    async getSession() {
      return {
        user: null,
        accessToken: null,
        expiresAt: null,
        authenticated: false,
      }
    },
    async getAccessToken() {
      return null
    },
    async signIn() {
      throw unavailable()
    },
    async signUp() {
      throw unavailable()
    },
    async verifySignupOtp() {
      throw unavailable()
    },
    async signInWithOAuth() {
      throw unavailable()
    },
    async signOut() {},
    async resetPassword() {
      throw unavailable()
    },
    onAuthStateChange() {
      return () => {}
    },
  }
}
