const escapeAttribute = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

// Resolve the source line before Markdown folds soft breaks into spaces.
// Compilation through Callout keeps Vue updates, labels and exports identical
// to component authoring without reparenting rendered DOM nodes.
export function transformQuotationAnnotations(markdown: string): string {
  const lines = markdown.split('\n')
  const output: string[] = []
  let fence: { character: string, length: number } | undefined
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (delimiter) {
      const run = delimiter[1]
      if (!fence) fence = { character: run[0], length: run.length }
      else if (run[0] === fence.character && run.length >= fence.length && !line.slice(delimiter[0].length).trim()) fence = undefined
      output.push(line)
      continue
    }
    const marker = !fence && line.match(/^ {0,3}>[\t ]?\[!(cite|quote)\][\t ]*(.*)$/i)
    // An annotation starts a blockquote, not a later paragraph in ordinary prose.
    const continuation = index > 0 && /^ {0,3}>/.test(lines[index - 1])
    if (!marker || continuation) {
      output.push(line)
      continue
    }
    const body: string[] = []
    while (index + 1 < lines.length && /^ {0,3}>/.test(lines[index + 1])) {
      body.push(lines[++index].replace(/^ {0,3}>[\t ]?/, ''))
    }
    output.push('', `<Callout type="${marker[1].toLowerCase()}" title="${escapeAttribute(marker[2])}">`, '', ...body, '', '</Callout>', '')
  }
  return output.join('\n')
}
