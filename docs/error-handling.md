# Error Handling in BOOZ

This document explains how error pages work in BOOZ and how to customize them.

## Global Error Handler

BOOZ uses a global error handler (`error.vue` in the root directory) that provides smart, context-aware 404 pages.

### Error Scenarios

The error handler detects three different scenarios:

#### 1. Missing Tenant (`/drinks`)
When a user visits a tenant page without specifying the tenant (e.g., `/drinks` instead of `/sample/drinks`), the error page:
- Shows a "Missing Bar Name" message
- Explains that BOOZ requires a tenant in the URL
- Provides a direct link to the suggested URL (e.g., `/sample/drinks`)

#### 2. Invalid Tenant (`/lime/drinks`)
When a user visits a URL with an invalid tenant followed by a known page route (e.g., `/lime/drinks` where "lime" isn't a valid tenant), the error page:
- Shows a "Bar Not Found" message
- Explains the tenant couldn't be found
- **Shows only sample data tenants** (tenants with `isSampleData: true`)
- If there's only one sample tenant, shows a CTA button: "Explore {barName}"
- If there are multiple sample tenants, shows a list of them

#### 3. Generic 404 (`/foo`, `/no.jpg`)
For all other 404 errors (single-segment paths or file-like URLs), the error page:
- Shows a "Page Not Found" message
- Explains what BOOZ is (multi-tenant bar inventory system)
- Provides links to:
  - `/about` page - to learn about the project
  - Sample bar(s) - to explore the demo

## Adding Other Error Pages

Nuxt supports custom error pages for different HTTP status codes. You can add additional error handling by creating separate error components.

### Adding a 401 Unauthorized Page

Create a component that handles 401 errors in your `error.vue`:

```vue
<template lang="pug">
// In error.vue, add a condition for 401
.error-page(v-if="error?.statusCode === 401")
  .error-banner
    .error-icon 🔒
    .error-content
      h1 Unauthorized
      p You need to be logged in to access this page.
      NuxtLink(to="/login" class="btn-primary") Go to Login

// Add v-else-if for 404 handling
.error-page(v-else-if="error?.statusCode === 404")
  // ... existing 404 logic ...
</template>
```

### Adding a 500 Server Error Page

Add handling for 500 errors:

```vue
<template lang="pug">
// In error.vue, add a condition for 500
.error-page(v-if="error?.statusCode === 500")
  .error-banner
    .error-icon ⚠️
    .error-content
      h1 Server Error
      p Something went wrong on our end. Please try again later.
      .help-links
        p You can:
        ul
          li
            button(@click="handleError") Try Again
          li
            NuxtLink(to="/") Go Home

// Add v-else-if for other status codes...
</template>

<script setup lang="ts">
const handleError = () => clearError({ redirect: '/' });
</script>
```

### Adding a 403 Forbidden Page

```vue
<template lang="pug">
.error-page(v-if="error?.statusCode === 403")
  .error-banner
    .error-icon 🚫
    .error-content
      h1 Access Forbidden
      p You don't have permission to access this resource.
      NuxtLink(to="/" class="btn-primary") Go Home
</template>
```

## Error Page Structure

The `error.vue` file uses:
- **Pug templates** for clean HTML structure
- **v-if/v-else-if** blocks for different error types
- **Computed properties** to determine the error scenario
- **SCSS** for styling (scoped to avoid conflicts)

## Tips

1. **Keep error pages simple** - Users are already frustrated, don't add complexity
2. **Provide clear actions** - Always give users a way forward (links to home, login, etc.)
3. **Use appropriate icons** - Emojis work well for quick visual communication
4. **Match your app's style** - Use the same colors and fonts as the rest of your app
5. **Test error pages** - Make sure they actually help users recover from errors

## Example: Complete Error Handler

```vue
<script setup lang="ts">
const props = defineProps({
  error: Object,
});

const statusCode = computed(() => props.error?.statusCode || 404);
</script>

<template lang="pug">
.error-page
  .container
    // 401 Unauthorized
    .error-banner(v-if="statusCode === 401")
      // ... 401 content ...
    
    // 403 Forbidden
    .error-banner(v-else-if="statusCode === 403")
      // ... 403 content ...
    
    // 404 Not Found
    .error-banner(v-else-if="statusCode === 404")
      // ... 404 content (existing logic) ...
    
    // 500 Server Error
    .error-banner(v-else-if="statusCode === 500")
      // ... 500 content ...
    
    // Generic fallback
    .error-banner(v-else)
      // ... generic error ...
</template>
```

## Resources

- [Nuxt Error Handling Docs](https://nuxt.com/docs/getting-started/error-handling)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
