export type AuthorPrimarySource = 'name' | 'email' | 'institution'

export type PresentationAuthor = {
  primary: string
  primarySource: AuthorPrimarySource
  primaryHref?: string
  institution?: string
  email?: string
  emailHref?: string
  sourceIndex: number
}

const normalizeText = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}

export const isActionableEmail = (value: unknown): value is string => {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+$/.test(value)
}

export const normalizeAuthor = (
  value: unknown,
  sourceIndex = 0,
): PresentationAuthor | null => {
  if (typeof value === 'string') {
    const primary = normalizeText(value)
    return primary
      ? {
          primary,
          primarySource: 'name',
          sourceIndex,
        }
      : null
  }

  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  const name = normalizeText(record.name)
  const institution = normalizeText(record.institution)
  const email = normalizeText(record.email)

  if (!name && !institution && !email) return null

  const primarySource: AuthorPrimarySource = name
    ? 'name'
    : email
      ? 'email'
      : 'institution'
  const primary = name || email || institution
  const seen = new Set([primary])
  const retainedInstitution = institution && !seen.has(institution)
    ? institution
    : undefined
  if (retainedInstitution) seen.add(retainedInstitution)
  const retainedEmail = email && !seen.has(email) ? email : undefined
  const primaryHref = email === primary && isActionableEmail(email)
    ? `mailto:${email}`
    : undefined

  return {
    primary,
    primarySource,
    primaryHref,
    institution: retainedInstitution,
    email: retainedEmail,
    emailHref: retainedEmail && isActionableEmail(retainedEmail)
      ? `mailto:${retainedEmail}`
      : undefined,
    sourceIndex,
  }
}

export const normalizeAuthors = (value: unknown): PresentationAuthor[] => {
  if (Array.isArray(value)) {
    return value
      .map((author, index) => normalizeAuthor(author, index))
      .filter((author): author is PresentationAuthor => author !== null)
  }

  const author = normalizeAuthor(value, 0)
  return author ? [author] : []
}

export const resolveDeckAuthors = (
  configs: unknown,
): PresentationAuthor[] => {
  if (!configs || typeof configs !== 'object' || Array.isArray(configs)) return []
  const record = configs as Record<string, unknown>
  const plural = normalizeAuthors(record.authors)
  return plural.length > 0 ? plural : normalizeAuthors(record.author)
}

export const formatAuthorNames = (authors: PresentationAuthor[]): string => {
  return authors.map(author => author.primary).filter(Boolean).join(', ')
}
