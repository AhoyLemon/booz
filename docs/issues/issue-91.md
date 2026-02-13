# Improve Page Meta → Sync description → OG / Twitter

**Summary** ✅

When a page defines a meta `description` (via `useHead`), we should ensure that the same description is used for `og:description` and `twitter:description` _both on server render and during SPA navigation_. Right now we have a client-side sync that updates social tags after hydration; this doc proposes a fuller approach that keeps tags consistent server-side (SSR) and client-side, with minimal migration effort.

---

## Problem

- Pages sometimes define only `meta[name="description"]` via `useHead`.
- `layouts/default.vue` provides a fallback description for social meta tags, so SSR output uses the fallback while client-side navigation updates tags after hydration.
- This causes a mismatch between initial SSR social tags and per-page description until client JS runs. It can affect crawlers or social preview generators that do not run JS.

---

## Goals 🎯

- Ensure `og:description` and `twitter:description` always reflect an explicit page description when provided.
- Preserve sensible layout defaults when pages do not provide descriptions.
- Keep behavior stable during SPA navigation and full-page SSR responses.
- Keep implementation simple and testable.

---

## Proposed solution (high level) 🔧

1. Create a small composable `usePageMeta` that pages call to declare their page-level metadata (title, description, ogImage, etc.).
2. `usePageMeta` should:
   - call `useHead()` to set head tags as usual (works client-side and SSR), AND
   - write the canonical description into a shared SSR-friendly state (e.g., `useState('currentPageMeta', ...)`).
3. Update `layouts/default.vue` to read that shared state at render-time and use it to populate social tags if present; fall back to existing `pageMeta` logic otherwise.
4. Keep the existing client-side synchronization (as added) as a safety net but prefer the SSR-correct source of truth.

This approach makes SSR output reflect page-level description without relying on JS execution order hacks.

---

## Immediate next steps (highest priority) 🔥

1. Ensure `/about` has a bespoke OG description
   - `usePageMeta` now supports `ogDescription`. Confirm `pages/about/index.vue` calls `usePageMeta({ description: '...', ogDescription: '...' })`. `/about` has already been updated to include a bespoke `ogDescription`.
   - Verify server-rendered HTML (View Page Source) at `http://localhost:3000/about` contains the OG and Twitter descriptions matching `ogDescription` (or `description` if no `ogDescription` set):
     - `<meta property="og:description" content="Learn how to use BOOZ — manage bar inventory, cocktails, and demos across multiple locations.">`
     - `<meta name="twitter:description" content="Learn how to use BOOZ — manage bar inventory, cocktails, and demos across multiple locations.">`
   - If you want a different OG vs page description, use `ogDescription`; otherwise `description` will be used for both.
2. Add a small SSR test for `/about`
   - Create `tests/meta-about.test.ts` that renders `/about` server-side and asserts the presence and content of `og:description` and `twitter:description` in the rendered HTML.
   - Keep this test focused (no browser automation required) and run in CI to prevent regressions.

3. Quick manual verification steps
   - Start dev: `bun run dev` (or `npm run dev`)
   - Curl or open page source: `curl -s http://localhost:3000/about | grep -i "og:description"`
   - Confirm curl output shows the expected OG description string

4. Optional: Add `ogDescription` support (if you want different text than meta description)
   - Add `ogDescription?: string` to `usePageMeta` signature and write `pageState.value.ogDescription`.
   - Use `ogDescription || description` when populating server-side social tags in `layouts/default.vue`.

---

## Implementation details (example)

- New composable: `composables/usePageMeta.ts`

```ts
export const usePageMeta = (meta: { title?: string; description?: string; ogImage?: string }) => {
  // Persist for SSR and global access
  const state = useState("currentPageMeta", () => ({}) as Record<string, any>);
  if (meta.title) state.value.title = meta.title;
  if (meta.description) state.value.description = meta.description;
  if (meta.ogImage) state.value.ogImage = meta.ogImage;

  // Primary head management (supports SSR + client)
  useHead({
    title: meta.title,
    meta: meta.description ? [{ name: "description", content: meta.description }] : [],
  });

  return state;
};
```

- Update `layouts/default.vue`
  - Read `const pageState = useState('currentPageMeta')` and prefer `pageState.value.description` for `og:description`/`twitter:description` when present.
  - Keep existing `pageMeta` fallback logic for pages that haven't opted in.

- Optional: add a small helper in layout to also sync image (`ogImage`) and canonical URL.

---

## Tests

- Unit test for `usePageMeta` ensuring that state is written and `useHead` is called.
- Integration test: render a page that uses `usePageMeta` and assert server-rendered head contains the page-provided `og:description` and `twitter:description` (no client JS required).
- SPA navigation test: navigate between two pages setting different descriptions and assert head tags update correctly.

---

## Migration notes / backward compatibility

- Existing pages that currently call `useHead({meta: [{name: 'description', ...}]})` will continue to work but will not automatically populate the SSR `currentPageMeta` state unless updated to call `usePageMeta` (or augmented to set the state in a small convenience wrapper).
- As an alternative, a lightweight auto-sync could be added to `layouts/default.vue` to read `useHead().meta` server-side, but composable approach is clearer and explicit.

---

## Checklist for a PR ✅

- [ ] Add `composables/usePageMeta.ts` and tests
- [ ] Update `layouts/default.vue` to read `currentPageMeta` and prefer it for social tags
- [ ] Migrate key pages (e.g., home, about, bottles/[id], drinks/[id]) to use `usePageMeta` (or add a small migration shim)
- [ ] Add unit/integration tests asserting SSR and SPA correctness
- [ ] Update docs (this file) and README with the new page meta pattern

---

## Notes / Edge cases

- Keep meta lengths in mind: aim for ~50–160 chars for `description`; OpenGraph allows longer, but keep content concise for social previews.
- Localisation: store `currentPageMeta` per-locale if the site supports i18n.
- Canonical URLs and robots/meta directives should remain separate responsibilities.

---

If you want, I can implement the `usePageMeta` composable and migrate a couple of pages (e.g., `/about` and `/`) in a follow-up PR, with tests. 🔁
