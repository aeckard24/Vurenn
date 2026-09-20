export interface SignupConsentState {
  policiesAccepted: boolean
  ageConfirmed: boolean
}

export function signupConsentError({
  policiesAccepted,
  ageConfirmed,
}: SignupConsentState): string | null {
  if (!ageConfirmed) return 'Confirm that you meet Vurenn\'s age and parent-or-guardian permission requirements.'
  if (!policiesAccepted) return 'Read and accept all three Vurenn policies to create an account.'
  return null
}

export function normalizeSignupEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function isPlausibleSignupEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeSignupEmail(value))
}
