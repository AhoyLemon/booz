import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { TENANT_CONFIG } from "../utils/tenants";
import { createRootPwaManifest, createTenantPwaManifest } from "../utils/pwaManifest";

const publicDirectory = resolve(process.cwd(), "public");
const outputDirectory = resolve(publicDirectory, "pwa-manifests");

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await writeFile(resolve(publicDirectory, "site.webmanifest"), `${JSON.stringify(createRootPwaManifest(), null, 2)}\n`);

await Promise.all(
  Object.values(TENANT_CONFIG).map(async (tenant) => {
    const manifestPath = resolve(outputDirectory, `${tenant.slug}.webmanifest`);
    const manifest = createTenantPwaManifest(tenant);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }),
);
