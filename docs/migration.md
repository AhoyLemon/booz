# Nuxt 3 → Nuxt 4 Migration Notes

This document records the minimal migration steps performed and recommended follow-ups when upgrading this repository from Nuxt 3 to Nuxt 4.

Summary of changes applied in-branch

- Upgraded `nuxt` to v4 (see `package.json`).
- Removed unused Nuxt 3 test utilities (`@nuxt/test-utils`) from `devDependencies`.
- Regenerated Nuxt types with `npx nuxi prepare`.
- Ran `npx nuxi build` and the test suite (`vitest`) — all tests passed locally.
- Added `package.json` scripts: `typecheck`, `test:ci`, and `ci` for CI usage.
- Added a CI workflow file `.github/workflows/ci.yml` to run prepare, build, typecheck and tests.

Quick checks and commands

Install and prepare types:

```bash
# With Bun
bun install

# Or with npm
npm install

# Generate Nuxt types
npx nuxi prepare
```

Run dev or build:

```bash
npx nuxi dev
npx nuxi build
```

Run tests and type checks:

```bash
npm run typecheck
npm run test
npm run test:ci
```

CI and workflows

- The repository includes a suggested CI workflow at `.github/workflows/ci.yml` that:
  - Checks out code
  - Installs dependencies
  - Runs `npx nuxi prepare`
  - Runs `npm run ci` (typecheck + tests)

Notes & recommendations

- Modules: `@nuxtjs/sitemap` currently works in the project, but confirm upstream support for Nuxt 4 when you upgrade major versions. Consider `nuxt-simple-sitemap` or the official Nuxt modules if an update is required.
- Pre-commit hooks: I did not install `husky` or `lint-staged` automatically. If you'd like, I can add `husky` + `lint-staged` and enable a pre-commit hook to run `prettier --write` + `npm run test` on staged files.
- Pinning: Consider pinning critical packages (`nuxt`, `vite`, `nitro`) or enabling Dependabot to keep them current.
- Deployment: Verify GitHub Actions build and the Pages deploy step still publish `.output/public/` as expected. Keep `postinstall: "nuxi prepare"` in `package.json` so types are generated during installs.

If you want I can now:

- Add `husky` + `lint-staged` and a pre-commit hook, or
- Bump or pin module versions and run the install workflow, or
- Push this branch and open a PR.
