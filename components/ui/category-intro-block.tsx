import { CATEGORY_CONTENT } from '@/lib/category-content'
import { Locale } from '@/lib/i18n'

interface CategoryIntroBlockProps {
  categorySlug: string
  locale: Locale
}

export function CategoryIntroBlock({ categorySlug, locale }: CategoryIntroBlockProps) {
  const content = CATEGORY_CONTENT[categorySlug]
  if (!content) return null

  const intro = content.intro?.[locale]
  const seoText = content.seoText?.[locale]
  const faq = content.faq

  if (!intro && !seoText && (!faq || faq.length === 0)) return null

  return (
    <div className="mt-16 border-t pt-12 space-y-10">
      {intro && (
        <p className="text-muted-foreground leading-relaxed max-w-2xl">{intro}</p>
      )}

      {faq && faq.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-5">
            {locale === 'ru' ? 'Вопросы о товаре' : 'Питання про товар'}
          </h2>
          <div className="space-y-5">
            {faq.map((item, i) => (
              <div key={i} className="border-b pb-5 last:border-0 last:pb-0">
                <p className="font-medium mb-1.5">{item.q[locale]}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a[locale]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {seoText && (
        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">{seoText}</p>
      )}
    </div>
  )
}
