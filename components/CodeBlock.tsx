'use client'

import { useId, useMemo, useState } from 'react'
import { FOCUS } from '@/lib/ui'
// components/CodeBlock.tsx
// Code block from the Sanity code type: filename tab, copy button, line-number
// toggle and highlighted lines. Tokenising is a small regex pass — no dependency.

interface CodeValue {
  code?: string
  language?: string
  filename?: string
  highlightedLines?: number[]
  text?: string
}

type TokenKind = 'comment' | 'string' | 'keyword' | 'number' | 'prompt' | 'plain'
interface Token { kind: TokenKind; text: string }

const KEYWORDS = new Set([
  // Cisco IOS / network CLI
  'interface', 'router', 'ip', 'ipv6', 'address', 'no', 'shutdown', 'vlan', 'switchport', 'mode', 'trunk', 'access',
  'ospf', 'bgp', 'eigrp', 'network', 'area', 'neighbor', 'route', 'route-map', 'access-list', 'permit', 'deny',
  'configure', 'terminal', 'show', 'enable', 'exit', 'end', 'hostname', 'description', 'spanning-tree', 'channel-group',
  'encapsulation', 'dot1q', 'native', 'default-gateway', 'name', 'crypto', 'key', 'username', 'password', 'secret',
  // shells + PowerShell
  'sudo', 'apt', 'yum', 'systemctl', 'echo', 'export', 'if', 'then', 'else', 'fi', 'for', 'do', 'done', 'while',
  'function', 'return', 'param', 'foreach', 'in', 'Get-', 'Set-', 'New-', 'Remove-',
  // general programming
  'const', 'let', 'var', 'import', 'from', 'export', 'default', 'class', 'def', 'async', 'await', 'try', 'catch',
  'finally', 'switch', 'case', 'break', 'continue', 'new', 'this', 'true', 'false', 'null', 'None', 'True', 'False',
  'print', 'with', 'as', 'elif', 'lambda', 'yield', 'type', 'struct', 'public', 'private', 'static', 'void', 'int',
  'string', 'bool', 'select', 'where', 'and', 'or', 'not', 'insert', 'update', 'delete',
])

const TOKEN_RE = /(#.*|\/\/.*|!.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)*(?:\/\d+)?\b)|([A-Za-z][\w-]*)|(\s+|[^\sA-Za-z\d"'#/!]+|[\/!#])/gm

function tokenizeLine(line: string, language: string): Token[] {
  const tokens: Token[] = []
  const isShellish = /^(sh|bash|shell|zsh|console|terminal|cisco|ios|powershell|ps1|text)$/i.test(language) || language === ''
  // Prompt prefix: "$ ", "R1# ", "Switch(config)# ", "PS C:\> "
  const promptMatch = isShellish ? line.match(/^(\$ |> |[\w()\-./]+[#>] |PS [^>]*> )/) : null
  let rest = line
  if (promptMatch) {
    tokens.push({ kind: 'prompt', text: promptMatch[1] })
    rest = line.slice(promptMatch[1].length)
  }
  TOKEN_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TOKEN_RE.exec(rest)) !== null) {
    if (m[0] === '') { TOKEN_RE.lastIndex++; continue }
    if (m[1] !== undefined) {
      // "!" is a comment only in IOS-style configs; "//" only in code; "#" in both shells and Python.
      const isBang = m[1].startsWith('!')
      const isSlash = m[1].startsWith('//')
      const commentOk = isBang ? /cisco|ios|text|^$/i.test(language) : isSlash ? !isShellish : true
      tokens.push({ kind: commentOk ? 'comment' : 'plain', text: m[1] })
      if (commentOk) break
    } else if (m[2] !== undefined) tokens.push({ kind: 'string', text: m[2] })
    else if (m[3] !== undefined) tokens.push({ kind: 'number', text: m[3] })
    else if (m[4] !== undefined) tokens.push({ kind: KEYWORDS.has(m[4]) ? 'keyword' : 'plain', text: m[4] })
    else tokens.push({ kind: 'plain', text: m[0] })
  }
  return tokens
}

const KIND_CLASS: Record<TokenKind, string> = {
  comment: 'text-stone-400 italic',
  string: 'text-emerald-300',
  keyword: 'text-sky-300',
  number: 'text-amber-300',
  prompt: 'text-stone-400 select-none',
  plain: '',
}

export function CodeBlock({ value }: { value: CodeValue }) {
  const [copied, setCopied] = useState(false)
  const [numbers, setNumbers] = useState(true)
  const id = useId()

  const code = value?.code ?? value?.text ?? ''
  const language = (value?.language ?? '').toLowerCase()
  const highlighted = useMemo(() => new Set(value?.highlightedLines ?? []), [value?.highlightedLines])
  const lines = useMemo(() => code.replace(/\n$/, '').split('\n').map((l) => tokenizeLine(l, language)), [code, language])

  const handleCopy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  const gutterWidth = String(lines.length).length

  return (
    <figure className="article-light-invert relative my-8 rounded-lg bg-[#0a0a0a] border border-white/10 overflow-hidden shadow-2xl not-prose" data-no-toc>
      <figcaption className="flex items-center justify-between gap-3 px-3 py-2 bg-[#111] border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          {value?.filename ? (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-t-md bg-[#0a0a0a] border border-b-0 border-white/10 font-mono text-[11px] text-stone-200 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" aria-hidden="true" />
              {value.filename}
            </span>
          ) : null}
          <span className="font-mono text-[10px] text-stone-400 uppercase tracking-widest">
            {value?.language || 'terminal'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setNumbers((n) => !n)}
            aria-pressed={numbers}
            aria-controls={id}
            className={`px-2 py-1.5 rounded font-mono text-[10px] uppercase tracking-widest text-stone-400 hover:text-white hover:bg-white/5 transition-colors ${FOCUS}`}
          >
            Lines
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={`px-2 py-1.5 rounded font-mono text-[10px] uppercase tracking-widest text-stone-400 hover:text-white hover:bg-white/5 transition-colors ${FOCUS}`}
            aria-live="polite"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </figcaption>
      <pre id={id} className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-stone-300" tabIndex={0}>
        <code>
          {lines.map((tokens, i) => {
            const n = i + 1
            const hl = highlighted.has(n)
            return (
              <span
                key={n}
                className={`block -mx-4 px-4 ${hl ? 'bg-amber-400/10 border-l-2 border-amber-400' : 'border-l-2 border-transparent'}`}
              >
                {numbers && (
                  <span
                    aria-hidden="true"
                    className="inline-block select-none text-right text-stone-600 pr-4"
                    style={{ width: `${gutterWidth + 1}ch` }}
                  >
                    {n}
                  </span>
                )}
                {tokens.length === 0 ? ' ' : tokens.map((t, j) => (
                  <span key={j} className={KIND_CLASS[t.kind]}>{t.text}</span>
                ))}
              </span>
            )
          })}
        </code>
      </pre>
    </figure>
  )
}
