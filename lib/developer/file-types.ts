export type WorkspaceFile = { name: string; language: string; content: string }

export type ProjectKind = 'web' | 'automation' | 'api' | 'data' | 'library' | 'other'

export interface ProjectBrief {
  name: string
  goal: string
  kind: ProjectKind
  experience: 'guided' | 'comfortable' | 'expert'
}

export const FILE_TYPE_OPTIONS = [
  ['html', 'HTML', '.html'], ['css', 'CSS', '.css'], ['javascript', 'JavaScript', '.js'],
  ['typescript', 'TypeScript', '.ts'], ['tsx', 'React / TSX', '.tsx'], ['jsx', 'React / JSX', '.jsx'],
  ['python', 'Python', '.py'], ['json', 'JSON', '.json'], ['markdown', 'Markdown', '.md'],
  ['yaml', 'YAML', '.yml'], ['sql', 'SQL', '.sql'], ['shell', 'Shell', '.sh'],
  ['java', 'Java', '.java'], ['csharp', 'C#', '.cs'], ['cpp', 'C++', '.cpp'],
  ['c', 'C', '.c'], ['go', 'Go', '.go'], ['rust', 'Rust', '.rs'], ['php', 'PHP', '.php'],
  ['ruby', 'Ruby', '.rb'], ['swift', 'Swift', '.swift'], ['kotlin', 'Kotlin', '.kt'],
  ['dart', 'Dart', '.dart'], ['vue', 'Vue', '.vue'], ['svelte', 'Svelte', '.svelte'],
  ['xml', 'XML', '.xml'], ['text', 'Plain text', '.txt'], ['custom', 'Any other extension', ''],
] as const

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  html: 'html', htm: 'html', css: 'css', scss: 'scss', sass: 'sass', less: 'less',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
  py: 'python', ipynb: 'json', json: 'json', jsonc: 'json', md: 'markdown', mdx: 'mdx',
  yml: 'yaml', yaml: 'yaml', toml: 'toml', xml: 'xml', svg: 'xml', sql: 'sql',
  sh: 'shell', bash: 'shell', zsh: 'shell', ps1: 'powershell', bat: 'batch', cmd: 'batch',
  java: 'java', cs: 'csharp', c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', hpp: 'cpp',
  go: 'go', rs: 'rust', php: 'php', rb: 'ruby', swift: 'swift', kt: 'kotlin', kts: 'kotlin',
  dart: 'dart', vue: 'vue', svelte: 'svelte', r: 'r', lua: 'lua', scala: 'scala',
  ex: 'elixir', exs: 'elixir', erl: 'erlang', fs: 'fsharp', fsx: 'fsharp',
  gradle: 'groovy', groovy: 'groovy', sol: 'solidity', proto: 'protobuf', graphql: 'graphql',
  dockerfile: 'dockerfile', makefile: 'makefile', txt: 'text', csv: 'csv', env: 'dotenv',
}

export function languageFromFilename(filename: string): string {
  const base = filename.trim().split('/').pop()?.toLowerCase() ?? ''
  if (base === 'dockerfile' || base.startsWith('dockerfile.')) return 'dockerfile'
  if (base === 'makefile') return 'makefile'
  const extension = base.includes('.') ? base.split('.').pop() ?? '' : ''
  return LANGUAGE_BY_EXTENSION[extension] ?? (extension || 'text')
}

export function normalizeWorkspaceFilename(value: string): string | null {
  const name = value.trim().replace(/\\/g, '/').replace(/^\/+/, '').slice(0, 100)
  if (!name || name.includes('..') || /[<>:"|?*\u0000-\u001f]/.test(name) || name.endsWith('/')) return null
  return name
}

export function starterFilesFor(kind: ProjectKind): WorkspaceFile[] {
  if (kind === 'web') return [
    { name: 'index.html', language: 'html', content: '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1" />\n  <link rel="stylesheet" href="styles.css" />\n  <title>New Vurenn project</title>\n</head>\n<body>\n  <main>\n    <p class="eyebrow">VURENN WORKSPACE</p>\n    <h1>Build something remarkable.</h1>\n    <button id="action">Start</button>\n  </main>\n  <script src="script.js"></script>\n</body>\n</html>' },
    { name: 'styles.css', language: 'css', content: ':root { font-family: Inter, system-ui, sans-serif; color-scheme: dark; }\n* { box-sizing: border-box; }\nbody { margin: 0; min-height: 100vh; display: grid; place-items: center; color: #eef4ff; background: radial-gradient(circle at 50% 0%, #173153, #070b12 58%); }\nmain { width: min(680px, 88vw); padding: 48px; border: 1px solid #ffffff1f; border-radius: 28px; background: #0d1522cc; box-shadow: 0 28px 90px #0009; }\n.eyebrow { color: #79a7ff; letter-spacing: .18em; font-size: 12px; }\nh1 { font-size: clamp(38px, 7vw, 68px); line-height: .98; letter-spacing: -.05em; }\nbutton { border: 0; border-radius: 12px; padding: 12px 18px; color: white; background: #4f7bff; cursor: pointer; }' },
    { name: 'script.js', language: 'javascript', content: "document.querySelector('#action')?.addEventListener('click', (event) => {\n  event.currentTarget.textContent = 'Ready';\n  console.log('Project is running.');\n});" },
  ]
  if (kind === 'api') return [
    { name: 'app.py', language: 'python', content: 'from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/health")\ndef health():\n    return {"status": "ok"}\n' },
    { name: 'requirements.txt', language: 'text', content: 'fastapi\nuvicorn[standard]\n' },
    { name: 'README.md', language: 'markdown', content: '# API service\n\nRun with `uvicorn app:app --reload`.\n' },
  ]
  if (kind === 'library') return [
    { name: 'src/index.ts', language: 'typescript', content: 'export function hello(name: string): string {\n  return `Hello, ${name}.`\n}\n' },
    { name: 'package.json', language: 'json', content: '{\n  "name": "new-library",\n  "version": "0.1.0",\n  "type": "module"\n}\n' },
    { name: 'README.md', language: 'markdown', content: '# New library\n\nDescribe the public API and examples here.\n' },
  ]
  if (kind === 'data') return [
    { name: 'analysis.py', language: 'python', content: 'import pandas as pd\n\n\ndef analyze(path: str) -> pd.DataFrame:\n    data = pd.read_csv(path)\n    return data.describe(include="all")\n' },
    { name: 'requirements.txt', language: 'text', content: 'pandas\nmatplotlib\n' },
    { name: 'README.md', language: 'markdown', content: '# Data project\n\nAdd a dataset, document its source, then define the questions to answer.\n' },
  ]
  return [
    { name: 'main.py', language: 'python', content: 'def main() -> None:\n    print("Ready to build.")\n\n\nif __name__ == "__main__":\n    main()\n' },
    { name: 'README.md', language: 'markdown', content: '# New project\n\nDescribe the goal, inputs, and expected result.\n' },
  ]
}

export function projectRecommendations(brief: ProjectBrief): string[] {
  const goal = brief.goal.trim() || 'the first useful version'
  const common = [`Define what “done” means for ${goal}.`, 'Build the smallest working path before adding polish.']
  const byKind: Record<ProjectKind, string[]> = {
    web: ['Sketch the main screen and user journey.', 'Run the browser preview and test mobile behavior.'],
    automation: ['List the inputs, outputs, and failure cases.', 'Test the script with a small real example.'],
    api: ['Define endpoints and response shapes.', 'Add validation, authentication, and health checks.'],
    data: ['Document data sources and clean a representative sample.', 'Choose the measurements and charts that answer the goal.'],
    library: ['Design the smallest public API.', 'Add usage examples and tests before expanding it.'],
    other: ['Choose the first runnable artifact.', 'Write down assumptions and verify the riskiest one.'],
  }
  return [...common, ...byKind[brief.kind]]
}

export function recommendedStackFor(kind: ProjectKind): string {
  return {
    web: 'TypeScript or JavaScript with HTML and CSS',
    automation: 'Python',
    api: 'Python with FastAPI',
    data: 'Python with pandas',
    library: 'TypeScript',
    other: 'Python for a flexible first prototype',
  }[kind]
}
