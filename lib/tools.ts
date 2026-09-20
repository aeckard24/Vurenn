import {
  BarChart3,
  FileUp,
  ImagePlus,
  Microscope,
  type LucideIcon,
} from 'lucide-react'

export interface VurennToolDefinition {
  id: string
  label: string
  description: string
  icon: LucideIcon
  tone: string
}

export const SELECTABLE_TOOLS: VurennToolDefinition[] = [
  {
    id: 'deep_research',
    label: 'Deep research',
    description: 'Confirm a plan, compare sources, and build a cited answer',
    icon: Microscope,
    tone: 'bg-violet-500/12 text-violet-500',
  },
  {
    id: 'data_analysis',
    label: 'Analyze data',
    description: 'Inspect, calculate, and explain datasets',
    icon: BarChart3,
    tone: 'bg-emerald-500/12 text-emerald-500',
  },
  {
    id: 'image_generation',
    label: 'Create an image',
    description: 'Turn a visual idea into an original asset',
    icon: ImagePlus,
    tone: 'bg-rose-500/12 text-rose-500',
  },
]

export const FILE_TOOL: VurennToolDefinition = {
  id: 'file_analysis',
  label: 'Add a file from computer',
  description: 'PDF, text, data, or an image up to 25 MB',
  icon: FileUp,
  tone: 'bg-amber-500/12 text-amber-500',
}

const DEEP_RESEARCH_PHRASES = [
  'deep research',
  'research this thoroughly',
  'comprehensive research',
  'investigate this',
  'compare sources',
]

const ALWAYS_LIVE_PATTERNS = [
  /\b(?:weather|forecast|temperature|radar|air quality|uv index|snowfall|rainfall)\b/i,
  /\b(?:breaking news|latest news|news today|headlines?)\b/i,
  /\b(?:stock price|share price|market price|exchange rate|crypto price|gas prices?)\b/i,
  /\b(?:score|standings|sports schedule|game tonight|kickoff time)\b/i,
  /\b(?:flight status|train status|traffic|road closure|power outage)\b/i,
]

const LIVE_TIME_WORDS = /\b(?:today|tonight|tomorrow|currently|current|right now|live|latest|recent|this (?:morning|afternoon|evening|week|month|year))\b/i
const CHANGEABLE_TOPICS = /\b(?:weather|news|price|rate|score|schedule|availability|hours|election|president|governor|mayor|ceo|law|rule|policy|release|version|event|concert|flight|traffic|market|stock|crypto|restaurant|store)\b/i

/** Current facts should work from natural language, without requiring “search”. */
export function wantsLiveWebSearch(text: string, selected: string[] = []): boolean {
  if (selected.includes('web_search') || selected.includes('deep_research')) return true
  if (/https?:\/\/\S+/i.test(text)) return true
  if (ALWAYS_LIVE_PATTERNS.some((pattern) => pattern.test(text))) return true
  if (LIVE_TIME_WORDS.test(text) && CHANGEABLE_TOPICS.test(text)) return true
  if (/\b(?:troubleshoot|diagnose|steps? to fix|how (?:do i|can i|to) fix|exactly what buttons?|error code|stopped working|used to work|not working)\b/i.test(text)) return true
  return /\b(?:search|browse|look up|check|find)\b[\s\S]{0,45}\b(?:web|online|internet|sources?|website)\b/i.test(text)
}

const STRUCTURED_FILE_TYPES = new Set([
  'text/csv',
  'application/json',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel.sheet.macroenabled.12',
  'application/vnd.ms-excel',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
])

export function needsSandboxedFileAnalysis(
  attachment: { name: string; type: string },
): boolean {
  return (
    STRUCTURED_FILE_TYPES.has(attachment.type.toLowerCase()) ||
    /\.(csv|json|xlsx|xlsm|xls|ods|docx|pptx)$/i.test(attachment.name)
  )
}

export function wantsDeepResearch(text: string, selected: string[] = []): boolean {
  if (selected.includes('deep_research')) return true
  const normalized = text.toLowerCase()
  return DEEP_RESEARCH_PHRASES.some((phrase) => normalized.includes(phrase))
}

export function inferVisibleTools(
  text: string,
  attachments: number,
  selected: string[] = [],
): string[] {
  const normalized = text.toLowerCase()
  const hasWebLink = /https?:\/\/\S+/i.test(text)
  const hasSpreadsheetLink =
    hasWebLink &&
    /(sharepoint\.com|docs\.google\.com\/spreadsheets|\.xlsx?\b|\.csv\b)/i.test(
      text,
    )
  const inferred = [...selected]
  if (wantsDeepResearch(text, selected)) inferred.push('deep_research')
  else if (
    hasWebLink ||
    wantsLiveWebSearch(text, selected) ||
    [
      'search the web',
      'look this up',
      'latest news',
      'current information',
      'current price',
      'latest update',
    ].some((phrase) => normalized.includes(phrase))
  ) {
    inferred.push('web_search')
  }
  if (
    hasSpreadsheetLink ||
    [
      'analyze this spreadsheet',
      'analyse this spreadsheet',
      'analyze the spreadsheet',
      'analyse the spreadsheet',
      'analyze this data',
      'data analysis',
      'analyze the csv',
      'run the numbers',
    ].some((phrase) => normalized.includes(phrase))
  ) {
    inferred.push('data_analysis')
  }
  if (
    /\b(?:make|create|generate|draw|design)\b[\s\S]{0,80}\b(?:image|picture|photo|illustration|poster|logo|banner)\b/i.test(text) ||
    [
      'generate an image',
      'create an image',
      'make an image',
      'make me an image',
      'make me a image',
      'create a logo',
      'make a poster',
      'create a banner',
      'concept art',
    ].some((phrase) => normalized.includes(phrase))
  ) {
    inferred.push('image_generation')
  }
  if (attachments > 0) inferred.push('file_analysis')
  return [...new Set(inferred)]
}

export function describeToolSubject(text: string, tool: string): string | undefined {
  if (tool === 'deep_research') {
    const topic = text
      .replace(/^\s*(?:please\s+)?deep research(?:\s+(?:on|about))?\s+/i, '')
      .replace(/^\s*(?:please\s+)?(?:deeply\s+)?(?:research|investigate|look into)\s+/i, '')
      .replace(/^\s*(?:do|perform|run)\s+(?:a\s+)?deep research\s+(?:on|about)?\s*/i, '')
      .replace(/[.!?]+\s*$/, '')
      .trim()
    return (topic || text.trim() || 'your research question').slice(0, 140)
  }
  if (tool !== 'image_generation') return undefined
  let cleaned = text
    .replace(/^\s*(?:please\s+)?(?:can you\s+|could you\s+)?/i, '')
    .replace(/^\s*(?:make|create|generate|draw|design)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|illustration)\s+(?:of\s+)?/i, '')
    .replace(/[.!?]+\s*$/, '')
    .trim()
  if (!cleaned || cleaned.length === text.trim().length) return 'your image'
  const yearAfterModel = cleaned.match(/^(?:an?\s+)?(.+?)\s+((?:19|20)\d{2})\s+(.+)$/i)
  if (yearAfterModel) {
    cleaned = `${yearAfterModel[2]} ${yearAfterModel[1]} ${yearAfterModel[3]}`
  }
  return cleaned.slice(0, 110)
}
