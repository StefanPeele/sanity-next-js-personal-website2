import { useCallback, useEffect, useState } from 'react'
import { Box, Button, Card, Flex, Stack, Text, TextInput } from '@sanity/ui'
import { definePlugin, type DocumentActionComponent, type DocumentActionProps } from 'sanity'
// sanity/plugins/digestSender.tsx — PROPOSALS 9.3.
//
// A Studio action, not a CLI command and not a protected route. The document you just wrote
// is the one thing you have in front of you, and every other option makes you name it again
// somewhere else. The blockCommenter action from 8.7 is the same shape.
//
// THE DIALOG CARRIES THE NUMBER. "Send to 41 confirmed subscribers?" is a different question
// from "Send?", and it is the last chance to notice that the number is 0 because the query
// is wrong, or 4,000 because it was not filtered.
//
// The secret is asked for and kept in the Studio's own localStorage. It never ships in a
// bundle, and it is a second pair of hands on the trigger: sending is the first irreversible
// action on this site, so it should not be reachable by one misclick.

const KEY = 'sp_digest_secret'

const SendAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const [open, setOpen] = useState(false)
  const [secret, setSecret] = useState('')
  const [count, setCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const doc = (props.draft ?? props.published) as
    | { _id?: string; title?: string; sentAt?: string; entries?: unknown[] }
    | null

  useEffect(() => {
    if (!open) return
    try { setSecret(localStorage.getItem(KEY) ?? '') } catch { /* private mode */ }
  }, [open])

  const loadCount = useCallback(async (s: string) => {
    setMessage(null)
    try {
      const res = await fetch('/api/digest/send', { headers: { 'x-digest-secret': s } })
      if (!res.ok) { setCount(null); setMessage(res.status === 401 ? 'That secret was not accepted.' : 'Could not read the subscriber count.'); return }
      const json = await res.json()
      setCount(json.count ?? null)
      try { localStorage.setItem(KEY, s) } catch { /* private mode */ }
    } catch { setMessage('Could not reach the send endpoint.') }
  }, [])

  useEffect(() => { if (open && secret) void loadCount(secret) }, [open, secret, loadCount])

  const post = async (payload: Record<string, unknown>) => {
    setBusy(true)
    setMessage(null)
    try {
      const res = await fetch('/api/digest/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-digest-secret': secret },
        body: JSON.stringify({ digestId: (doc?._id ?? '').replace(/^drafts\./, ''), ...payload }),
      })
      const json = await res.json()
      setMessage(res.ok
        ? (json.test ? `Test sent to ${json.to}. Open it in a real client before you send for real.` : `Sent to ${json.sent} of ${json.of}${json.failed ? `, ${json.failed} failed` : ''}.`)
        : (json.message ?? 'Send failed.'))
      if (res.ok && !json.test) props.onComplete?.()
    } catch (e) {
      setMessage(String(e))
    } finally {
      setBusy(false)
    }
  }

  const alreadySent = Boolean(doc?.sentAt)
  const hasEntries = (doc?.entries?.length ?? 0) > 0

  return {
    label: alreadySent ? 'Sent' : 'Send digest',
    tone: 'positive',
    disabled: alreadySent || !hasEntries,
    title: alreadySent
      ? `Sent on ${String(doc?.sentAt).slice(0, 10)}. A digest is sent once.`
      : hasEntries ? 'Send this digest to every confirmed subscriber.' : 'Add at least one entry first.',
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'dialog' as const,
      onClose: () => { setOpen(false); setMessage(null) },
      header: 'Send this digest',
      content: (
        <Stack space={4}>
          <Card padding={3} radius={2} tone="caution">
            <Text size={1}>
              Sending is the only thing on this site that cannot be undone. There is no recall
              and no edit-after-send.
            </Text>
          </Card>

          <Stack space={3}>
            <Text size={1} weight="medium">Send secret</Text>
            <TextInput
              type="password"
              value={secret}
              placeholder="DIGEST_SEND_SECRET"
              onChange={(e) => setSecret(e.currentTarget.value)}
              onBlur={() => secret && loadCount(secret)}
            />
          </Stack>

          <Card padding={3} radius={2} tone={count === null ? 'default' : count === 0 ? 'critical' : 'primary'}>
            <Text size={2} weight="semibold">
              {count === null ? 'Enter the secret to read the subscriber count.' : `Send to ${count} confirmed subscriber${count === 1 ? '' : 's'}?`}
            </Text>
          </Card>

          {message && (
            <Card padding={3} radius={2} tone="transparent" border>
              <Text size={1}>{message}</Text>
            </Card>
          )}

          <Flex gap={2}>
            {/* The preview path. Same handler, same renderer, one recipient. Not a preview
                PAGE: the thing being previewed is an HTML email, and the only honest preview
                of one is an HTML email in a real client. */}
            <Button
              mode="ghost"
              text="Send test to me"
              disabled={busy || !secret}
              onClick={() => post({ test: true })}
            />
            <Box flex={1} />
            <Button
              tone="critical"
              text={busy ? 'Sending…' : `Send to ${count ?? '…'}`}
              disabled={busy || !secret || !count}
              onClick={() => post({})}
            />
          </Flex>
        </Stack>
      ),
    },
  }
}

export const digestSenderPlugin = definePlugin({
  name: 'digest-sender',
  document: {
    actions: (prev, context) => (context.schemaType === 'digest' ? [...prev, SendAction] : prev),
  },
})
