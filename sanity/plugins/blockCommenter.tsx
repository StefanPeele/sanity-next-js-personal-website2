import { useState } from 'react'
import { Box, Stack, Text } from '@sanity/ui'
import { definePlugin, useClient, type DocumentActionComponent, type DocumentActionProps } from 'sanity'
import { apiVersion } from '@/sanity/lib/api'
// sanity/plugins/blockCommenter.tsx — Phase 8.7's moderation workflow.
//
// The realistic bad night is a few hundred comments from a handful of addresses. The
// difference between that being a nuisance and being an evening is whether the work is one
// click per SPAMMER or one click per COMMENT, so this is the former.
//
// Blocking one commenter, in one transaction:
//   1. every comment from that address becomes `spam` -- kept, not deleted, so the thread
//      does not silently re-number itself and a reply underneath still makes sense
//   2. a `blocklist` document is written, which app/actions/comment.ts checks before it
//      writes anything
//
// A blocked address is then answered EXACTLY like a successful post. It learns nothing,
// retries nothing, and moves on.

const BlockAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const client = useClient({ apiVersion })
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const doc = (props.draft ?? props.published) as
    | { _id?: string; email?: string; ipHash?: string; authorName?: string }
    | null
  const email = doc?.email
  const ipHash = doc?.ipHash

  // Nothing to block: a comment with no address is a document that was hand-made in the
  // Studio, and the button would do nothing but look like it had.
  if (!email && !ipHash) return null

  const block = async () => {
    setBusy(true)
    try {
      await client
        .transaction()
        .create({
          _type: 'blocklist',
          ...(email ? { email } : {}),
          ...(ipHash ? { ipHash } : {}),
          reason: `Blocked from a comment by ${doc?.authorName || email || 'unknown'}`,
          createdAt: new Date().toISOString(),
        })
        .commit()

      // A second call rather than part of the transaction above: a mutation by QUERY cannot
      // be mixed with a create in one transaction body, and the order matters anyway --
      // the blocklist entry must exist before anything else, so a submission landing
      // mid-operation is refused rather than accepted.
      await client.mutate([
        {
          patch: {
            query: email
              ? '*[_type == "comment" && email == $email && status != "spam"]'
              : '*[_type == "comment" && ipHash == $ipHash && status != "spam"]',
            params: email ? { email } : { ipHash },
            set: { status: 'spam' },
          },
        },
      ] as Parameters<typeof client.mutate>[0])
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return {
    label: busy ? 'Blocking…' : 'Block this commenter',
    tone: 'critical',
    disabled: busy,
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'confirm' as const,
      tone: 'critical' as const,
      message: (
        <Stack space={4}>
          <Text size={1}>
            Every comment from {email ? <strong>{email}</strong> : 'this IP'} becomes spam and is
            removed from the site, and the address is blocked from commenting again.
          </Text>
          <Box>
            <Text size={1} muted>
              Comments are kept rather than deleted, so replies underneath them still make
              sense. To undo this, delete the entry under Comments → Blocked commenters.
            </Text>
          </Box>
        </Stack>
      ),
      onCancel: () => setOpen(false),
      onConfirm: block,
    },
  }
}

export const blockCommenterPlugin = definePlugin({
  name: 'blockCommenter',
  document: {
    actions: (prev, { schemaType }) => (schemaType === 'comment' ? [...prev, BlockAction] : prev),
  },
})
