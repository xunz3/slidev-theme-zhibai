import type {
  CompatibilityAssessment,
  DeckDeclaration,
  ThemeSupportDeclaration,
} from './protocol-compatibility'

interface NoticeElement {
  hidden: boolean
  textContent: string | null
  setAttribute(name: string, value: string): void
  removeAttribute(name: string): void
}

interface DocumentLike {
  readonly referrer?: string
  querySelector(selector: string): NoticeElement | null
}

interface LocationLike {
  readonly href: string
}

interface ParentLike {
  postMessage(message: unknown, targetOrigin: string): void
}

interface ProtocolMessageInput {
  readonly assessment: CompatibilityAssessment
  readonly deck: DeckDeclaration
  readonly support: ThemeSupportDeclaration
  readonly token: string
}

interface PostProtocolSupportInput {
  readonly assessment: CompatibilityAssessment
  readonly deck: DeckDeclaration
  readonly document: DocumentLike
  readonly location: LocationLike
  readonly parent: ParentLike
  readonly self: unknown
  readonly support: ThemeSupportDeclaration
}

interface InstallBridgeInput {
  readonly assess: (
    deck: unknown,
    support?: unknown,
  ) => CompatibilityAssessment
  readonly document?: DocumentLike
  readonly location?: LocationLike
  readonly parent?: ParentLike
  readonly rawProfile?: unknown
  readonly rawProtocol?: unknown
  readonly rawSupport?: unknown
  readonly self?: unknown
}

const NOTICE_SELECTOR = '.obsidian-slidev-compatibility'
const TOKEN_QUERY_KEY = 'obsidianSlidevToken'
const UNVERIFIED_MESSAGE =
  'Theme compatibility is unverified because no support declaration was received.'

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
)

const noticeFor = (documentLike: DocumentLike): NoticeElement | null => (
  documentLike.querySelector(NOTICE_SELECTOR)
)

export const applyProtocolCompatibilityNotice = (
  documentLike: DocumentLike,
  assessment: CompatibilityAssessment,
): boolean => {
  const notice = noticeFor(documentLike)
  if (!notice) return false

  notice.setAttribute('data-obsidian-slidev-status', assessment.status)
  notice.setAttribute('data-obsidian-slidev-consumer', 'lilas')
  notice.setAttribute('role', 'status')
  notice.setAttribute('aria-live', 'polite')
  notice.hidden = assessment.status === 'compatible'
  notice.textContent = assessment.status === 'incompatible'
    ? `Compatibility warning: ${assessment.message} Rendering continues with best-effort support.`
    : assessment.message
  return true
}

export const createProtocolSupportMessage = ({
  assessment,
  deck,
  support,
  token,
}: ProtocolMessageInput) => ({
  type: 'obsidian-slidev/protocol-support' as const,
  schemaVersion: 1 as const,
  token,
  deck: {
    core: deck.core,
    ...(deck.profile ? { profile: deck.profile } : {}),
  },
  support,
  assessment: {
    status: assessment.status,
    scope: assessment.scope,
    reasonCode: assessment.reasonCode,
  },
})

const targetOriginFor = (documentLike: DocumentLike): string => {
  if (!documentLike.referrer) return '*'
  try {
    const origin = new URL(documentLike.referrer).origin
    return origin === 'null' ? '*' : origin
  } catch {
    return '*'
  }
}

export const postProtocolSupport = ({
  assessment,
  deck,
  document: documentLike,
  location,
  parent,
  self,
  support,
}: PostProtocolSupportInput): boolean => {
  if (parent === self) return false
  let token: string | null
  try {
    token = new URL(location.href).searchParams.get(TOKEN_QUERY_KEY)
  } catch {
    return false
  }
  if (!token) return false
  parent.postMessage(
    createProtocolSupportMessage({
      assessment,
      deck,
      support,
      token,
    }),
    targetOriginFor(documentLike),
  )
  return true
}

const PROTOCOL_DECLARATION_KEYS = new Set([
  'id',
  'version',
])

export const normalizeRuntimeDeckDeclaration = (
  rawProtocol: unknown,
  rawProfile: unknown,
): unknown => {
  if (!isRecord(rawProtocol)) return rawProtocol

  if (
    Object.keys(rawProtocol).some(
      key => !PROTOCOL_DECLARATION_KEYS.has(key),
    )
  ) {
    return rawProtocol
  }

  return {
    core: {
      id: rawProtocol.id,
      version: rawProtocol.version,
    },
    ...(rawProfile === undefined ? {} : { profile: rawProfile }),
  }
}

export const installProtocolCompatibilityBridge = ({
  assess,
  document: documentLike = document,
  location: locationLike = window.location,
  parent = window.parent,
  rawProfile,
  rawProtocol,
  rawSupport,
  self = window,
}: InstallBridgeInput): (() => void) => {
  if (rawProtocol === undefined || rawProtocol === null) return () => undefined

  const deck = normalizeRuntimeDeckDeclaration(rawProtocol, rawProfile)
  let assessment: CompatibilityAssessment
  try {
    assessment = assess(deck, rawSupport)
  } catch (error) {
    console.warn(
      '[slidev-theme-lilas] Protocol compatibility check was skipped; rendering continues.',
      error,
    )
    return () => undefined
  }
  const parsedDeck = deck as DeckDeclaration
  const support = rawSupport as ThemeSupportDeclaration
  applyProtocolCompatibilityNotice(documentLike, assessment)
  postProtocolSupport({
    assessment,
    deck: parsedDeck,
    document: documentLike,
    location: locationLike,
    parent,
    self,
    support,
  })

  let active = true
  return () => {
    if (!active) return
    active = false
    const notice = noticeFor(documentLike)
    if (!notice) return
    notice.hidden = false
    notice.setAttribute('data-obsidian-slidev-status', 'unverified')
    notice.removeAttribute('data-obsidian-slidev-consumer')
    notice.textContent = UNVERIFIED_MESSAGE
  }
}
