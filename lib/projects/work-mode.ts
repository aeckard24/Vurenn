export type ProjectWorkMode =
  | 'research'
  | 'sandbox'
  | 'plan'
  | 'create'
  | 'focus'

export interface ProjectWorkModeDefinition {
  id: ProjectWorkMode
  eyebrow: string
  title: string
  description: string
  stages: string[]
  nodes: string[]
}

export const PROJECT_WORK_MODES: Record<
  ProjectWorkMode,
  ProjectWorkModeDefinition
> = {
  research: {
    id: 'research',
    eyebrow: 'Research constellation',
    title: 'Connecting the evidence',
    description:
      'Vurenn is handing the request to live research with project memory and saved knowledge attached.',
    stages: [
      'Reading the project objective',
      'Connecting saved knowledge',
      'Opening live source discovery',
      'Preparing the evidence map',
    ],
    nodes: ['Project memory', 'Knowledge files', 'Live web', 'Evidence map'],
  },
  sandbox: {
    id: 'sandbox',
    eyebrow: 'Analysis sandbox',
    title: 'Building a safe workspace',
    description:
      'Files, assumptions, and calculations are being isolated before analysis begins.',
    stages: [
      'Inspecting available files',
      'Preparing the analysis sandbox',
      'Mapping assumptions and variables',
      'Opening the verified work session',
    ],
    nodes: ['Project files', 'Code sandbox', 'Assumptions', 'Results'],
  },
  plan: {
    id: 'plan',
    eyebrow: 'Plan mode',
    title: 'Turning intent into structure',
    description:
      'Vurenn is connecting the goal, constraints, dependencies, and definition of done.',
    stages: [
      'Clarifying the outcome',
      'Loading constraints and decisions',
      'Mapping dependencies',
      'Opening the project plan',
    ],
    nodes: ['Outcome', 'Constraints', 'Dependencies', 'Milestones'],
  },
  create: {
    id: 'create',
    eyebrow: 'Creation studio',
    title: 'Assembling the creative brief',
    description:
      'Project context and references are being connected before the first draft starts.',
    stages: [
      'Reading the creative request',
      'Connecting references',
      'Setting quality constraints',
      'Opening the creation studio',
    ],
    nodes: ['Brief', 'References', 'Draft', 'Quality review'],
  },
  focus: {
    id: 'focus',
    eyebrow: 'Focused workspace',
    title: 'Bringing the project into focus',
    description:
      'Vurenn is connecting the current request to the project’s purpose and standing instructions.',
    stages: [
      'Reading the request',
      'Connecting project memory',
      'Checking standing instructions',
      'Opening the focused chat',
    ],
    nodes: ['Request', 'Project memory', 'Instructions', 'Next action'],
  },
}

const RESEARCH_PATTERN =
  /\b(research|find\b[^.!?\n]{0,60}\bsources?|search\s+(?:the\s+)?web|look\s+up|latest|current\s+(?:news|information|data)|cite)\b/i
const SANDBOX_PATTERN =
  /\b(analy[sz]e\s+(?:(?:the|this|a)\s+)?(?:data|file|spreadsheet|dataset)|calculate|run\s+(?:the\s+)?numbers|model\s+the|sandbox|chart|graph)\b/i
const PLAN_PATTERN =
  /\b(plan|roadmap|milestones?|strategy|schedule|timeline|next\s+steps?|organize|prioriti[sz]e|break\s+(?:this|it)\s+down)\b/i
const CREATE_PATTERN =
  /\b(create|generate|design|draft|write|build|make)\b.*\b(image|illustration|document|presentation|report|proposal|brief|mockup|artifact)\b/i

export function inferProjectWorkMode(
  content: string,
  tools: string[] = [],
): ProjectWorkMode {
  if (
    tools.includes('deep_research') ||
    tools.includes('web_search') ||
    RESEARCH_PATTERN.test(content)
  ) {
    return 'research'
  }
  if (
    tools.includes('data_analysis') ||
    tools.includes('file_analysis') ||
    SANDBOX_PATTERN.test(content)
  ) {
    return 'sandbox'
  }
  if (tools.includes('image_generation') || CREATE_PATTERN.test(content)) {
    return 'create'
  }
  if (PLAN_PATTERN.test(content)) return 'plan'
  return 'focus'
}

export function projectToolsForRequest(
  content: string,
  tools: string[] = [],
): string[] {
  const next = new Set(tools)
  const mode = inferProjectWorkMode(content, tools)
  if (mode === 'research' && !next.has('deep_research')) next.add('web_search')
  if (mode === 'sandbox') next.add('data_analysis')
  if (mode === 'create' && /\b(image|illustration|picture|photo)\b/i.test(content)) {
    next.add('image_generation')
  }
  return [...next]
}
