import { isValidTenant, getDefaultTenantConfig } from "~/utils/tenants";

/**
 * Global middleware to handle tenant-based routing
 * - Redirects non-tenant paths to default tenant (e.g., /search → /sample/search)
 * - Validates tenant slugs
 * - Redirects invalid tenants to error pages
 * - Skips static assets
 */
export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware for static assets and API routes
  if (to.path.startsWith("/_") || to.path.startsWith("/api") || to.path.includes(".")) {
    return;
  }

  // List of routes that should be tenant-specific
  const tenantRoutes = [
    "/drinks",
    "/bottles",
    "/essentials",
    "/beer-wine",
    "/fingers",
    "/available",
    "/search", // Add search to tenant routes
    "/qr",
  ];

  // Check if current path is a tenant route without a tenant prefix
  const pathSegments = to.path.split("/").filter((s) => s);
  const firstSegment = pathSegments[0];

  // If the first segment is a tenant route name, redirect to default tenant
  if (tenantRoutes.some((route) => to.path.startsWith(route))) {
    const defaultTenant = getDefaultTenantConfig().slug;
    return navigateTo(`/${defaultTenant}${to.path}`, { redirectCode: 301 });
  }

  // Check if path has a tenant parameter
  const tenant = to.params.tenant as string | undefined;

  if (tenant) {
    // Validate tenant
    if (!isValidTenant(tenant)) {
      // Redirect to tenant-specific error page
      return navigateTo(`/${tenant}/error`, { redirectCode: 404 });
    }
  }
});
