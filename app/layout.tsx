import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "Julia Lebedeva — Преміальні жіночі сумки в Україні",
  description: "Преміальні жіночі сумки та аксесуари від Julia Lebedeva. Актуальні колекції, швидка доставка по Україні, опт для партнерів.",
  keywords: "жіночі сумки, сумки Україна, Julia Lebedeva, преміальні сумки, опт сумки, дропшипінг",
  icons: {
    icon: "/branding/logo-round.png",
  },
  openGraph: {
    title: "Julia Lebedeva — Преміальні жіночі сумки",
    description: "Преміальні жіночі сумки та аксесуари. Актуальні колекції, швидка доставка.",
    type: "website",
    locale: "uk_UA",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
