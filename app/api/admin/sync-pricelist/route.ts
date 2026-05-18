import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServiceSupabase, parseCSV, runImportFromVariants } from '@/lib/pricelist-import'

export const runtime = 'nodejs'
export const maxDuration = 60

// ── URL normalization ─────────────────────────────────────────────────────────

type SourceType = 'csv' | 'published' | 'spreadsheet' | 'raw'

function resolveGoogleSheetsCSVUrl(raw: string): { csvUrl: string; sourceType: SourceType } {
  const input = raw.trim()

  // Already a proper CSV export URL
  if (/[?&]output=csv/.test(input) || /[?&]format=csv/.test(input)) {
    return { csvUrl: input, sourceType: 'csv' }
  }

  // Published URL pattern: /spreadsheets/d/e/{pubId}/
  const pubMatch = input.match(/\/spreadsheets\/d\/e\/([^\/?\s]+)/)
  if (pubMatch) {
    const pubId = pubMatch[1]
    const gidMatch = input.match(/[?&]gid=(\d+)/)
    const gid = gidMatch ? gidMatch[1] : '0'
    return {
      csvUrl:     `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?gid=${gid}&single=true&output=csv`,
      sourceType: 'published',
    }
  }

  // Normal spreadsheet: /spreadsheets/d/{spreadsheetId}/
  const normalMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (normalMatch) {
    const sheetId   = normalMatch[1]
    const gidMatch  = input.match(/[?&]gid=(\d+)/)
    const gid       = gidMatch ? gidMatch[1] : '0'
    return {
      csvUrl:     `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
      sourceType: 'spreadsheet',
    }
  }

  return { csvUrl: input, sourceType: 'raw' }
}

function safeLogUrl(url: string): string {
  try {
    const u = new URL(url)
    return `${u.origin}${u.pathname}`
  } catch {
    return '[invalid URL]'
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth: verify the Supabase session token sent by the logged-in admin
    const authHeader = req.headers.get('authorization') ?? ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ ok: false, error: 'Supabase не настроен на сервере' }, { status: 500 })
    }
    const authClient = createClient(url, key, { auth: { persistSession: false } })
    const { data: { user }, error: authError } = await authClient.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Resolve sheet URL
    const rawSheetUrl = process.env.GOOGLE_SHEET_CSV_URL
    if (!rawSheetUrl) {
      return NextResponse.json({
        ok: false,
        error: 'GOOGLE_SHEET_CSV_URL не задан на сервере. Добавьте переменную окружения в Vercel.',
      }, { status: 500 })
    }

    const { csvUrl, sourceType } = resolveGoogleSheetsCSVUrl(rawSheetUrl)
    console.log('[sync-pricelist] source:', sourceType, 'raw:', safeLogUrl(rawSheetUrl))
    console.log('[sync-pricelist] csv url:', safeLogUrl(csvUrl))

    // Fetch CSV
    const fetchRes = await fetch(csvUrl, { cache: 'no-store' })
    const contentType = fetchRes.headers.get('content-type') ?? ''

    console.log('[sync-pricelist] fetch status:', fetchRes.status, 'content-type:', contentType)

    if (!fetchRes.ok) {
      const isPrivate = fetchRes.status === 401 || fetchRes.status === 403
      const is404     = fetchRes.status === 404

      let hint = ''
      if (is404 && sourceType === 'published') {
        hint = ' Убедитесь, что ID публичной ссылки актуален. Переопубликуйте таблицу: Файл → Поделиться → Опубликовать в интернете → CSV.'
      } else if (isPrivate || (is404 && sourceType === 'spreadsheet')) {
        hint = ' Таблица закрыта. Опубликуйте нужный лист: Файл → Поделиться → Опубликовать в интернете → выберите лист → CSV.'
      }

      return NextResponse.json({
        ok:     false,
        error:  `Ошибка загрузки Google Sheets: ${fetchRes.status} ${fetchRes.statusText}.${hint}`,
        detail: { status: fetchRes.status, statusText: fetchRes.statusText, sourceType },
      }, { status: 502 })
    }

    // Detect HTML response (e.g. login page returned instead of CSV)
    if (contentType.includes('text/html')) {
      return NextResponse.json({
        ok:    false,
        error: 'Google вернул HTML-страницу вместо CSV. Таблица не опубликована как CSV. ' +
               'Откройте таблицу → Файл → Поделиться → Опубликовать в интернете → выберите нужный лист → формат CSV → Опубликовать.',
        detail: { contentType, sourceType },
      }, { status: 502 })
    }

    const csvText = await fetchRes.text()

    // Parse
    const { variants, skipped } = parseCSV(csvText)
    if (variants.length === 0) {
      return NextResponse.json({
        ok:    false,
        error: `CSV получен, но пригодных строк не найдено (пропущено: ${skipped}). Проверьте формат таблицы — нужны колонки B (товар), C (остаток), D (цена).`,
      }, { status: 422 })
    }

    // Run import
    const supabase = getServiceSupabase()
    const report   = await runImportFromVariants(variants, supabase)

    return NextResponse.json({ ok: true, report, rowsSkipped: skipped, sourceType })
  } catch (e: any) {
    console.error('[sync-pricelist] unexpected error:', e?.message)
    return NextResponse.json(
      { ok: false, error: e?.message ?? 'Неожиданная ошибка сервера' },
      { status: 500 }
    )
  }
}
