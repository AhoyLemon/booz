/**
 * Utility composable for highlighting search matches in text
 */
export const useSearchHighlight = () => {
  /**
   * Highlights all occurrences of searchTerm in text with <mark> tags
   * @param text The text to search within
   * @param searchTerm The term to highlight
   * @returns HTML string with highlighted matches
   */
  const highlightText = (text: string, searchTerm: string): string => {
    if (!text || !searchTerm.trim()) {
      return text;
    }

    const normalized = searchTerm.trim();
    // Use a case-insensitive regex with global flag to match all occurrences
    const regex = new RegExp(`(${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");

    // Replace all matches with <mark> tags
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  };

  /**
   * Checks if a string contains the search term (case-insensitive)
   * @param text The text to search within
   * @param searchTerm The term to search for
   * @returns true if text contains searchTerm
   */
  const containsSearchTerm = (text: string, searchTerm: string): boolean => {
    if (!text || !searchTerm.trim()) {
      return false;
    }
    return text.toLowerCase().includes(searchTerm.trim().toLowerCase());
  };

  return {
    highlightText,
    containsSearchTerm,
  };
};
