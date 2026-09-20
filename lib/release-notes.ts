export const CURRENT_RELEASE = {
  version: '2026.09.18.1',
  date: 'September 18, 2026',
  title: 'Meet Vurenn Axiom and Equation View',
  summary:
    'More capable problem solving meets mathematics that finally looks like mathematics.',
  changes: [
    'Vurenn Axiom is a higher-performance mode for complex math, science, coding, and multi-step reasoning. Choose it from the model menu on Pro or Premier.',
    'Equation View automatically typesets inline and display equations, keeps long formulas readable on phones, and preserves raw notation inside code blocks.',
    'The Vurenn mark now follows light and dark appearance correctly. Small-screen navigation has more breathing room.',
    'Basic keeps its existing rolling chat limit; Axiom requires a paid plan so premium reasoning cannot drain free usage.',
  ],
} as const

export const CURRENT_RELEASE_SEEN_KEY = `vurenn:release-seen:${CURRENT_RELEASE.version}`
