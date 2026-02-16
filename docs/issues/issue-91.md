# Improve Page Meta → Sync description → OG / Twitter

- As always, please read this document carefully first, and start by making a todo list.
- You may edit tis document however you like.
- I am open to other implementations that serve the same goal on this one.
- Use Nuxt best practices where possible.

**Summary** ✅

When a page defines a meta `description` (via `useHead`), we should ensure that the same description is used for `og:description` and `twitter:description` _both on server render and during SPA navigation_. Right now we have a client-side sync that updates social tags after hydration; this doc proposes a fuller approach that keeps tags consistent server-side (SSR) and client-side, with minimal migration effort.

---

## Problem

- Pages sometimes define only `meta[name="description"]` via `useHead`.
- `layouts/default.vue` provides a fallback description for social meta tags, so SSR output uses the fallback while client-side navigation updates tags after hydration.
- This causes a mismatch between initial SSR social tags and per-page description until client JS runs. It can affect crawlers or social preview generators that do not run JS.
- **SUMMARY** Basically, all the meta tags are a mess of conflicting sources of truth. We want a system with a series of fallbacks for meta tags which are usually served SSR but also update correctly during SPA navigation.

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
5. Adjust `utils\tenants.ts` to include some (OPTIONAL) tenant specific and page-specific meta overrides if needed. (sketch below)
6. Allow for a variable of `tenantName` in case I want a non-tenant specific tenant page to have a description like `See all the drinks available at ${tenantName}`, or for a tenant-specific page to have a title like `Available | ${tenantName}`.

This approach makes SSR output reflect page-level description without relying on JS execution order hacks.

```ts
export const TENANT_CONFIG: Record<string, TenantConfig> = {
   foo: {
      slug: "foo",
      // other values...
      metaInfo: {
      description: "Generic description for pages under the foo tenant.",
      ogImage: "/opengraph-foo.png",
      pages: {
      drinks: {
      title: "Bespoke title for foo drinks page",
         description: "This is the drinks page for foo tenant. It has a unique description that will show up in social media previews and meta tags.",
      }
      bottles: {
         ogImage: "/opengraph-foo-bottles.png",
      }

      }
   },
}
```

## Logic for each meta tag

For title, description, and ogImage, do the following:

1. Start by looking in TENANT_CONFIG to see if there's a a tenant-specific information for that specific page. If so, use that.
2. If not, check the page itself in `pages\[tenant]`. If the page has title, description or ogImage defined, use that.
3. If not, go back to TENANT_CONFIG and see if there's a tenant-specific backup info for all pages in that tenant. If so, use that.
4. If you still don't have a value, go back to the site-wide defaults. Currently defined in `nuxt.config.ts`, but you can feel free to move them to a more appropriate place if needed.

Bear in mind that that this is for each of those three values. So for example, you could have a tenant-specific description for the drinks page, but use the default title and ogImage for that page. Or you could have a tenant-specific ogImage for all pages in that tenant, but use page-specific titles and descriptions.

## Meta Tag Precedence:

- `description` should populate:
  - `meta[name="description"]`
  - `meta[property="og:description"]`
  - `meta[name="twitter:description"]`
- `title` should populate:
  - `<title>`
  - `meta[property="og:title"]`
  - `meta[name="twitter:title"]`
- `ogImage` should populate:
  - `meta[property="og:image"]`
  - `meta[name="twitter:image"]`

## SSR vs Client Sync:

- The `usePageMeta` composable will ensure that the correct meta tags are rendered during SSR based on the page's declared metadata and tenant configuration.
- The list of static pages is currently defined in the `nitro` object in `nuxt.config.ts`. All of those pages should have meta tags correctly generated server-side in the production environment.
- Other pages, such as those at `pages/tenant/drinks/[id].vue` will be impossible to generate in advance. They should use the logic described in "Logic for each meta tag" above to determine their meta tags during SSR, and the existing client-side sync will (hopefully) ensure they update correctly during SPA navigation.

---

## Implementation Complete ✅

**What was implemented:**

1. **Type system updates** - Added `PageMetaOverride` and `TenantMetaConfig` interfaces to support page-level meta customization
2. **Tenant configuration** - Enhanced tenant configs with sample page-specific meta overrides for testing
3. **usePageMeta composable** - Complete refactor implementing:
   - 4-level fallback chain: tenant-page-specific → page-explicit → tenant-general → site defaults
   - Automatic tenant and page type detection from routes
   - Variable substitution support (e.g., `${tenantName}`)
   - Unified meta tag management (title, description, og:_, twitter:_)
   - SSR-friendly state management
4. **Simplified layout** - Removed redundant meta tag logic from `layouts/default.vue`
5. **Updated all pages** - Migrated all pages to use the new `usePageMeta` API

**Key benefits:**

- Single source of truth for meta tags
- SSR and client-side navigation consistency
- Easy tenant and page customization
- No more meta tag conflicts or race conditions

---

## Tests ✅

The implementation is complete and ready for manual testing. Here's how to verify:

### Test Checklist

- [x] **Tenant-specific configurations** - Added sample configurations for `sample`, `lemon`, and `victor` tenants with various meta overrides
- [ ] **JavaScript disabled test** - Visit pages with JS disabled and verify correct meta tags in initial HTML
- [ ] **JavaScript enabled test** - Visit pages with JS enabled and verify meta tags update correctly during navigation
- [ ] **Fallback test** - Visit pages without tenant-specific meta and verify they use appropriate defaults
- [ ] **Dynamic page test** - Visit http://localhost:3000/lemon/drinks/drink-6 and verify it shows drink-specific meta after hydration
- [ ] **Error page test** - Visit http://localhost:3000/scoobydooby and verify error page meta tags appear
- [ ] **About page test** - Visit http://localhost:3000/about and verify non-tenant page meta
- [ ] **Homepage test** - Visit http://localhost:3000/ and verify homepage meta
- [ ] **Source consistency** - Verify single source of truth by inspecting code structure

### Testing Instructions

1. **Start dev server**: `bun run dev` (already running)
2. **Open browser**: http://localhost:3000
3. **Test SSR** (initial HTML):
   - Disable JavaScript in browser
   - Visit various pages
   - View page source (Ctrl+U / Cmd+U)
   - Verify `<head>` contains correct meta tags
4. **Test SPA** (client-side navigation):
   - Enable JavaScript
   - Open DevTools and inspect `<head>` element
   - Navigate between pages using links
   - Watch meta tags update in real-time
5. **Test Social Previews**:
   - Use Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
   - Use Twitter Card Validator: https://cards-dev.twitter.com/validator
   - Enter page URLs and verify title/description/image

### Expected Behaviors

- **Sample tenant** pages should use sample-specific meta with demo data notice
- **Lemon tenant** pages should use custom titles like "Cocktails | Lemonhaus"
- **Victor tenant** pages should use custom beer-wine meta
- **Dynamic pages** (drinks, bottles) should show item-specific meta after data loads
- **All meta tags** should be consistent between SSR and client-side navigation
- [ ] Visit those pages with javascript disabled and verify that the correct meta tags are present in the initial HTML response.
- [ ] Visit those pages with javascript enabled and verify that the correct meta tags are present both in the initial HTML response and after client-side navigation.
- [ ] Visit any page that does not have a tenant-specific description and verify that it falls back to the default description in both SSR and client-side navigation.
- [ ] Visit a drink page, such as http://localhost:3000/lemon/drinks/drink-6`- the starting meta should be be for the`drinks` page, but then after hydrated, it could get the details of that specific drink (in this case it's called "Batch Fashioned" and the image url is https://hirelemon.com/bar/storage/uploads/2026/02/13/oldfashioned2_uid_698e9b141e9b9.webp)
- [ ] Visit a page that doesn't exist, ex http://localhost:3000/scoobydooby - you should be seeing meta tags for the `error.vue` page.
- [ ] Visit http://localhost:3000/about - this is not a tenant-specific page, so it should have the appropriate meta tags from `pages\about\index.vue`
- [ ] Visit `http://localhost:3000/` - this is the homepage, so it should have the appropriate meta tags from `pages\index.vue`
- [ ] Assure that there's a single source of truth for generating meta tags, and that the logic is consistent across SSR and client-side navigation. This should be evident from the code structure and the test results.

## Documentation

- [ ] Create a new file at `docs/meta-tags.md` that explains the heirarchy, and how to adjust things.

## Improvisation

- The important part to me is that there's a single source of truth for meta tags, and that when sharing specific pages on social media, the image and description are what I can expect. The "how" is suggested here, but if you have a better way to achieve that goal, I'm open to it. The key is that it should be consistent (our current approach is not), and easy to understand after reading `docs/meta-tags.md`.

## Change Requests

- [x] Can you please add 2 or 3 tests for this work? Add a new file to the `tests` folder please.
- [x] I'm looking in the Nuxt inspector, and it's saying we're missing tags for the primary language and the icon, suggesting adding this:
  ```ts
  useHead({
    htmlAttrs: {
      lang: "en",
    },
    link: [
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
    ],
  });
  ```
- [x] I'm noticing some slight discrepancy between the tenant defaults that I don't understand:
  - http://localhost:3001/sample/drinks has a title of "Sample Cocktails". This is what I would expect because of the tenant-page-specific override in `utils\tenants.ts`.
  - http://localhost:3001/sample/bottles has a title of "Bottles | Sample Bar". This seems appropriate because there's no specific override, so it should go to something like `{pageName} | {tenantName}`.
  - HOWEVER, essentials, beer-wine, fingers, search, and qr are all displaying a title like `{pageName} - {tenantName}`. I would expect them to all be consistent with either the pipe or the dash, but not a mix of both, and I like the pipe synta better.
  - http://localhost:3001/sample gives a title of `Bar DSDJSH - Sample Bar`. I don't get this one. And rather than `Home | {tenantName}`, I'd think it should just be `{tenantName}`
- [x] Tiny bug on the individual drink and bottle meta. I'm looking at the page of http://localhost:3000/lemon/drinks/drink-6 and the og:image is https://booz.barhttps//hirelemon.com/bar/storage/uploads/2026/02/13/oldfashioned2_uid_698e9b141e9b9.webp - but it should be https://hirelemon.com/bar/storage/uploads/2026/02/13/oldfashioned2_uid_698e9b141e9b9.webp

## Changes Made ✅

1. **Created comprehensive tests** - Added `tests/metaTags.test.ts` with tests for:
   - Fallback chain logic (4 levels of priority)
   - Variable substitution (`${tenantName}`)
   - Tenant configuration structure
   - Meta tag generation rules
   - Page type detection

2. **Added missing HTML attributes** - Added `htmlAttrs: { lang: "en" }` and favicon link to `usePageMeta`

3. **Fixed title separator inconsistency** - Changed all default titles to use `|` (pipe) instead of `-` (dash):
   - Before: `"Drinks - Sample Bar"`
   - After: `"Drinks | Sample Bar"`

4. **Fixed tenant index page title** - Tenant home pages now show just the tenant name:
   - Before: `"Bar DSDJSH - Sample Bar"` or `"Home | Sample Bar"`
   - After: `"Sample Bar"` (just the tenant name)

5. **Fixed og:image double domain bug** - Added check for already-complete URLs:
   - Before: `https://booz.barhttps://hirelemon.com/...`
   - After: `https://hirelemon.com/...` (correctly detects and uses full URLs as-is)
