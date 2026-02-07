<template lang="pug">
.error-page
  .container
    .error-banner
      .error-icon 🚫
      .error-content
        h1 Tenant Not Found
        p The tenant "{{ tenant }}" could not be found.
        .available-tenants
          p Available tenants:
          ul
            li(v-for="slug in availableTenants" :key="slug")
              NuxtLink(:to="`/${slug}`") {{ getTenantName(slug) }}
        .home-link
          NuxtLink(:to="`/${defaultTenant}`" class="btn-primary") Go to Default Tenant
</template>

<script setup lang="ts">
import { getAllTenantSlugs, getDefaultTenantConfig, getTenantConfig } from "~/utils/tenants";

const route = useRoute();
const tenant = computed(() => route.params.tenant as string);

const availableTenants = getAllTenantSlugs();
const defaultTenant = getDefaultTenantConfig().slug;

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

  .container {
    max-width: 600px;
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

    .available-tenants {
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
          }
        }
      }
    }

    .home-link {
      margin-top: $spacing-lg;

      .btn-primary {
        display: inline-block;
        background: white;
        color: #dc3545;
        padding: $spacing-sm $spacing-lg;
        border-radius: $border-radius-md;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.2s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
      }
    }
  }
}
</style>
