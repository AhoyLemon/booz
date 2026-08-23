import type { TenantConfig } from "~/types";

export type PwaManifestIcon = {
  src: string;
  sizes: string;
  type: "image/png";
  purpose: "maskable";
};

export type PwaManifest = {
  id: string;
  name: string;
  short_name: string;
  description: string;
  icons: PwaManifestIcon[];
  theme_color: string;
  background_color: string;
  display: "standalone";
  start_url: string;
  scope: string;
};

export const PWA_ICON_ASSETS: PwaManifestIcon[] = [
  {
    src: "/web-app-manifest-192x192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "maskable",
  },
  {
    src: "/web-app-manifest-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];

const SITE_DESCRIPTION = "Manage and explore cocktail recipes, bottle inventory, and bar essentials for multiple locations.";
const PWA_COLOR = "#264653";

function copyIcons(): PwaManifestIcon[] {
  return PWA_ICON_ASSETS.map((icon) => ({ ...icon }));
}

export function createRootPwaManifest(): PwaManifest {
  return {
    id: "/",
    name: "BOOZ",
    short_name: "BOOZ",
    description: SITE_DESCRIPTION,
    icons: copyIcons(),
    theme_color: PWA_COLOR,
    background_color: PWA_COLOR,
    display: "standalone",
    start_url: "/",
    scope: "/",
  };
}

export function createTenantPwaManifest(tenant: TenantConfig): PwaManifest {
  const tenantRoot = `/${tenant.slug}/`;

  return {
    id: tenantRoot,
    name: `BOOZ | ${tenant.barName}`,
    short_name: tenant.barName,
    description: tenant.metaInfo?.description || tenant.description || SITE_DESCRIPTION,
    icons: copyIcons(),
    theme_color: PWA_COLOR,
    background_color: PWA_COLOR,
    display: "standalone",
    start_url: tenantRoot,
    scope: tenantRoot,
  };
}
