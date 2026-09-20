import { analytics } from '@heycatch/sdk'

// The frontend also calls Andrew's Python API on a separate host
// (NEXT_PUBLIC_API_URL, e.g. the Railway-hosted FastAPI/Flask backend).
// Requests to it need to carry the HeyCatch session header so backend
// events can be joined to the right browser session.
const apiUrl = process.env.NEXT_PUBLIC_API_URL
let apiHost: string | undefined
if (apiUrl) {
  try {
    apiHost = new URL(apiUrl).host
  } catch {
    // Malformed value; leave tracingHosts unset rather than guess.
  }
}

analytics.init({
  projectKey: 'hck_pk_ZnMdceaVSk6KSwqTmQaz9iae1q0aRp2Z',
  install: {
    framework: 'nextjs',
    frameworkVersion: '16',
    agent: 'claude-code',
  },
  ...(apiHost ? { tracingHosts: [apiHost] } : {}),
})
