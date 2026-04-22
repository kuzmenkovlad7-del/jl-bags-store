export interface CategoryContent {
  heading?: { uk: string; ru: string }
  subtitle?: { uk: string; ru: string }
  intro?: { uk: string; ru: string }
  seoText?: { uk: string; ru: string }
  faq?: Array<{
    q: { uk: string; ru: string }
    a: { uk: string; ru: string }
  }>
}

// Keyed by category slug.
// Populate when the client provides copy. All fields are optional —
// missing entries are silently skipped and nothing is rendered.
//
// Example shape (uncomment, fill in, and redeploy):
// ryukzak_ekoshkira: {
//   heading: { uk: 'Рюкзаки з екошкіри', ru: 'Рюкзаки из экокожи' },
//   subtitle: {
//     uk: 'Стильні та практичні рюкзаки для міста та подорожей',
//     ru: 'Стильные и практичные рюкзаки для города и путешествий',
//   },
//   intro: {
//     uk: 'Рюкзаки з екошкіри Julia Lebedeva — ідеальне поєднання стилю та практичності...',
//     ru: 'Рюкзаки из экокожи Julia Lebedeva — идеальное сочетание стиля и практичности...',
//   },
//   faq: [
//     {
//       q: { uk: 'Як доглядати за рюкзаком з екошкіри?', ru: 'Как ухаживать за рюкзаком из экокожи?' },
//       a: { uk: 'Протирайте вологою серветкою...', ru: 'Протирайте влажной салфеткой...' },
//     },
//   ],
//   seoText: {
//     uk: 'Купити рюкзак з екошкіри в Україні від виробника...',
//     ru: 'Купить рюкзак из экокожи в Украине от производителя...',
//   },
// },
export const CATEGORY_CONTENT: Record<string, CategoryContent> = {}
