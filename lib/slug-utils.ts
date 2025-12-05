/**
 * Utility functions for generating and handling memorial slugs
 */

/**
 * Generates a URL-friendly slug from a given text
 * @param text - The input text (typically a person's full name)
 * @returns A URL-safe slug
 */
export function generateSlug(text: string): string {
  if (!text) return 'memorial'
  
  return text
    .toLowerCase()
    .trim()
    // Remove special characters except spaces and hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace multiple spaces with single spaces
    .replace(/\s+/g, ' ')
    // Replace spaces with hyphens
    .replace(/\s/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
    || 'memorial' // Fallback if everything was removed
}

/**
 * Ensures a slug is unique by checking against existing slugs
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 */
export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let uniqueSlug = baseSlug
  let counter = 1
  
  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${counter}`
    counter++
  }
  
  return uniqueSlug
}

/**
 * Validates that a slug meets our requirements
 * @param slug - The slug to validate
 * @returns True if valid, false otherwise
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length === 0) return false
  if (slug.length > 100) return false // Reasonable length limit
  
  // Must contain only lowercase letters, numbers, and hyphens
  // Cannot start or end with hyphens
  // Cannot have consecutive hyphens
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugPattern.test(slug)
}

/**
 * Extracts potential name parts for better slug generation
 * @param fullName - The full name to process
 * @returns An object with first and last name components
 */
export function parseNameForSlug(fullName: string): { firstName: string; lastName: string; slug: string } {
  const nameParts = fullName.trim().split(/\s+/)
  const firstName = nameParts[0] || ''
  const lastName = nameParts[nameParts.length - 1] || ''
  
  // For slug, prefer first-last format for shorter, cleaner URLs
  let slug: string
  if (nameParts.length === 1) {
    slug = generateSlug(firstName)
  } else if (nameParts.length === 2) {
    slug = generateSlug(`${firstName} ${lastName}`)
  } else {
    // For longer names, use first and last
    slug = generateSlug(`${firstName} ${lastName}`)
  }
  
  return { firstName, lastName, slug }
}
