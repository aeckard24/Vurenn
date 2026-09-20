import { ApiError } from '@/lib/api/errors'
import type {
  AuthService,
  AuthSession,
  AuthStateListener,
} from '@/lib/services/auth-service'
import { MOCK_USER } from './data'

const previewSession: AuthSession = {
  user: MOCK_USER,
  accessToken: null,
  expiresAt: null,
  authenticated: false,
}

export class MockAuthService implements AuthService {
  async getSession(): Promise<AuthSession> {
    return previewSession
  }

  async getAccessToken(): Promise<string | null> {
    return null
  }

  async signIn(): Promise<AuthSession> {
    throw new ApiError({
      status: 0,
      code: 'auth_backend_unavailable',
      message:
        'Sign-in is unavailable because authentication is not connected. Mock mode runs as an anonymous frontend preview.',
      retryable: false,
    })
  }

  async signUp(): Promise<AuthSession> {
    return this.signIn()
  }

  async verifySignupOtp(): Promise<AuthSession> {
    return this.signIn()
  }

  async signInWithOAuth(): Promise<void> {
    await this.signIn()
  }

  async signOut(): Promise<void> {}

  async resetPassword(): Promise<void> {
    await this.signIn()
  }

  onAuthStateChange(listener: AuthStateListener): () => void {
    queueMicrotask(() => listener(previewSession))
    return () => {}
  }
}

export const mockAuthService = new MockAuthService()
