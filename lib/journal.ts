import { getFrontendEnv } from '@/lib/config/env'

export interface JournalUpdate {
  date: string
  category: string
  title: string
  summary: string
}

export interface JournalTeamMember {
  name: string
  role: string
  note: string
}

export interface JournalReview {
  id: string
  author: string
  quote: string
  rating: number | null
  date: string
  source: 'facebook' | 'direct'
  source_url: string
}

export interface JournalContent {
  intro: string
  social: { facebook: string; instagram: string }
  reviews: JournalReview[]
  updates: JournalUpdate[]
  team: JournalTeamMember[]
}

export const DEFAULT_JOURNAL_CONTENT: JournalContent = {
  intro:
    "This is the public record of Vurenn's progress: product updates, decisions, lessons, and introductions to the people doing the work.",
  social: {
    facebook: 'https://www.facebook.com/people/Vurenn-AI/61592711165046/',
    instagram: '',
  },
  reviews: [],
  updates: [
    {
      date: 'September 18, 2026',
      category: 'Intelligence & Interface',
      title: 'Vurenn Axiom and Equation View',
      summary:
        'Vurenn Axiom adds a higher-performance Pro and Premier mode for difficult reasoning, complex mathematics, science, and code. Equation View typesets mathematical notation in chat instead of exposing raw markup, with mobile-friendly long formulas. Logo contrast now follows light or dark appearance, and the mobile header has more room. Basic retains its rolling message limit and cannot use the premium mode.',
    },
    {
      date: 'September 2, 2026',
      category: 'Projects & Community',
      title: 'Runnable project workspaces and a public review board',
      summary:
        'Project requests can now open a dedicated Developer Workspace with the project brief, suggested stack, starter files, to-do plan, and conversation context already connected. Browser projects keep their instant preview, while Python and other installed languages run through a separate isolated execution service. The public journal also adds a moderated community review board linked to Vurenn’s official Facebook page, with optional Instagram linking and automatic Facebook review synchronization when the Page integration is authorized.',
    },
    {
      date: 'August 29, 2026',
      category: 'Developer Workspace',
      title: 'A focused, multi-language workspace built around the project',
      summary:
        'Developer Workspace now opens in its own browser tab and replaces the crowded layout with focused Code, Preview, Console, Vurenn, and Plan views. A skippable project brief creates language-appropriate starter files and useful next steps, while the new file creator supports common languages plus any custom filename or extension. Vurenn now follows each file extension automatically instead of forcing every project into HTML, CSS, and JavaScript.',
    },
    {
      date: 'August 19, 2026',
      category: 'Performance',
      title: 'A faster path from send to first word',
      summary:
        'Vurenn now safely reuses recent sign-in and private-beta checks, loads conversation context, history, and preferences in parallel, and saves messages without delaying response generation. A new once-per-release update window also makes meaningful changes easy to find without interrupting every visit.',
    },
    {
      date: 'August 12, 2026',
      category: 'Product',
      title: 'Light mode, live follow-ups, and a real developer workspace',
      summary:
        'Every appearance preset now has a complete light palette. Live search carries context across follow-up answers, web activity is shown in a compact status line, and explicit requests for silence are honored. Developer Workspace now combines persistent Vurenn chat with a multi-file editor, isolated preview, browser console, revision history, local autosave, and export. Andrew Eckard also has a narrowly scoped access-code workspace; CEO-only controls and reporting remain restricted.',
    },
    {
      date: 'August 12, 2026',
      category: 'Product',
      title: 'A faster, friendlier Vurenn across every screen',
      summary:
        'This release rebuilds the mobile chat and CEO admin experience, fixes automatic live web search, prevents repeated streamed text, makes ordinary replies feel lighter and more playful, upgrades voice input and output through OpenAI audio services, simplifies response activity, and introduces a sandboxed Developer Workspace for building, editing, previewing, and exporting code.',
    },
    {
      date: 'August 9, 2026',
      category: 'Founders',
      title: 'Why we built Vurenn',
      summary:
        'Vurenn was built by Christian developers who want to use their gifts in service of truth, creativity, and human dignity. We saw room for an independent assistant that values honest correction over empty agreement, admits uncertainty, and treats every person with respect. Our faith shapes those commitments without requiring users to share it, and we do not claim perfect answers.',
    },
    {
      date: 'August 8, 2026',
      category: 'Company',
      title: 'Vurenn private beta opens August 9',
      summary:
        'Vurenn opens by personal invitation on Sunday, August 9 at 12:00 PM Eastern. This first release is intentionally small so the team can support every invited member, study real usage, and improve carefully before a broader launch. Invitation requests can be sent to access@vurenn.com.',
    },
    {
      date: 'August 8, 2026',
      category: 'Trust & Safety',
      title: 'Launch safeguards and consent records are ready',
      summary:
        'Vurenn now saves policy acceptance once per version, clearly supports users ages 13–17 with parent or guardian permission, blocks dangerous instruction requests, and gives the CEO a restricted safety-review trail. Safety records expire after 90 days unless preservation is legitimately required; passwords are never exposed to administrators.',
    },
    {
      date: 'August 6, 2026',
      category: 'Projects',
      title: 'Project Intelligence enters work mode',
      summary:
        'Projects now recognize planning, research, analysis, and creation requests, then transition into a connected visual workspace before opening the live work session. The Intelligence Program also expands to 100 published capabilities with honest availability labels.',
    },
    {
      date: 'August 6, 2026',
      category: 'Vurenn Labs',
      title: 'The 50-feature Intelligence Program is live',
      summary:
        'A new Labs catalog makes Vurenn’s reasoning, personal intelligence, projects, voice, privacy, and safety roadmap visible. Guided workflows that work today can be launched directly; beta, foundation, and planned work is labeled honestly.',
    },
    {
      date: 'August 3, 2026',
      category: 'Product',
      title: 'Vurenn Voice returns',
      summary:
        'Hands-free conversation is available with automatic listening, concise spoken replies, and five selectable neural voices.',
    },
    {
      date: 'July 29, 2026',
      category: 'Developers',
      title: 'A safer Vurenn API foundation',
      summary:
        'Authenticated access, usage tracking, and clear model behavior for apps, tools, and future robotics work.',
    },
    {
      date: 'July 2026',
      category: 'Company',
      title: 'Preparing Vurenn for launch',
      summary:
        'Connecting the core product, tightening billing and security, and testing every path before opening the doors.',
    },
  ],
  team: [
    {
      name: 'Andrew Eckard',
      role: 'CEO · Lead developer',
      note: 'Company leadership, product direction, engineering, infrastructure, and operations.',
    },
    {
      name: 'Kendric',
      role: 'Founding team',
      note: 'Early product testing, practical feedback, and helping shape the product.',
    },
  ],
}

export function normalizeJournalContent(value: unknown): JournalContent {
  const source = value && typeof value === 'object' ? value as Partial<JournalContent> : {}
  const social: Partial<JournalContent['social']> =
    source.social && typeof source.social === 'object' ? source.social : {}
  return {
    intro: typeof source.intro === 'string' ? source.intro : DEFAULT_JOURNAL_CONTENT.intro,
    social: {
      facebook: typeof social.facebook === 'string' ? social.facebook : DEFAULT_JOURNAL_CONTENT.social.facebook,
      instagram: typeof social.instagram === 'string' ? social.instagram : DEFAULT_JOURNAL_CONTENT.social.instagram,
    },
    reviews: Array.isArray(source.reviews) ? source.reviews : [],
    updates: Array.isArray(source.updates) ? source.updates : [...DEFAULT_JOURNAL_CONTENT.updates],
    team: Array.isArray(source.team) ? source.team : [...DEFAULT_JOURNAL_CONTENT.team],
  }
}

export async function getPublicJournal(): Promise<JournalContent> {
  const apiUrl = getFrontendEnv().apiUrl
  if (!apiUrl) return DEFAULT_JOURNAL_CONTENT
  try {
    const response = await fetch(`${apiUrl.replace(/\/+$/, '')}/v1/public/journal`, {
      next: { revalidate: 30 },
    })
    if (!response.ok) return DEFAULT_JOURNAL_CONTENT
    return normalizeJournalContent(await response.json())
  } catch {
    return DEFAULT_JOURNAL_CONTENT
  }
}
