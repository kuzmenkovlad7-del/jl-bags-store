// Priority product slugs — add to surface them in the featured/recommended section on the homepage.
// Products are displayed in the order listed here.
// HomeFeaturedSection self-hides when this list is empty.
export const FEATURED_PRODUCT_SLUGS: string[] = []

// Priority category slugs — when populated, these categories receive visual emphasis in the homepage grid.
// Order determines display priority.
export const FEATURED_CATEGORY_SLUGS: string[] = []

// Known commercial anchor product codes for the "Популярні моделі" section.
// Products that don't exist in the DB are silently skipped.
// Clear this array to hide the section entirely.
export const POPULAR_PRODUCT_CODES: string[] = ['5285', '5141', '5145', '5317']
