/**
 * Global middleware for tenant routing
 *
 * This middleware:
 * 1. Redirects root paths to default tenant paths (e.g., / => /foo, /drinks => /foo/drinks)
 * 2. Validates tenant slugs and shows error page for unknown tenants
 */

import { getDefaultTenantConfig, isValidTenant, getAllTenantSlugs } from "~/utils/tenants";

export default defineNuxtRouteMiddleware((to) => {
  const path = to.path;

  // Skip processing for static assets
  if (path.startsWith("/_nuxt") || path.startsWith("/assets")) {
    return;
  }

  // Skip tenant validation for non-tenant pages
  const nonTenantRoutes = ["/about"];
  if (nonTenantRoutes.includes(path)) {
    return;
  }

  // Extract tenant from path
  const pathSegments = path.split("/").filter(Boolean);
  const possibleTenant = pathSegments[0];

  // Check if path starts with a tenant slug
  if (possibleTenant && isValidTenant(possibleTenant)) {
    // Valid tenant, allow navigation
    return;
  }

  // Check if this is the error page for an invalid tenant
  if (pathSegments.length >= 2 && pathSegments[1] === "error") {
    // Allow access to error page
    return;
  }

  // Check if this is a root path that needs default tenant
  if (!possibleTenant && path !== "/") {
    // Redirect paths like /drinks to /foo/drinks, but allow / to render
    const defaultConfig = getDefaultTenantConfig();
    const newPath = `/${defaultConfig.slug}${path}`;

    return navigateTo(newPath, { redirectCode: 302 });
  }

  // If we have a path segment that's not a valid tenant
  if (possibleTenant && !isValidTenant(possibleTenant)) {
    // This is an invalid tenant - redirect to error page
    return navigateTo(`/${possibleTenant}/error`, { redirectCode: 302 });
  }

  return;
});
