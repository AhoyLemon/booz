<template lang="pug">
.error-page
  .container
    // Missing Tenant (e.g., /drinks)
    .error-banner(v-if="errorScenario === 'missing-tenant'")
      .error-icon 🔗
      .error-content
        h1 Missing Bar Name
        p The page "{{ requestedPath }}" is missing a bar name.
        p.error-explanation BOOZ requires a bar name in the URL (e.g., /sample/drinks instead of /drinks).
        .suggestion-box
          p Did you mean:
          NuxtLink(:to="suggestedTenantUrl" class="btn-primary") {{ suggestedTenantUrl }}
    
    // Invalid Tenant (e.g., /lime/drinks or /badtenant)
    .error-banner(v-else-if="errorScenario === 'invalid-tenant'")
      .error-icon 🚫
      .error-content
        h1 Bar Not Found
        p The bar "{{ possibleTenant }}" could not be found.
        p.error-explanation This might happen if you mistyped the URL or if the bar has been removed.
        
        // Single sample tenant - show CTA button
        .sample-cta(v-if="sampleTenants.length === 1")
          p Double check your URL, or if you're curious to see how BOOZ works:
          NuxtLink(:to="`/${sampleTenants[0]}`" class="btn-primary") Explore {{ getTenantName(sampleTenants[0]) }}
        
        // Multiple sample tenants - show list
        .sample-tenants(v-else-if="sampleTenants.length > 1")
          p Try exploring our sample data:
          ul
            li(v-for="slug in sampleTenants" :key="slug")
              NuxtLink(:to="`/${slug}`") {{ getTenantName(slug) }}
    
    // Generic 404 (e.g., /foo or /no.jpg)
    .error-banner(v-else)
      .error-icon ❓
      .error-content
        h1 Page Not Found
        p.intro-text BOOZ is a multi-tenant bar inventory management system. Each bar has its own URL path (e.g., /sample, /lemon, /victor).
        p.error-explanation The page "{{ requestedPath }}" doesn't exist. You might be looking for a bar that isn't here, or a page that was moved or removed.
        .help-links
          p Here's where you can go:
          ul
            li
              NuxtLink(to="/about" class="link-about") 
                strong About BOOZ
                span  - Learn about this project
            li(v-for="slug in sampleTenants" :key="slug")
              NuxtLink(:to="`/${slug}`")
                strong {{ getTenantName(slug) }}
                span  - Explore our sample bar
</template>

<script setup lang="ts">
  import { getTenantConfig, isValidTenant, getSampleDataTenantSlugs } from "~/utils/tenants";

  // Define props from Nuxt's error object
  const props = defineProps({
    error: Object,
  });

  // Get the current route path
  const route = useRoute();
  const requestedPath = computed(() => props.error?.url || route.path || "");

  // Parse the requested path to detect tenant-related issues
  const pathSegments = computed(() => requestedPath.value.split("/").filter(Boolean));
  const possibleTenant = computed(() => pathSegments.value[0] || "");

  // Define known page routes (tenant-based pages)
  const knownTenantPages = ["drinks", "bottles", "available", "essentials", "beer-wine", "fingers", "qr"];

  // Determine the error scenario
  const errorScenario = computed(() => {
    const tenant = possibleTenant.value;
    const secondSegment = pathSegments.value[1];

    // Scenario 1: Missing tenant (e.g., /drinks instead of /sample/drinks)
    if (knownTenantPages.includes(tenant)) {
      return "missing-tenant";
    }

    // Scenario 2: Invalid tenant (e.g., /lime/drinks)
    // Only treat as invalid tenant if there's a second segment that's a known page route
    if (tenant && !isValidTenant(tenant) && secondSegment && knownTenantPages.includes(secondSegment)) {
      return "invalid-tenant";
    }

    // Scenario 3: Generic 404 for everything else (e.g., /foo, /no.jpg)
    return "not-found";
  });

  // Suggest correct URL for missing tenant scenario
  const suggestedTenantUrl = computed(() => {
    if (errorScenario.value === "missing-tenant") {
      return `/sample${requestedPath.value}`;
    }
    return null;
  });

  // Get sample tenants (only show sample data tenants for invalid tenant scenario)
  const sampleTenants = computed(() => {
    return getSampleDataTenantSlugs();
  });

  const getTenantName = (slug: string) => {
    const config = getTenantConfig(slug);
    return config ? config.barName : slug;
  };
</script>

<style lang="scss" scoped>
  @use "sass:color";
  @use "@/assets/styles/variables" as *;

  .error-page {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-lg;

    .container {
      max-width: 600px;
      width: 100%;
    }
  }

  .error-banner {
    background: linear-gradient(135deg, #dc3545 0%, color.adjust(#dc3545, $lightness: -10%) 100%);
    color: white;
    padding: $spacing-xl;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-lg;
    text-align: center;

    .error-icon {
      font-size: 4rem;
      margin-bottom: $spacing-md;
    }

    .error-content {
      h1 {
        color: white;
        font-size: 2rem;
        margin: 0 0 $spacing-md 0;
      }

      p {
        color: rgba(255, 255, 255, 0.95);
        margin-bottom: $spacing-md;
        font-size: 1.125rem;
      }

      .intro-text {
        font-size: 1rem;
        line-height: 1.6;
        margin-bottom: $spacing-lg;
      }

      .error-explanation {
        color: rgba(255, 255, 255, 0.8);
        font-size: 1rem;
        margin-bottom: $spacing-lg;
        font-style: italic;
      }

      .suggestion-box,
      .sample-tenants,
      .sample-cta,
      .help-links {
        background: rgba(0, 0, 0, 0.2);
        padding: $spacing-md;
        border-radius: $border-radius-md;
        margin: $spacing-lg 0;

        p {
          margin-bottom: $spacing-sm;
          font-weight: 600;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;
          text-align: left;

          li {
            margin: $spacing-xs 0;

            a {
              color: white;
              text-decoration: none;
              padding: $spacing-xs $spacing-sm;
              display: inline-block;
              border-radius: $border-radius-sm;
              transition: background-color 0.2s;

              &:hover {
                background: rgba(255, 255, 255, 0.2);
              }

              strong {
                font-weight: 600;
              }

              span {
                opacity: 0.9;
              }
            }

            .link-about {
              display: block;
            }
          }
        }

        .btn-primary {
          display: inline-block;
          background: white;
          color: #dc3545;
          padding: $spacing-sm $spacing-lg;
          border-radius: $border-radius-md;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
          margin-top: $spacing-sm;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
        }
      }
    }
  }
</style>
