// components/blog/BlogBackground.tsx — static ambient background for the archive shell.
// No animation, no cursor tracking: two soft radial tones over the base colour.

export function BlogBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-20 pointer-events-none bg-[#0a0a0a]"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(30,35,45,0.6) 0%, transparent 60%),' +
          'radial-gradient(ellipse 60% 40% at 80% 100%, rgba(25,28,35,0.5) 0%, transparent 60%)',
      }}
    />
  )
}
