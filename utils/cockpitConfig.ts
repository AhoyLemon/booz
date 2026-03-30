/**
 * Cockpit CMS API Configuration
 *
 * This file is the single source of truth for all Cockpit CMS API paths.
 * Update these values here to switch to a different API or image host.
 * The API key is read-only and safe to expose publicly.
 */

export const COCKPIT_API_URL = "https://my.booz.bar/api";
export const COCKPIT_IMAGE_URL = "https://my.booz.bar/storage/uploads";
export const COCKPIT_API_KEY = "API-9aa5e339d0d1f948a80f410dfdc0229eac75ad84";

/**
 * Note about API Key Security:
 * This API key has read-only permissions and is safe to expose publicly.
 * It cannot create, edit, or delete data in Cockpit CMS.
 * More sensitive API keys with write permissions should NEVER be exposed.
 */
