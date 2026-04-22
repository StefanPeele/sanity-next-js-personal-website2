'use client'

import { useState, useEffect } from 'react'

const API = 'https://email-tracker-bmuo.onrender.com'

interface Email {
  id: string
  recipient: string
  sender: string
  subject: string
  created_at: string
  opens: number
  clicks: number
  first_opened_at: string | null
}

interface Event {
  id: number
  event_type: 'open' | 'click'
  link_url: string | null
  ip: string
  user_agent: string
  timestamp: string
}

export default function TrackerDashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [emails, setEmails] = useState<Email[]>([])
  const [selected, setSelected] = useState<Email | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(false)

  // Check auth from localStorage
  useEffect(() => {
    const auth = localStorage.getItem('tracker_auth')
    setAuthed(auth === 'true')
    if (auth === 'true') fetchEmails()
  }, [])

  async function fetchEmails() {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/emails`)
      const data = await res.json()
      setEmails(data.emails ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function fetchEvents(emailId: string) {
    setEventsLoading(true)
    try {
      const res = await fetch(`${API}/api/emails/${emailId}/events`)
      const data = await res.json()
      setEvents(data.events ?? [])
    } finally {
      setEventsLoading(false)
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const correct = process.env.NEXT_PUBLIC_TRACKER_PASSWORD
    // Simple client-side check — real protection is the env var
    if (password === (correct ?? 'changeme')) {
      localStorage.setItem('tracker_auth', 'true')
      setAuthed(true)
      setError(false)
      fetchEmails()
    } else {
      setError(true)
    }
  }

  function handleLogout() {
    localStorage.removeItem('tracker_auth')
    setAuthed(false)
    setEmails([])
    setSelected(null)
  }

  function selectEmail(email: Email) {
    setSelected(email)
    fetchEvents(email.id)
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—'
    return new Date(dateStr + ' UTC').toLocaleString()
  }

  function parseUA(ua: string) {
    if (!ua) return 'Unknown'
    if (ua.includes('iPhone') || ua.includes('iPad')) return '📱 iOS'
    if (ua.includes('Android')) return '📱 Android'
    if (ua.includes('Mac')) return '💻 Mac'
    if (ua.includes('Windows')) return '🖥️ Windows'
    if (ua.includes('curl')) return '⚙️ curl'
    return '🌐 Browser'
  }

  // ── Login screen ───────────────────────────────────────────────────────
  if (authed === null) return null // hydrating

  if (!authed) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"IBM Plex Mono", monospace',
      }}>
        <div style={{
          width: 360,
          padding: '2.5rem',
          border: '1px solid #222',
          background: '#111',
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.2em', marginBottom: 8 }}>STEFANPEELE.COM</div>
            <div style={{ fontSize: 22, color: '#fff', fontWeight: 600 }}>tracker</div>
            <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>private access only</div>
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0a0a0a',
                border: `1px solid ${error ? '#ef4444' : '#2a2a2a'}`,
                color: '#fff',
                fontSize: 14,
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '0.75rem',
              }}
            />
            {error && (
              <div style={{ fontSize: 12, color: '#ef4444', marginBottom: '0.75rem' }}>
                incorrect password
              </div>
            )}
            <button type="submit" style={{
              width: '100%',
              padding: '0.75rem',
              background: '#fff',
              color: '#000',
              border: 'none',
              fontSize: 13,
              fontFamily: 'inherit',
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}>
              ENTER →
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Dashboard ──────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#ccc',
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: 13,
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #1a1a1a',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ color: '#555', fontSize: 11, letterSpacing: '0.2em' }}>STEFANPEELE.COM / </span>
          <span style={{ color: '#fff', fontWeight: 600 }}>EMAIL TRACKER</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={fetchEmails} style={{
            background: 'none', border: '1px solid #222', color: '#555',
            padding: '0.4rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 11, letterSpacing: '0.1em',
          }}>
            ↻ REFRESH
          </button>
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', color: '#333',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 11,
          }}>
            logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 57px)' }}>

        {/* ── Left: Email list ── */}
        <div style={{
          width: selected ? '45%' : '100%',
          borderRight: selected ? '1px solid #1a1a1a' : 'none',
          overflowY: 'auto',
          transition: 'width 0.2s',
        }}>
          {/* Stats bar */}
          <div style={{
            padding: '1rem 2rem',
            borderBottom: '1px solid #1a1a1a',
            display: 'flex',
            gap: '2rem',
          }}>
            <Stat label="TRACKED" value={emails.length} />
            <Stat label="OPENED" value={emails.filter(e => e.opens > 0).length} />
            <Stat label="CLICKED" value={emails.filter(e => e.clicks > 0).length} />
            <Stat label="UNOPENED" value={emails.filter(e => e.opens === 0).length} />
          </div>

          {/* Table header */}
          <div style={{
            padding: '0.6rem 2rem',
            borderBottom: '1px solid #1a1a1a',
            display: 'grid',
            gridTemplateColumns: '2fr 1.5fr 60px 60px 1.5fr',
            gap: '1rem',
            color: '#444',
            fontSize: 11,
            letterSpacing: '0.15em',
          }}>
            <div>SUBJECT</div>
            <div>TO</div>
            <div>OPENS</div>
            <div>CLICKS</div>
            <div>FIRST OPENED</div>
          </div>

          {loading && (
            <div style={{ padding: '3rem 2rem', color: '#333', textAlign: 'center' }}>
              loading...
            </div>
          )}

          {!loading && emails.length === 0 && (
            <div style={{ padding: '3rem 2rem', color: '#333', textAlign: 'center' }}>
              no tracked emails yet
            </div>
          )}

          {emails.map(email => (
            <div
              key={email.id}
              onClick={() => selectEmail(email)}
              style={{
                padding: '0.9rem 2rem',
                borderBottom: '1px solid #111',
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 60px 60px 1.5fr',
                gap: '1rem',
                cursor: 'pointer',
                background: selected?.id === email.id ? '#141414' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                if (selected?.id !== email.id)
                  (e.currentTarget as HTMLDivElement).style.background = '#0f0f0f'
              }}
              onMouseLeave={e => {
                if (selected?.id !== email.id)
                  (e.currentTarget as HTMLDivElement).style.background = 'transparent'
              }}
            >
              <div style={{ color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email.subject}
              </div>
              <div style={{ color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email.recipient}
              </div>
              <div style={{ color: email.opens > 0 ? '#4ade80' : '#333' }}>
                {email.opens > 0 ? `●  ${email.opens}` : '○  0'}
              </div>
              <div style={{ color: email.clicks > 0 ? '#60a5fa' : '#333' }}>
                {email.clicks > 0 ? `●  ${email.clicks}` : '○  0'}
              </div>
              <div style={{ color: '#444', fontSize: 11 }}>
                {email.first_opened_at ? formatDate(email.first_opened_at) : '—'}
              </div>
            </div>
          ))}
        </div>

        {/* ── Right: Event drilldown ── */}
        {selected && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>
                  {selected.subject}
                </div>
                <div style={{ color: '#444', fontSize: 11 }}>
                  to: {selected.recipient} · sent: {formatDate(selected.created_at)}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{
                background: 'none', border: 'none', color: '#333',
                cursor: 'pointer', fontSize: 18, lineHeight: 1,
              }}>✕</button>
            </div>

            {/* Summary pills */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Pill label="opens" value={selected.opens} color="#4ade80" />
              <Pill label="clicks" value={selected.clicks} color="#60a5fa" />
            </div>

            {/* Event log */}
            <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.15em', marginBottom: '0.75rem' }}>
              EVENT LOG
            </div>

            {eventsLoading && (
              <div style={{ color: '#333', padding: '1rem 0' }}>loading events...</div>
            )}

            {!eventsLoading && events.length === 0 && (
              <div style={{ color: '#333', padding: '1rem 0' }}>no events recorded yet</div>
            )}

            {events.map(event => (
              <div key={event.id} style={{
                padding: '0.75rem 1rem',
                marginBottom: '0.5rem',
                background: '#111',
                border: `1px solid ${event.event_type === 'open' ? '#1a2e1a' : '#1a1e2e'}`,
                borderLeft: `3px solid ${event.event_type === 'open' ? '#4ade80' : '#60a5fa'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{
                    color: event.event_type === 'open' ? '#4ade80' : '#60a5fa',
                    fontWeight: 600,
                    fontSize: 11,
                    letterSpacing: '0.1em',
                  }}>
                    {event.event_type.toUpperCase()}
                  </span>
                  <span style={{ color: '#444', fontSize: 11 }}>
                    {formatDate(event.timestamp)}
                  </span>
                </div>
                <div style={{ color: '#555', fontSize: 11 }}>
                  {parseUA(event.user_agent)} · {event.ip}
                </div>
                {event.link_url && (
                  <div style={{
                    marginTop: 4, color: '#3b82f6', fontSize: 11,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    → {event.link_url}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.15em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, color: '#fff', fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function Pill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      padding: '0.4rem 0.8rem',
      border: `1px solid ${color}33`,
      color,
      fontSize: 12,
    }}>
      {value} {label}
    </div>
  )
}
