const fs = require('fs')
const path = require('path')

const root = process.cwd()
const fxPath = path.join(root, 'components/ui/full-screen-scroll-fx.tsx')
const heroPath = path.join(root, 'components/ui/hero-slider.tsx')

if (!fs.existsSync(fxPath)) {
  throw new Error(`Не найден файл: ${fxPath}`)
}

let fx = fs.readFileSync(fxPath, 'utf8')

// убираем предыдущий инжект (если уже запускали)
fx = fx.replace(/\/\* HERO_FIX_START \*\/[\s\S]*?\/\* HERO_FIX_END \*\//g, '')

const cssPatch = `
/* HERO_FIX_START */
.fx-grid {
  grid-template-columns: minmax(160px,1fr) minmax(460px,980px) minmax(160px,1fr) !important;
  align-items: center !important;
}
.fx-content {
  grid-column: 2 !important;
  justify-items: center !important;
  text-align: center !important;
  padding-top: clamp(18px, 3vh, 46px) !important;
}
.fx-left {
  grid-column: 1 !important;
  justify-self: start !important;
  align-self: center !important;
  padding-left: clamp(20px, 3.4vw, 64px) !important;
}
.fx-right {
  grid-column: 3 !important;
  justify-self: end !important;
  align-self: center !important;
  padding-right: clamp(20px, 3.4vw, 64px) !important;
  text-align: right !important;
}
.fx-featured,
.fx-featured.active {
  display: grid !important;
  place-items: center !important;
}
.fx-featured-title {
  margin: 0 auto !important;
  text-align: center !important;
  white-space: nowrap !important;
  text-wrap: nowrap !important;
  max-width: none !important;
  width: auto !important;
}

@media (max-width: 1100px) {
  .fx-grid {
    grid-template-columns: 1fr !important;
  }

  .fx-content {
    grid-column: 1 !important;
    justify-items: center !important;
    text-align: center !important;
    margin-top: clamp(34px, 8.5vh, 78px) !important; /* больше отступ от верхнего заголовка */
    padding-top: 0 !important;
  }

  .fx-featured-title {
    font-size: clamp(2rem, 10vw, 4.2rem) !important;
    line-height: .96 !important;
    white-space: nowrap !important;
  }

  .fx-left,
  .fx-right {
    position: absolute !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    z-index: 4 !important;
    width: auto !important;
    max-width: 34vw !important;
    padding: 0 12px !important;
  }

  .fx-left { left: 8px !important; }
  .fx-right { right: 8px !important; }
}

@media (max-width: 640px) {
  .fx-content {
    margin-top: clamp(44px, 10.5vh, 92px) !important;
  }

  .fx-featured-title {
    font-size: clamp(1.9rem, 10.4vw, 3.2rem) !important;
    letter-spacing: -0.01em !important;
    white-space: nowrap !important;
  }

  .fx-progress {
    width: min(75vw, 260px) !important;
  }
}
/* HERO_FIX_END */
`

if (!/`}\s*<\/style>/.test(fx)) {
  throw new Error('Не найден блок <style jsx>{`...`}</style> в full-screen-scroll-fx.tsx')
}

fx = fx.replace(/`}\s*<\/style>/, `${cssPatch}\n        \`}</style>`)
fs.writeFileSync(fxPath, fx, 'utf8')

// Доп. нормализация текстов в hero-slider, чтобы не было forced line-break
if (fs.existsSync(heroPath)) {
  let hero = fs.readFileSync(heroPath, 'utf8')

  hero = hero.replace(/([Пп]реміальна)\s*\\\\n\s*([Яя]кість)/g, '$1 $2')
  hero = hero.replace(/([Пп]реміальна)\s*\n\s*([Яя]кість)/g, '$1 $2')

  hero = hero.replace(/([Жж]іночі)\s*\\\\n\s*([Сс]умки)/g, '$1 $2')
  hero = hero.replace(/([Жж]іночі)\s*\n\s*([Сс]умки)/g, '$1 $2')

  fs.writeFileSync(heroPath, hero, 'utf8')
}

console.log('Готово: фикс применен')
