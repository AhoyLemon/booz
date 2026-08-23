import { describe, expect, it } from "vitest";
import { TENANT_CONFIG } from "~/utils/tenants";
import { createRootPwaManifest, createTenantPwaManifest, PWA_ICON_ASSETS } from "~/utils/pwaManifest";

describe("PWA manifests", () => {
  it("builds the generic BOOZ manifest", () => {
    expect(createRootPwaManifest()).toMatchObject({
      id: "/",
      name: "BOOZ",
      short_name: "BOOZ",
      start_url: "/",
      scope: "/",
      theme_color: "#264653",
      background_color: "#264653",
    });
  });

  it.each(Object.values(TENANT_CONFIG))("builds a tenant manifest for $slug", (tenant) => {
    const manifest = createTenantPwaManifest(tenant);
    const tenantRoot = `/${tenant.slug}/`;

    expect(manifest).toMatchObject({
      id: tenantRoot,
      name: `BOOZ | ${tenant.barName}`,
      short_name: tenant.barName,
      start_url: tenantRoot,
      scope: tenantRoot,
    });
    expect(manifest.icons).toEqual(PWA_ICON_ASSETS);
  });
});
