// components/PageTransition.tsx
// CSS-only route enter animation. app/template.tsx remounts this on every navigation,
// so the keyframe replays per route. `motion-safe:` keeps it off for reduced-motion users.
// No framer-motion: the old `exit` variant never fired (no AnimatePresence) and the
// client boundary made every page a client tree.

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return <div className="motion-safe:animate-page-enter">{children}</div>
}
