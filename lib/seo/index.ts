import { dataForSeoProvider } from "./dataforseo-provider";
import type { SeoProvider } from "./seo-provider";

export * from "./seo-provider";

/**
 * The provider interface exists so a second implementation (or a fixture for
 * tests) can be swapped in without touching call sites. This deployment
 * always runs live against DataForSEO, cached per lib/seo/provider-cache.ts.
 */
export const seoProvider: SeoProvider = dataForSeoProvider;
