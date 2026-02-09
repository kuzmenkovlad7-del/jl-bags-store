const fs = require('fs')

const fxPath = 'components/ui/full-screen-scroll-fx.tsx'
let fx = fs.readFileSync(fxPath, 'utf8')

const start = '/* === ALIGN HOTFIX START === */'
const end = '/* === ALIGN HOTFIX END === */'

const newBlock = `
          /* === ALIGN HOTFIX START === */
          .fx.fx .fx-content{
            grid-template-columns: 1fr minmax(0,1.15fr) 1fr !important;
            align-items: center !important;
          }

          .fx.fx .fx-left,
          .fx.fx .fx-right{
            display: grid !important;
            align-content: center !important;
            height: 52vh !important;
            overflow: hidden !important;
            transform: translateY(-4vh) !important;
          }

          .fx.fx .fx-left{
            justify-items: start !important;
            padding-left: clamp(6px, 1vw, 18px) !important;
          }

          .fx.fx .fx-right{
            justify-items: end !important;
            padding-right: clamp(6px, 1vw, 18px) !important;
          }

          .fx.fx .fx-center{
            position: relative !important;
            display: grid !important;
            place-items: center !important;
            width: 100% !important;
            height: min(56vh, 580px) !important;
            min-height: 46vh !important;
            margin-top: clamp(26px, 4.8vh, 74px) !important; /* больше отступ от верхнего заголовка */
            overflow: visible !important;
          }

          .fx.fx .fx-featured{
            position: absolute !important;
            inset: 0 !important;
            width: min(92vw, 1040px) !important;
            margin: 0 auto !important;
            display: grid !important;
            place-items: center !important;
            text-align: center !important;
            padding-inline: clamp(10px, 1.8vw, 24px) !important;
          }

          .fx.fx .fx-featured-title{
            margin: 0 auto !important;
            width: auto !important;
            max-width: min(92vw, 980px) !important;
            text-align: center !important;
            line-height: .93 !important;
            letter-spacing: -0.015em !important;
            word-break: keep-all !important;
            overflow-wrap: normal !important;
            white-space: normal !important;
          }

          .fx.fx .fx-progress{
            width: min(320px, 42vw) !important;
            margin-top: .95rem !important;
          }

          .fx.fx .fx-progress-numbers{
            font-size: clamp(.72rem, .82vw, .9rem) !important;
            font-weight: 500 !important;
            letter-spacing: .02em !important;
          }

          @media (max-width: 900px){
            .fx.fx .fx-content{
              grid-template-columns: 1fr !important;
            }

            .fx.fx .fx-left,
            .fx.fx .fx-right{
              display: none !important;
            }

            .fx.fx .fx-center{
              height: auto !important;
              min-height: 36vh !important;
              margin-top: clamp(8px, 1.8vh, 18px) !important;
            }

            .fx.fx .fx-featured{
              position: static !important;
              inset: auto !important;
              width: 100% !important;
              padding-inline: 10px !important;
            }

            .fx.fx .fx-featured:not(.active){
              display: none !important;
            }

            .fx.fx .fx-featured-title{
              max-width: 95vw !important;
              font-size: clamp(1.9rem, 10.4vw, 3.4rem) !important;
              line-height: .94 !important;
              word-break: keep-all !important;
              overflow-wrap: normal !important;
            }

            .fx.fx .fx-progress{
              width: min(250px, 64vw) !important;
            }

            .fx.fx .fx-progress-numbers{
              font-size: .76rem !important;
            }
          }
          /* === ALIGN HOTFIX END === */
`

const s = fx.indexOf(start)
const e = fx.indexOf(end)

if (s !== -1 && e !== -1 && e > s) {
  fx = fx.slice(0, s) + newBlock + fx.slice(e + end.length)
} else {
  const needle = '`}</style>'
  const p = fx.lastIndexOf(needle)
  if (p === -1) {
    console.error('Не найден конец style jsx в full-screen-scroll-fx.tsx')
    process.exit(1)
  }
  fx = fx.slice(0, p) + newBlock + '\n\n        ' + fx.slice(p)
}

fs.writeFileSync(fxPath, fx, 'utf8')
console.log('OK: full-screen-scroll-fx.tsx обновлен')
