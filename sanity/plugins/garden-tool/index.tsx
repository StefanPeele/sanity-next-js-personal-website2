import { useEffect, useState } from 'react'
import { definePlugin, useClient, type Tool } from 'sanity'
import { Box, Card, Flex, Grid, Heading, Spinner, Stack, Text } from '@sanity/ui'
import { gardenHealthQuery } from '@/sanity/lib/queries-knowledge'
import type { GardenHealthQueryResult } from '@/sanity.types'
// sanity/plugins/garden-tool/index.tsx
// "Garden health" Studio tool: seedling count, notes untended > 60 days,
// posts without tags, orphan notes and unused tags. Read-only; links open the document.

const UNTENDED_DAYS = 60
const API_VERSION = '2025-02-27'

function daysAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

function DocLink({ type, id, children }: { type: string; id: string; children: React.ReactNode }) {
  const clean = id.replace(/^drafts\./, '')
  return (
    <a href={`/studio/structure/${type};${clean}`} style={{ color: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>
      {children}
    </a>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'positive' | 'caution' | 'critical' }) {
  return (
    <Card padding={4} radius={3} shadow={1} tone={tone}>
      <Stack space={3}>
        <Heading size={4}>{value}</Heading>
        <Text size={1} muted>{label}</Text>
      </Stack>
    </Card>
  )
}

function Section<T>({ title, items, empty, render }: { title: string; items: T[]; empty: string; render: (item: T) => React.ReactNode }) {
  return (
    <Card padding={4} radius={3} shadow={1}>
      <Stack space={4}>
        <Flex align="center" justify="space-between">
          <Heading size={1}>{title}</Heading>
          <Text size={1} muted>{items.length}</Text>
        </Flex>
        {items.length === 0 ? (
          <Text size={1} muted>{empty}</Text>
        ) : (
          <Stack space={3}>{items.map(render)}</Stack>
        )}
      </Stack>
    </Card>
  )
}

function GardenHealth() {
  const client = useClient({ apiVersion: API_VERSION })
  const [data, setData] = useState<GardenHealthQueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const cutoff = new Date(Date.now() - UNTENDED_DAYS * 86400000).toISOString()
    client
      .fetch(gardenHealthQuery, { cutoff })
      .then((d) => { if (!cancelled) setData(d) })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load garden health') })
    return () => { cancelled = true }
  }, [client])

  if (error) {
    return (
      <Box padding={5}>
        <Card padding={4} tone="critical" radius={3}><Text>{error}</Text></Card>
      </Box>
    )
  }
  if (!data) {
    return (
      <Flex align="center" justify="center" padding={6}>
        <Spinner muted />
      </Flex>
    )
  }

  const total = data.seedlings + data.growing + data.evergreen

  return (
    <Box padding={5}>
      <Stack space={5}>
        <Stack space={3}>
          <Heading size={3}>Garden health</Heading>
          <Text size={1} muted>
            {total} notes. Seedlings are fine — a garden with no seedlings is not growing. Untended notes and untagged posts are the things worth a pass.
          </Text>
        </Stack>

        <Grid columns={[2, 3, 5]} gap={3}>
          <Stat label="Seedlings" value={data.seedlings} />
          <Stat label="Growing" value={data.growing} />
          <Stat label="Evergreen" value={data.evergreen} tone="positive" />
          <Stat label={`Untended > ${UNTENDED_DAYS} days`} value={data.untended.length} tone={data.untended.length ? 'caution' : undefined} />
          <Stat label="Posts without tags" value={data.postsWithoutTags.length} tone={data.postsWithoutTags.length ? 'caution' : undefined} />
        </Grid>

        <Grid columns={[1, 1, 2]} gap={3}>
          <Section
            title={`Untended for more than ${UNTENDED_DAYS} days`}
            items={data.untended}
            empty="Everything has been touched recently."
            render={(n) => (
              <Flex key={n._id} justify="space-between" gap={3}>
                <Text size={1}><DocLink type="note" id={n._id}>{n.title ?? 'Untitled'}</DocLink></Text>
                <Text size={1} muted>{n.status} · {daysAgo(n.lastTended)} d</Text>
              </Flex>
            )}
          />
          <Section
            title="Posts without tags"
            items={data.postsWithoutTags}
            empty="Every post is tagged."
            render={(p) => (
              <Text key={p._id} size={1}><DocLink type="post" id={p._id}>{p.title ?? 'Untitled'}</DocLink></Text>
            )}
          />
          <Section
            title="Orphan notes (no links in or out)"
            items={data.orphanNotes}
            empty="Every note is connected to something."
            render={(n) => (
              <Flex key={n._id} justify="space-between" gap={3}>
                <Text size={1}><DocLink type="note" id={n._id}>{n.title ?? 'Untitled'}</DocLink></Text>
                <Text size={1} muted>{n.status}</Text>
              </Flex>
            )}
          />
          <Section
            title="Unused tags"
            items={data.unusedTags}
            empty="Every tag is in use."
            render={(t) => (
              <Text key={t._id} size={1}><DocLink type="tag" id={t._id}>#{t.title ?? 'untitled'}</DocLink></Text>
            )}
          />
        </Grid>
      </Stack>
    </Box>
  )
}

export const gardenTool = (): Tool => ({
  name: 'garden-health',
  title: 'Garden health',
  icon: () => '🌱',
  component: GardenHealth,
})

export const gardenToolPlugin = definePlugin({
  name: 'garden-tool',
  tools: (prev) => [...prev, gardenTool()],
})
