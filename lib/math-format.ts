export function normalizeMathDelimiters(markdown: string): string {
  return markdown.split(/(```[\s\S]*?```|`[^`\n]*`)/g).map((part) => {
    if (part.startsWith('`')) return part
    return part
      .replace(/\\\[([\s\S]*?)\\\]/g, (_, expression: string) => `\n\n$$\n${expression.trim()}\n$$\n\n`)
      .replace(/\\\(([^\n]*?)\\\)/g, (_, expression: string) => `$${expression.trim()}$`)
  }).join('')
}
