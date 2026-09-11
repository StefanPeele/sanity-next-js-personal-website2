---
name: verification-protocol
description: The verification checklist for stefanpeele.com — what "done" requires before a change is marked shipped, plus the logged measurement traps that have produced false findings on this project. Use before publishing any number, marking any item done, or concluding that something is broken.
---

# Verification protocol

Two parts: **what to run** before calling something done, and **what not to trust** when it
gives you a number.

The trap list is not general advice. Every entry is a false finding this project actually
produced and then had to withdraw.

---

## Part 1 — what "done" requires

An item is not shipped until all of these hold.

- [ ] **`npm run check` exits 0 with ZERO WARNINGS.** Not zero errors — zero warnings.
      Remove orphaned code rather than suppressing it.
- [ ] **Clean build**: kill any server on the port **first**, then `rm -rf .next && npm run build`.
- [ ] **Full Playwright suite, 35 tests.** (33 originally; Phase 0.1 added the reading-time
      agreement test, Phase 3 added the every-post h1 test.) **If it reports any other number, investigate — do not re-run until
      it agrees.** A suite that silently skips is worse than one that fails.
- [ ] **Before/after screenshots at 1440 / 768 / 390** for any visual change, committed,
      with what moved stated in pixels. `docs/audit/capture-change.mjs`.
- [ ] **Verified live on production after deploy**, not just locally. Poll `/api/health`
      until it reports your commit hash.
- [ ] **Independently verified** by the `verifier` subagent for anything that ships code or
      changes a rendered number. Give it the *claim*, never the implementation. Skip it for
      pure documentation commits.
- [ ] `OVERHAUL-PROGRESS.md` updated **as the item completes**, not at session end,
      including the `Verified by` column.

**If the verifier disagrees with your own result, the verifier's result stands** until you
can show its measurement is wrong. Log both. A disagreement is a finding either way.

---

## Part 2 — the traps

### Measurement method

1. **`el.focus()` does not reliably match `:focus-visible`.** Chromium gates it on input
   modality. Valid for an A/B where both sides share the bias; never for an absolute claim.
   Use real `keyboard.press('Tab')`.
2. **Composite alpha before computing contrast.** Reading the first non-transparent ancestor
   background gave `rgba(255,255,255,0.02)` scored as near-white → **322 false low-contrast
   findings; the true count was 4.**
3. **`sr-only` and `.truncate` register as clipped.** Excluding only `overflow:auto|scroll`
   gave **105 false, 0 real**.
4. **Deduped counts and raw element counts are different metrics.** Comparing them produced
   a phantom focus-ring regression across 10 of 12 routes. The counts went *up* — which no
   regression does. That asymmetry is the tell.
5. **De-duplicating by accessible name is lossy where names repeat.** Key on DOM index.
6. **Element scans miss text nodes; text-node walks miss split text.** JSX renders
   `{n} min` as `"3"` + `" min"` — neither matches. A `<span>` with siblings is not a leaf.
   Both produced false zeros on the same page. **`document.body.innerText` is
   structure-independent** and is the method to use for "does this string render".

### Shell and tooling

7. **`sed -n '/start/,/^$/p'` stops at the first terminator** and made a populated section
   look empty. Use explicit line ranges.
8. **`grep -P` is unsupported here** and returns zeros that look like findings.
9. **Shell escaping eats backslashes in bracket patterns.** `grep 'min-h-\[32px\]'` returned
   0 for eight utilities that were all present. Use `grep -F` or Python `str.find`.
10. **Bare greps of numbers match minified JS.** "165 min read" was `165.` in a shared chunk.
11. **A pattern that assumes a shape misses everything shaped differently.** Requiring quotes
    tight around a word missed 6 of 20 strings, three user-visible.
12. **Python `[^"]*` matches newlines** — corrupted 12 files in one pass. Operate line-scoped
    and assert line-count parity per file before writing.
13. **`MSYS_NO_PATHCONV=1`** when passing a route to a node script from Git Bash, or `/blog`
    becomes `C:/Program Files/Git/blog`.
14. **Two heredocs in one Bash call fail**, cleanly, writing nothing. Write long content to a
    file and `cat` it on.

### The environment lying to you

15. **A stale `next start` + `reuseExistingServer` fabricates failures** on untouched routes.
    Symptom: `Refused to execute script … MIME type ('text/plain') is not executable`.
    **Compare the served CSS chunk hash against `.next/static/chunks/*.css`.**
16. **Kill the server BEFORE `rm -rf .next`.**
17. **`.next/cache/fetch-cache` survives a rebuild.** After a Sanity patch the page can still
    render old content while the dataset already returns the new value on `api` *and*
    `apicdn`. **Check the dataset before concluding a content patch failed.**
18. **Default GROQ perspective excludes drafts.** Empty and permission-filtered look
    identical. State `perspective` explicitly; `raw` shows drafts and published together.
19. **Stopping a background build does not reap its children.**

### Found during the retroactive verification, 2026-09-11

20. **A transitioned focus ring reads as a different ring if sampled too early.** At a
    150ms settle, five phantom "non-standard" ring colours appeared; they resolved to the
    standard amber over ~2.5s. **Settle ~320ms before reading focus styles.**
21. **`body.textContent` includes `<script>` contents** and so inherits trap 10 — the RSC
    payload carries `min-h-[48px]`, read as "2 min". Only `innerText` is clean.
22. **The object `sanityFetch` returns is frozen.** Assigning to it crashes the build worker
    with `code: 3221226505` during "Collecting page data" — an access violation that looks
    nothing like its cause.

### The one that matters most

23. **Disproving one instance is not disproving the claim.** Every trap above is a false
    positive. This one is a **false negative**: a real two-source bug was *closed* on this
    project because one spot check looked sensible, and it stayed live for months.
    **When the claim is "these two agree", measure BOTH, on the SAME object, and compare
    them directly.** Never measure one and reason about the other.

---

## The standing rule

**When a measurement contradicts observed behaviour, suspect the measurement first** — and
re-measure by a second, *different* method before writing it down. Weight instrument
readings (computed styles, `innerText`, network requests, GROQ against the dataset) over
greps, and weight both over aesthetic generalisation.
