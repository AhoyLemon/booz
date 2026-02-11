<template lang="pug">
.site-layout
  Header
  main
    DummyDataNotice(v-if="isSampleDataTenant && normalizedPath !== '/' && normalizedPath !== '/about'")
    slot
  footer.app-footer
    .container
      p by 
        a(href="https://ahoylemon.xyz") Lemon
        | . GitHub repo is 
        a(href="https://github.com/ahoylemon/booz") here
        | .
</template>

<script setup lang="ts">
  import DummyDataNotice from "~/components/DummyDataNotice.vue";
  import Header from "~/components/Header.vue";
  import { getTenantConfig, getDefaultTenantConfig } from "~/utils/tenants";
  import { onMounted, onUnmounted, watch, nextTick } from "vue";

  const route = useRoute();

  // Extract tenant from route
  const tenant = computed(() => {
    // First try route params (for tenant pages)
    const paramTenant = route.params.tenant as string;
    if (paramTenant) {
      return paramTenant;
    }
    // Fallback to path segments (for root page)
    const pathSegments = route.path.split("/").filter(Boolean);
    // Fallback to default tenant slug as safety measure (middleware should handle redirects)
    return pathSegments[0] || getDefaultTenantConfig().slug;
  });

  // Get tenant config
  const tenantConfig = computed(() => {
    return getTenantConfig(tenant.value) || getDefaultTenantConfig();
  });

  const isSampleDataTenant = computed(() => tenantConfig.value.isSampleData === true);

  const normalizedPath = computed(() => route.path.replace(/\/$/, "") || "/");

  // Determine page type and generate appropriate meta tags
  const pageMeta = computed(() => {
    const path = route.path;
    const segments = path.split("/").filter(Boolean);

    // Remove tenant from segments
    if (segments[0] === tenant.value) {
      segments.shift();
    }

    const pageType = segments[0] || "home";
    const subType = segments[1];

    let title = `${tenantConfig.value.barName} - Bar Inventory`;
    let description = tenantConfig.value.description || "Explore our bar inventory - spirits, cocktails, beer, and wine.";

    switch (pageType) {
      case "home":
        if (path === "/") {
          title = "Bar Inventory Management";
          description = "A multi-tenant bar inventory management system for managing cocktails, spirits, beer, and wine across multiple locations.";
        } else {
          title = `${tenantConfig.value.barName} - Bar Inventory`;
          description = tenantConfig.value.description || "Explore our bar inventory - spirits, cocktails, beer, and wine.";
        }
        break;

      case "about":
        title = "About BOOZ";
        description = "Learn how to use BOOZ, and check out a couple demo bars.";
        break;

      case "bottles":
        if (subType) {
          // Individual bottle page
          title = `Bottle Details - ${tenantConfig.value.barName}`;
          description = `View bottle details and availability at ${tenantConfig.value.barName}.`;
        } else {
          // Bottles listing
          title = `Bottles - ${tenantConfig.value.barName}`;
          description = `Browse our collection of spirits, liquors, and mixers at ${tenantConfig.value.barName}.`;
        }
        break;

      case "drinks":
        if (subType) {
          // Individual drink page
          title = `Drink Recipe - ${tenantConfig.value.barName}`;
          description = `View cocktail recipe and ingredients at ${tenantConfig.value.barName}.`;
        } else {
          // Drinks listing
          title = `Drinks - ${tenantConfig.value.barName}`;
          description = `Explore our collection of cocktails and mixed drinks at ${tenantConfig.value.barName}.`;
        }
        break;

      case "available":
        title = `Available Now - ${tenantConfig.value.barName}`;
        description = `Check what's currently available to drink at ${tenantConfig.value.barName} - cocktails, beer, wine, and spirits.`;
        break;

      case "fingers":
        title = `Fingers - ${tenantConfig.value.barName}`;
        description = `Browse bottles served straight up or on the rocks at ${tenantConfig.value.barName}.`;
        break;

      case "essentials":
        title = `Essentials - ${tenantConfig.value.barName}`;
        description = `View mixers, juices, and essential ingredients at ${tenantConfig.value.barName}.`;
        break;

      case "beer-wine":
        title = `Beer & Wine - ${tenantConfig.value.barName}`;
        description = `Browse our selection of beer and wine at ${tenantConfig.value.barName}.`;
        break;

      case "error":
        title = `Page Not Found - ${tenantConfig.value.barName}`;
        description = `The requested page could not be found at ${tenantConfig.value.barName}.`;
        break;

      default:
        title = `${tenantConfig.value.barName} - Bar Inventory`;
        description = tenantConfig.value.description || "Explore our bar inventory - spirits, cocktails, beer, and wine.";
    }

    return { title, description };
  });

  // Determine og:image based on page
  const ogImage = computed(() => {
    if (route.path === "/") return "/opengraph-home.png";
    if (route.path === "/about") return "/opengraph-about.png";
    return tenantConfig.value.ogImage || "/opengraph-generic.png";
  });

  // Allow pages to set an explicit SSR-friendly page meta state
  const pageState = useState("currentPageMeta", () => ({}) as { title?: string; description?: string; ogDescription?: string; ogImage?: string });

  // Set tenant-specific head tags (prefer explicit page meta from pages when available)
  useHead(() => {
    const titleSSR = pageState.value.title || pageMeta.value.title;
    const descSSR = pageState.value.ogDescription || pageState.value.description || pageMeta.value.description;
    const metaDescription = pageState.value.description || pageMeta.value.description;
    const ogImg = pageState.value.ogImage ? `https://booz.bar${pageState.value.ogImage}` : `https://booz.bar${ogImage.value}`;

    return {
      title: titleSSR,
      base: { href: "/" },
      meta: [
        { name: "description", content: metaDescription },
        { property: "og:title", content: titleSSR },
        { property: "og:description", content: descSSR },
        { property: "og:image", content: ogImg },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `https://booz.bar${route.path}` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: titleSSR },
        { name: "twitter:description", content: descSSR },
        { name: "twitter:image", content: ogImg },
      ],
      link: [
        { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96x96.png" },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "shortcut icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        { rel: "apple-touch-icon", type: "image/png", sizes: "180x180", href: "/apple-touch-icon.png" },
      ],
    };
  });

  // Keep social descriptions in sync with any explicit page description
  // Behavior: server-side uses the computed `pageMeta` fallback; on the client we prefer
  // any `meta[name="description"]` defined by child pages and keep things updated
  // on navigation.
  const updateSocialDescriptions = () => {
    // Prefer an explicit OG description set by the pageState, otherwise check the
    // existing OG tag, then the page description meta.
    let desc = pageState.value.ogDescription || pageState.value.description || pageMeta.value.description;

    if (process.client) {
      const ogMeta = document.querySelector('meta[property="og:description"]')?.getAttribute("content");
      const metaEl = document.querySelector('meta[name="description"]')?.getAttribute("content");
      if (ogMeta) {
        desc = ogMeta;
      } else if (metaEl) {
        desc = metaEl;
      }
    }

    useHead({
      meta: [
        { property: "og:description", content: desc },
        { name: "twitter:description", content: desc },
      ],
    });
  };

  let descObserver: MutationObserver | null = null;

  onMounted(() => {
    // Initial attempt after a tick to allow child pages' useHead to run
    nextTick().then(() => updateSocialDescriptions());

    // Observe head changes so we can react if a page sets or updates
    // `meta[name="description"]` after layout mounted.
    if (process.client && typeof MutationObserver !== "undefined") {
      const head = document.head;
      descObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "childList") {
            if (document.querySelector('meta[name="description"]')) {
              updateSocialDescriptions();
              return;
            }
          }
          if (m.type === "attributes" && (m.target as Element).matches && (m.target as Element).matches('meta[name="description"]')) {
            updateSocialDescriptions();
            return;
          }
        }
      });
      descObserver.observe(head, { childList: true, subtree: true, attributes: true, attributeFilter: ["content"] });
    }
  });

  onUnmounted(() => {
    if (descObserver) {
      descObserver.disconnect();
      descObserver = null;
    }
  });

  watch([() => route.path, () => pageMeta.value.description, () => pageState.value.description, () => pageState.value.ogDescription], () => {
    // Delay slightly to allow child components' useHead to run on navigation
    nextTick().then(updateSocialDescriptions);
  });
</script>
