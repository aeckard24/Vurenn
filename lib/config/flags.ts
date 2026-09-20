import { getFrontendEnv } from './env'

/**
 * Public frontend flags. Environment parsing lives in env.ts so components and
 * feature modules never read process.env independently.
 */
export const FLAGS = {
  backendEnabled: getFrontendEnv().backendEnabled,
  apexEnabled: true,
} as const

export const BACKEND_UNAVAILABLE_RESPONSE =
  'Vurenn’s response service is not connected yet. Your message has been preserved.'

export const APEX_UNAVAILABLE_MESSAGE =
  'Backend model availability has not been connected.'
