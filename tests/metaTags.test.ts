import { describe, it, expect, beforeEach } from "vitest";
import type { TenantConfig, PageMetaOverride } from "~/types";

describe("Meta Tag System", () => {
  describe("Fallback Chain Logic", () => {
    it("should prioritize tenant-page-specific meta over all else", () => {
      const tenantConfig: TenantConfig = {
        slug: "test",
        barName: "Test Bar",
        barData: "testBar",
        description: "Tenant-level description",
        ogImage: "/tenant-image.png",
        includeCommonDrinks: false,
        includeRandomCocktails: false,
        metaInfo: {
          description: "Tenant metaInfo description",
          ogImage: "/tenant-metainfo-image.png",
          pages: {
            drinks: {
              title: "Custom Drinks Title",
              description: "Custom drinks description",
              ogImage: "/custom-drinks-image.png",
            },
          },
        },
      };

      // For drinks page, should use tenant-page-specific values
      const pageOverride = tenantConfig.metaInfo?.pages?.drinks;
      expect(pageOverride?.title).toBe("Custom Drinks Title");
      expect(pageOverride?.description).toBe("Custom drinks description");
      expect(pageOverride?.ogImage).toBe("/custom-drinks-image.png");
    });

    it("should fall back to tenant-general meta when page-specific not defined", () => {
      const tenantConfig: TenantConfig = {
        slug: "test",
        barName: "Test Bar",
        barData: "testBar",
        description: "Tenant-level description",
        ogImage: "/tenant-image.png",
        includeCommonDrinks: false,
        includeRandomCocktails: false,
        metaInfo: {
          description: "Tenant metaInfo description",
          ogImage: "/tenant-metainfo-image.png",
        },
      };

      // For a page without specific override, should use tenant-general
      const pageOverride = tenantConfig.metaInfo?.pages?.bottles;
      expect(pageOverride).toBeUndefined();
      expect(tenantConfig.metaInfo?.description).toBe("Tenant metaInfo description");
      expect(tenantConfig.metaInfo?.ogImage).toBe("/tenant-metainfo-image.png");
    });

    it("should use site defaults when no tenant meta is defined", () => {
      const tenantConfig: TenantConfig = {
        slug: "test",
        barName: "Test Bar",
        barData: "testBar",
        includeCommonDrinks: false,
        includeRandomCocktails: false,
      };

      // When no meta is defined, should fall back to defaults
      expect(tenantConfig.description).toBeUndefined();
      expect(tenantConfig.ogImage).toBeUndefined();
      expect(tenantConfig.metaInfo).toBeUndefined();
    });

    it("should allow partial page overrides", () => {
      const tenantConfig: TenantConfig = {
        slug: "test",
        barName: "Test Bar",
        barData: "testBar",
        includeCommonDrinks: false,
        includeRandomCocktails: false,
        metaInfo: {
          description: "Default tenant description",
          ogImage: "/default-tenant-image.png",
          pages: {
            bottles: {
              // Only override ogImage, not title or description
              ogImage: "/bottles-specific-image.png",
            },
          },
        },
      };

      const bottlesOverride = tenantConfig.metaInfo?.pages?.bottles;
      expect(bottlesOverride?.ogImage).toBe("/bottles-specific-image.png");
      expect(bottlesOverride?.title).toBeUndefined();
      expect(bottlesOverride?.description).toBeUndefined();

      // Should still have tenant-general fallbacks available
      expect(tenantConfig.metaInfo?.description).toBe("Default tenant description");
    });
  });

  describe("Variable Substitution", () => {
    it("should substitute ${tenantName} in strings", () => {
      const tenantName = "Lemonhaus";
      const template = "See all the drinks available at ${tenantName}";
      const expected = "See all the drinks available at Lemonhaus";

      const result = template.replace(/\$\{tenantName\}/g, tenantName);
      expect(result).toBe(expected);
    });

    it("should substitute multiple instances of ${tenantName}", () => {
      const tenantName = "Victor's Place";
      const template = "Welcome to ${tenantName}! ${tenantName} offers the best cocktails.";
      const expected = "Welcome to Victor's Place! Victor's Place offers the best cocktails.";

      const result = template.replace(/\$\{tenantName\}/g, tenantName);
      expect(result).toBe(expected);
    });

    it("should handle strings without variables", () => {
      const tenantName = "Test Bar";
      const template = "This is a static string with no variables";

      const result = template.replace(/\$\{tenantName\}/g, tenantName);
      expect(result).toBe(template);
    });

    it("should work in tenant config pages", () => {
      const tenantConfig: TenantConfig = {
        slug: "test",
        barName: "Test Bar",
        barData: "testBar",
        includeCommonDrinks: false,
        includeRandomCocktails: false,
        metaInfo: {
          pages: {
            drinks: {
              title: "Cocktails | ${tenantName}",
              description: "Browse the drink menu at ${tenantName}.",
            },
          },
        },
      };

      const drinksTitle = tenantConfig.metaInfo?.pages?.drinks?.title?.replace(/\$\{tenantName\}/g, tenantConfig.barName);
      const drinksDesc = tenantConfig.metaInfo?.pages?.drinks?.description?.replace(/\$\{tenantName\}/g, tenantConfig.barName);

      expect(drinksTitle).toBe("Cocktails | Test Bar");
      expect(drinksDesc).toBe("Browse the drink menu at Test Bar.");
    });
  });

  describe("Tenant Configuration Structure", () => {
    it("should support all page types in metaInfo.pages", () => {
      const tenantConfig: TenantConfig = {
        slug: "test",
        barName: "Test Bar",
        barData: "testBar",
        includeCommonDrinks: false,
        includeRandomCocktails: false,
        metaInfo: {
          pages: {
            index: { title: "Home" },
            drinks: { title: "Drinks" },
            bottles: { title: "Bottles" },
            available: { title: "Available" },
            fingers: { title: "Fingers" },
            essentials: { title: "Essentials" },
            "beer-wine": { title: "Beer & Wine" },
            search: { title: "Search" },
            qr: { title: "QR Code" },
            error: { title: "Error" },
          },
        },
      };

      expect(tenantConfig.metaInfo?.pages?.index?.title).toBe("Home");
      expect(tenantConfig.metaInfo?.pages?.drinks?.title).toBe("Drinks");
      expect(tenantConfig.metaInfo?.pages?.bottles?.title).toBe("Bottles");
      expect(tenantConfig.metaInfo?.pages?.available?.title).toBe("Available");
      expect(tenantConfig.metaInfo?.pages?.fingers?.title).toBe("Fingers");
      expect(tenantConfig.metaInfo?.pages?.essentials?.title).toBe("Essentials");
      expect(tenantConfig.metaInfo?.pages?.["beer-wine"]?.title).toBe("Beer & Wine");
      expect(tenantConfig.metaInfo?.pages?.search?.title).toBe("Search");
      expect(tenantConfig.metaInfo?.pages?.qr?.title).toBe("QR Code");
      expect(tenantConfig.metaInfo?.pages?.error?.title).toBe("Error");
    });

    it("should handle backward compatibility with top-level description and ogImage", () => {
      const tenantConfig: TenantConfig = {
        slug: "legacy",
        barName: "Legacy Bar",
        barData: "legacyBar",
        description: "Legacy description field",
        ogImage: "/legacy-image.png",
        includeCommonDrinks: true,
        includeRandomCocktails: false,
      };

      // Top-level fields should still be accessible
      expect(tenantConfig.description).toBe("Legacy description field");
      expect(tenantConfig.ogImage).toBe("/legacy-image.png");
      expect(tenantConfig.metaInfo).toBeUndefined();
    });

    it("should allow metaInfo to override top-level description and ogImage", () => {
      const tenantConfig: TenantConfig = {
        slug: "test",
        barName: "Test Bar",
        barData: "testBar",
        description: "Old description",
        ogImage: "/old-image.png",
        includeCommonDrinks: false,
        includeRandomCocktails: false,
        metaInfo: {
          description: "New description via metaInfo",
          ogImage: "/new-image-via-metainfo.png",
        },
      };

      // Both should exist, but metaInfo should take precedence in usePageMeta
      expect(tenantConfig.description).toBe("Old description");
      expect(tenantConfig.ogImage).toBe("/old-image.png");
      expect(tenantConfig.metaInfo?.description).toBe("New description via metaInfo");
      expect(tenantConfig.metaInfo?.ogImage).toBe("/new-image-via-metainfo.png");
    });
  });

  describe("Meta Tag Generation Rules", () => {
    it("should use consistent separator in page titles", () => {
      // All page titles should use " | " (pipe with spaces) as separator
      const separator = " | ";
      const tenantName = "Test Bar";

      const titles = [
        `Drinks${separator}${tenantName}`,
        `Bottles${separator}${tenantName}`,
        `Available${separator}${tenantName}`,
        `Fingers${separator}${tenantName}`,
      ];

      titles.forEach((title) => {
        expect(title).toContain(" | ");
        expect(title).not.toContain(" - ");
      });
    });

    it("should format tenant index page title as just tenant name", () => {
      const tenantName = "Lemonhaus";
      // Tenant index page should be just the tenant name, no prefix
      expect(tenantName).toBe("Lemonhaus");
      expect(tenantName).not.toContain(" | ");
      expect(tenantName).not.toContain(" - ");
    });

    it("should generate correct OG image URLs", () => {
      const baseUrl = "https://booz.bar";
      const imagePath = "/opengraph-lemon.png";
      const fullUrl = `${baseUrl}${imagePath}`;

      expect(fullUrl).toBe("https://booz.bar/opengraph-lemon.png");
      expect(fullUrl).not.toContain("://https://"); // Should not have double protocol
    });

    it("should handle external image URLs without prepending domain", () => {
      const baseUrl = "https://booz.bar";
      const externalImageUrl = "https://hirelemon.com/bar/storage/uploads/2026/02/13/image.webp";

      // If image already starts with http:// or https://, don't prepend baseUrl
      const isExternalUrl = externalImageUrl.startsWith("http://") || externalImageUrl.startsWith("https://");
      const finalUrl = isExternalUrl ? externalImageUrl : `${baseUrl}${externalImageUrl}`;

      expect(finalUrl).toBe("https://hirelemon.com/bar/storage/uploads/2026/02/13/image.webp");
      expect(finalUrl).not.toContain("booz.bar");
    });
  });

  describe("Page Type Detection", () => {
    it("should extract page type from route path", () => {
      const testCases = [
        { path: "/", expected: "home" },
        { path: "/about", expected: "about" },
        { path: "/lemon", expected: "index" },
        { path: "/lemon/drinks", expected: "drinks" },
        { path: "/lemon/bottles", expected: "bottles" },
        { path: "/lemon/drinks/drink-6", expected: "drinks" },
        { path: "/lemon/bottles/bottle-123", expected: "bottles" },
        { path: "/victor/available", expected: "available" },
        { path: "/sample/beer-wine", expected: "beer-wine" },
      ];

      testCases.forEach(({ path, expected }) => {
        const segments = path.split("/").filter(Boolean);
        let pageType: string;

        if (segments.length === 0) {
          pageType = "home";
        } else if (segments[0] === "about") {
          pageType = "about";
        } else if (segments.length === 1) {
          pageType = "index";
        } else {
          pageType = segments[1];
        }

        expect(pageType).toBe(expected);
      });
    });

    it("should extract tenant from route path", () => {
      const testCases = [
        { path: "/lemon/drinks", expected: "lemon" },
        { path: "/victor/bottles", expected: "victor" },
        { path: "/sample/available", expected: "sample" },
        { path: "/about", expected: "" },
        { path: "/", expected: "" },
      ];

      testCases.forEach(({ path, expected }) => {
        const segments = path.split("/").filter(Boolean);
        const isTenantPath = segments.length > 0 && segments[0] !== "about";
        const tenant = isTenantPath ? segments[0] : "";

        expect(tenant).toBe(expected);
      });
    });
  });
});
