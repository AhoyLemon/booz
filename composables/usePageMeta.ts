export type PageMeta = {
  title?: string;
  description?: string;
  ogDescription?: string; // optional OG-specific description
  ogImage?: string;
};

/**
 * usePageMeta
 * - Writes a small SSR-friendly state (`currentPageMeta`) so layouts can prefer
 *   page-provided meta during server render.
 * - Calls useHead() to set title and description (works both SSR and client).
 */
export const usePageMeta = (meta: PageMeta = {}) => {
  const state = useState<PageMeta>("currentPageMeta", () => ({}) as PageMeta);

  if (meta.title) state.value.title = meta.title;
  if (meta.description) state.value.description = meta.description;
  if (meta.ogDescription) state.value.ogDescription = meta.ogDescription;
  if (meta.ogImage) state.value.ogImage = meta.ogImage;

  useHead({
    title: meta.title,
    meta: meta.description ? [{ name: "description", content: meta.description }] : [],
  });

  return state;
};

export default usePageMeta;
