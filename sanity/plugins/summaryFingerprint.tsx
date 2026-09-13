import { definePlugin, useDocumentOperation, type DocumentActionComponent, type DocumentActionProps } from 'sanity'
import { bodyHash, bodyPlainText } from '@/lib/summary'
// sanity/plugins/summaryFingerprint.tsx — PROPOSALS 5.6.
//
// A summary is shown only while its fingerprint matches the prose it describes. Something
// has to set that fingerprint, and it must be a deliberate act rather than a side effect of
// saving: the fingerprint is the author SAYING "this summary describes the post as it now
// stands". Writing it automatically on every save would make the check vacuous, because it
// would re-bless a stale summary the moment anyone touched a typo.
//
// So: write the summary, read it against the post, then press this.
//
// It also stamps `summaryAt`, which is the date a correction is compared against. The two
// always move together, and that is why one action sets both rather than two fields being
// maintained by hand and drifting apart.

const FingerprintAction: DocumentActionComponent = (props: DocumentActionProps) => {
  // `patch` comes from the document operations hook, not from the action props. Hooks run
  // before the early return below, which is why the guard is not above this line.
  const { patch } = useDocumentOperation(props.id, props.type)

  const doc = (props.draft ?? props.published) as
    | { summary?: string; summaryOfHash?: string; body?: unknown[] }
    | null

  const summary = (doc?.summary ?? '').trim()
  // No summary means nothing to fingerprint, and a button that does nothing but look like it
  // had is worse than no button.
  if (!summary) return null

  const current = bodyHash(bodyPlainText((doc?.body ?? []) as never))
  const alreadyCurrent = doc?.summaryOfHash === current

  return {
    label: alreadyCurrent ? 'Summary is current' : 'Fingerprint this summary',
    disabled: alreadyCurrent,
    title: alreadyCurrent
      ? 'This summary already matches the body. Nothing to do.'
      : 'Record that this summary describes the post as it now stands, and stamp the date corrections are measured against.',
    onHandle: () => {
      props.onComplete?.()
      // patch() goes through the document's own draft, so it participates in the normal
      // publish flow rather than writing behind it.
      patch.execute([{ set: { summaryOfHash: current, summaryAt: new Date().toISOString() } }])
    },
  }
}

export const summaryFingerprintPlugin = definePlugin({
  name: 'summary-fingerprint',
  document: {
    actions: (prev, context) =>
      context.schemaType === 'post' ? [...prev, FingerprintAction] : prev,
  },
})
