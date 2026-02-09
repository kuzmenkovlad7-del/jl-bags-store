'use client'

import React, {
 CSSProperties,
 ReactNode,
 forwardRef,
 useEffect,
 useImperativeHandle,
 useLayoutEffect,
 useRef,
 useState,
} from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
 gsap.registerPlugin(ScrollTrigger)
}

type Section = {
 id?: string
 background: string
 leftLabel?: ReactNode
 title: string | ReactNode
 rightLabel?: ReactNode
 ctaLabel?: ReactNode
 ctaHref?: string
 renderBackground?: (active: boolean, previous: boolean) => ReactNode
}

type Colors = Partial<{
 text: string
 overlay: string
 pageBg: string
 stageBg: string
}>

type Durations = Partial<{
 change: number
 snap: number
}>

export type FullScreenFXAPI = {
 next: () => void
 prev: () => void
 goTo: (index: number) => void
 getIndex: () => number
 refresh: () => void
}

export type FullScreenFXProps = {
 sections: Section[]
 className?: string
 style?: CSSProperties
 fontFamily?: string
 headerFontFamily?: string
 headerFontWeight?: number
 header?: ReactNode
 gap?: number
 gridPaddingX?: number
 showProgress?: boolean
 debug?: boolean
 durations?: Durations
 reduceMotion?: boolean
 bgTransition?: 'fade' | 'wipe'
 parallaxAmount?: number
 currentIndex?: number
 onIndexChange?: (index: number) => void
 initialIndex?: number
 colors?: Colors
 apiRef?: React.Ref<FullScreenFXAPI>
 ariaLabel?: string
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export const FullScreenScrollFX = forwardRef<HTMLDivElement, FullScreenFXProps>(
 (
  {
   sections,
   className,
   style,
   fontFamily = '"Rubik", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
   headerFontFamily = '"Inter", "Helvetica Neue", Arial, sans-serif',
   headerFontWeight = 320,
   header,
   gap = 1,
   gridPaddingX = 2,
   showProgress = true,
   debug = false,
   durations = { change: 0.72, snap: 900 },
   reduceMotion,
   bgTransition = 'fade',
   parallaxAmount = 4,
   currentIndex,
   onIndexChange,
   initialIndex = 0,
   colors = {
    text: 'rgba(245,245,245,0.96)',
    overlay: 'rgba(0,0,0,0.30)',
    pageBg: '#000000',
    stageBg: '#000000',
   },
   apiRef,
   ariaLabel = 'Full screen scroll slideshow',
  },
  ref
 ) => {
  const total = sections.length
  const [localIndex, setLocalIndex] = useState(clamp(initialIndex, 0, Math.max(0, total - 1)))
  const isControlled = typeof currentIndex === 'number'
  const index = isControlled ? clamp(currentIndex!, 0, Math.max(0, total - 1)) : localIndex

  const rootRef = useRef<HTMLDivElement | null>(null)
  const fixedRef = useRef<HTMLDivElement | null>(null)
  const fixedSectionRef = useRef<HTMLDivElement | null>(null)

  const bgRefs = useRef<HTMLImageElement[]>([])
  const titleRefs = useRef<HTMLHeadingElement[]>([])

  const progressFillRef = useRef<HTMLDivElement | null>(null)
  const currentNumberRef = useRef<HTMLSpanElement | null>(null)

  const sectionTopRef = useRef<number[]>([])
  const stRef = useRef<ScrollTrigger | null>(null)
  const lastIndexRef = useRef(index)
  const isAnimatingRef = useRef(false)

  const prefersReduced =
   typeof window !== 'undefined'
    ? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    : false
  const motionOff = reduceMotion ?? prefersReduced

  const setProgress = (i: number) => {
   if (currentNumberRef.current) currentNumberRef.current.textContent = String(i + 1).padStart(2, '0')
   if (progressFillRef.current) {
    const p = (i / (total - 1 || 1)) * 100
    progressFillRef.current.style.width = `${p}%`
   }
  }

  const computePositions = () => {
   const el = fixedSectionRef.current
   if (!el || total === 0) return
   const top = el.offsetTop
   const h = el.offsetHeight
   const arr: number[] = []
   for (let i = 0; i < total; i++) arr.push(top + (h * i) / total)
   sectionTopRef.current = arr
  }

  const changeSection = (to: number) => {
   if (to === lastIndexRef.current || isAnimatingRef.current || total === 0) return

   const from = lastIndexRef.current
   const down = to > from
   const D = durations.change ?? 0.72
   isAnimatingRef.current = true

   if (!isControlled) setLocalIndex(to)
   onIndexChange?.(to)
   setProgress(to)

   const outTitle = titleRefs.current[from]
   const inTitle = titleRefs.current[to]

   if (motionOff) {
    if (outTitle) gsap.set(outTitle, { opacity: 0, y: 0 })
    if (inTitle) gsap.set(inTitle, { opacity: 1, y: 0 })
    const prevBg = bgRefs.current[from]
    const nextBg = bgRefs.current[to]
    if (prevBg) gsap.set(prevBg, { opacity: 0, yPercent: 0, scale: 1 })
    if (nextBg) gsap.set(nextBg, { opacity: 1, yPercent: 0, scale: 1 })
    lastIndexRef.current = to
    isAnimatingRef.current = false
    return
   }

   if (outTitle) {
    gsap.to(outTitle, {
     y: down ? -18 : 18,
     opacity: 0,
     duration: D * 0.55,
     ease: 'power3.out',
    })
   }

   if (inTitle) {
    gsap.set(inTitle, { y: down ? 18 : -18, opacity: 0 })
    gsap.to(inTitle, {
     y: 0,
     opacity: 1,
     duration: D * 0.9,
     ease: 'power3.out',
    })
   }

   const prevBg = bgRefs.current[from]
   const nextBg = bgRefs.current[to]

   if (bgTransition === 'fade') {
    if (nextBg) {
     gsap.set(nextBg, { opacity: 0, scale: 1.03, yPercent: down ? 1 : -1 })
     gsap.to(nextBg, { opacity: 1, scale: 1, yPercent: 0, duration: D, ease: 'power2.out' })
    }
    if (prevBg) {
     gsap.to(prevBg, {
      opacity: 0,
      yPercent: down ? -parallaxAmount : parallaxAmount,
      duration: D,
      ease: 'power2.out',
     })
    }
   } else {
    if (nextBg) {
     gsap.set(nextBg, {
      opacity: 1,
      clipPath: down ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)',
     })
     gsap.to(nextBg, { clipPath: 'inset(0 0 0 0)', duration: D, ease: 'power3.out' })
    }
    if (prevBg) gsap.to(prevBg, { opacity: 0, duration: D * 0.8, ease: 'power2.out' })
   }

   gsap.delayedCall(D, () => {
    lastIndexRef.current = to
    isAnimatingRef.current = false
   })
  }

  const goTo = (to: number) => {
   const clamped = clamp(to, 0, total - 1)
   if (clamped === lastIndexRef.current) return
   changeSection(clamped)
   const pos = sectionTopRef.current[clamped]
   if (typeof window !== 'undefined' && typeof pos === 'number') {
    window.scrollTo({ top: pos, behavior: 'smooth' })
   }
  }

  useImperativeHandle(apiRef, () => ({
   next: () => goTo(index + 1),
   prev: () => goTo(index - 1),
   goTo,
   getIndex: () => index,
   refresh: () => ScrollTrigger.refresh(),
  }))

  useLayoutEffect(() => {
   if (typeof window === 'undefined') return
   const fixed = fixedRef.current
   const fs = fixedSectionRef.current
   if (!fixed || !fs || total === 0) return

   lastIndexRef.current = index

   const validBgs = bgRefs.current.filter(Boolean)
   const validTitles = titleRefs.current.filter(Boolean)

   gsap.set(validBgs, { opacity: 0, scale: 1.03, yPercent: 0 })
   if (bgRefs.current[index]) gsap.set(bgRefs.current[index], { opacity: 1, scale: 1, yPercent: 0 })

   gsap.set(validTitles, { opacity: 0, y: 18 })
   if (titleRefs.current[index]) gsap.set(titleRefs.current[index], { opacity: 1, y: 0 })

   setProgress(index)
   computePositions()

   const st = ScrollTrigger.create({
    trigger: fs,
    start: 'top top',
    end: 'bottom bottom',
    pin: fixed,
    pinSpacing: true,
    onUpdate: (self) => {
     if (motionOff) return
     const target = Math.min(total - 1, Math.floor(self.progress * total))
     if (target !== lastIndexRef.current && !isAnimatingRef.current) {
      changeSection(target)
     }
    },
   })

   stRef.current = st

   const ro = new ResizeObserver(() => {
    computePositions()
    ScrollTrigger.refresh()
   })
   ro.observe(fs)

   return () => {
    ro.disconnect()
    st.kill()
    stRef.current = null
   }
   // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, motionOff, bgTransition, parallaxAmount])

  useEffect(() => {
   setProgress(index)
  }, [index, total])

  const active = sections[index]

  const cssVars: CSSProperties = {
   ['--fx-font' as any]: fontFamily,
   ['--fx-header-font' as any]: headerFontFamily,
   ['--fx-header-weight' as any]: headerFontWeight,
   ['--fx-text' as any]: colors.text ?? 'rgba(245,245,245,0.96)',
   ['--fx-overlay' as any]: colors.overlay ?? 'rgba(0,0,0,0.30)',
   ['--fx-page-bg' as any]: colors.pageBg ?? '#000000',
   ['--fx-stage-bg' as any]: colors.stageBg ?? '#000000',
   ['--fx-gap' as any]: `${gap}rem`,
   ['--fx-grid-px' as any]: `${gridPaddingX}rem`,
  }

  return (
   <div
    ref={(node) => {
     ;(rootRef as any).current = node
     if (typeof ref === 'function') ref(node)
     else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
    }}
    className={['fx', className].filter(Boolean).join(' ')}
    style={{ ...cssVars, ...style }}
    aria-label={ariaLabel}
   >
    {debug && <div className="fx-debug">Section: {index + 1}</div>}

    <div className="fx-scroll">
     <div className="fx-fixed-section" ref={fixedSectionRef}>
      <div className="fx-fixed" ref={fixedRef}>
       <div className="fx-bgs" aria-hidden="true">
        {sections.map((s, i) => (
         <div className="fx-bg" key={s.id ?? i}>
          {s.renderBackground ? (
           s.renderBackground(index === i, lastIndexRef.current === i)
          ) : (
           <>
            <img
             ref={(el) => {
              if (el) bgRefs.current[i] = el
             }}
             src={s.background}
             alt=""
             className="fx-bg-img"
            />
            <div className="fx-bg-overlay" />
           </>
          )}
         </div>
        ))}
       </div>

       <div className="fx-grid">
        {header && <div className="fx-header">{header}</div>}

        <div className="fx-content">
         <div className="fx-left" role="list">
          <div className="fx-list">
           {sections.map((s, i) => (
            <div
             key={`L-${s.id ?? i}`}
             className={`fx-item fx-left-item ${i === index ? 'active' : ''}`}
             onClick={() => goTo(i)}
             role="button"
             tabIndex={0}
             onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
               e.preventDefault()
               goTo(i)
              }
             }}
             aria-pressed={i === index}
            >
             {s.leftLabel}
            </div>
           ))}
          </div>
         </div>

         <div className="fx-center">
          {sections.map((s, i) => (
           <div key={`C-${s.id ?? i}`} className={`fx-featured ${i === index ? 'active' : ''}`}>
            <h3
             className="fx-featured-title"
             ref={(el) => {
              if (el) titleRefs.current[i] = el
             }}
            >
             {s.title}
            </h3>
           </div>
          ))}
         </div>

         <div className="fx-right" role="list">
          <div className="fx-list">
           {sections.map((s, i) => (
            <div
             key={`R-${s.id ?? i}`}
             className={`fx-item fx-right-item ${i === index ? 'active' : ''}`}
             onClick={() => goTo(i)}
             role="button"
             tabIndex={0}
             onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
               e.preventDefault()
               goTo(i)
              }
             }}
             aria-pressed={i === index}
            >
             {s.rightLabel}
            </div>
           ))}
          </div>
         </div>
        </div>

        <div className="fx-footer">
         {active?.ctaLabel && (
          <a
           className="fx-cta"
           href={active.ctaHref || '#'}
           aria-label={typeof active.ctaLabel === 'string' ? active.ctaLabel : 'CTA'}
          >
           {active.ctaLabel}
          </a>
         )}

         {showProgress && (
          <div className="fx-progress">
           <div className="fx-progress-numbers">
            <span ref={currentNumberRef}>{String(index + 1).padStart(2, '0')}</span>
            <span>{String(total).padStart(2, '0')}</span>
           </div>
           <div className="fx-progress-bar">
            <div className="fx-progress-fill" ref={progressFillRef} />
           </div>
          </div>
         )}
        </div>
       </div>
      </div>
     </div>

     <div className="fx-end" />
    </div>

    <style jsx>{`
     .fx {
      width: 100%;
      overflow: hidden;
      background: var(--fx-page-bg);
      color: #fff;
      font-family: var(--fx-font);
      text-transform: uppercase;
      letter-spacing: -0.02em;
     }

     .fx-debug {
      position: fixed;
      bottom: 10px;
      right: 10px;
      z-index: 9999;
      background: rgba(255, 255, 255, 0.86);
      color: #000;
      padding: 6px 8px;
      font: 12px/1 monospace;
      border-radius: 4px;
     }

     .fx-fixed-section {
      height: ${Math.max(1, sections.length)}00vh;
      position: relative;
     }

     .fx-fixed {
      position: sticky;
      top: 0;
      height: 100vh;
      width: 100%;
      overflow: hidden;
      background: var(--fx-page-bg);
     }

     .fx-bgs {
      position: absolute;
      inset: 0;
      background: var(--fx-stage-bg);
      z-index: 1;
     }

     .fx-bg {
      position: absolute;
      inset: 0;
     }

     .fx-bg-img {
      position: absolute;
      inset: -8% 0 -8% 0;
      width: 100%;
      height: 116%;
      object-fit: cover;
      filter: brightness(0.82);
      opacity: 0;
      will-change: transform, opacity;
     }

     .fx-bg-overlay {
      position: absolute;
      inset: 0;
      background: var(--fx-overlay);
     }

     .fx-grid {
      position: relative;
      z-index: 2;
      height: 100%;
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: var(--fx-gap);
      padding: 0 var(--fx-grid-px);
     }

     .fx-header {
      grid-column: 1 / 13;
      align-self: start;
      padding-top: clamp(94px, 12vh, 152px);
      font-family: var(--fx-header-font);
      font-weight: var(--fx-header-weight);
      font-size: clamp(2rem, 8vw, 7.4rem);
      line-height: 0.86;
      letter-spacing: -0.03em;
      text-align: center;
      color: var(--fx-text);
      max-width: min(94vw, 1240px);
      margin: 0 auto;
     }

     .fx-header > * {
      display: block;
     }

     .fx-content {
      grid-column: 1 / 13;
      position: absolute;
      inset: 0;
      z-index: 3;
     }

     .fx-left,
     .fx-right {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: clamp(140px, 16vw, 260px);
      z-index: 4;
     }

     .fx-left {
      left: clamp(10px, 2.2vw, 56px);
      text-align: left;
     }

     .fx-right {
      right: clamp(10px, 2.2vw, 56px);
      text-align: right;
     }

     .fx-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
     }

     .fx-item {
      color: var(--fx-text);
      font-weight: 800;
      letter-spacing: -0.01em;
      line-height: 1.02;
      opacity: 0.34;
      transition: opacity 0.25s ease, transform 0.25s ease;
      position: relative;
      font-size: clamp(1.05rem, 2.05vw, 2.35rem);
      user-select: none;
      cursor: pointer;
      white-space: nowrap;
     }

     .fx-item.active {
      opacity: 1;
     }

     .fx-left-item.active {
      transform: translateX(8px);
      padding-left: 14px;
     }

     .fx-right-item.active {
      transform: translateX(-8px);
      padding-right: 14px;
     }

     .fx-left-item.active::before,
     .fx-right-item.active::after {
      content: '';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: var(--fx-text);
     }

     .fx-left-item.active::before {
      left: 0;
     }

     .fx-right-item.active::after {
      right: 0;
     }

     .fx-center {
      position: absolute;
      left: 50%;
      top: 50%;
      bottom: auto;
      transform: translate(-50%, 10px);
      width: min(92vw, 1180px);
      z-index: 4;
      text-align: center;
      display: grid;
      place-items: center;
     }

     .fx-featured {
      position: absolute;
      inset: auto;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      width: 100%;
      display: grid;
      place-items: center;
     }

     .fx-featured.active {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
      position: relative;
     }

     .fx-featured-title {
      margin: 0;
      color: var(--fx-text);
      font-family: var(--fx-font);
      font-weight: 820;
      letter-spacing: -0.02em;
      line-height: 0.95;
      font-size: clamp(2.15rem, 5.55vw, 5.55rem);
      text-align: center;
      white-space: nowrap;
      max-width: 100%;
     }

     .fx-footer {
      position: absolute;
      left: 0;
      right: 0;
      bottom: clamp(24px, 4.8vh, 60px);
      z-index: 4;
      text-align: center;
     }

     .fx-cta {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      border-radius: 9999px !important;
      background: #f5f5f5 !important;
      color: #121212 !important;
      border: 1px solid rgba(255, 255, 255, 0.7) !important;
      padding: 0.84rem 1.58rem !important;
      font-weight: 700 !important;
      font-size: clamp(0.95rem, 1.65vw, 1.1rem) !important;
      line-height: 1 !important;
      text-decoration: none !important;
      letter-spacing: -0.01em !important;
      transition: transform 0.18s ease, opacity 0.18s ease !important;
      cursor: pointer !important;
     }

     .fx-cta:hover {
      transform: translateY(-1px);
      opacity: 0.95;
     }

     .fx-progress {
      width: clamp(220px, 30vw, 420px);
      max-width: calc(100vw - 48px);
      margin: 1rem auto 0;
     }

     .fx-progress-numbers {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.82rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      color: var(--fx-text);
      margin-bottom: 0.42rem;
      opacity: 0.92;
     }

     .fx-progress-bar {
      height: 2px;
      background: rgba(245, 245, 245, 0.28);
      position: relative;
     }

     .fx-progress-fill {
      position: absolute;
      inset: 0 auto 0 0;
      width: 0%;
      height: 100%;
      background: var(--fx-text);
      transition: width 0.28s ease;
     }

     .fx-end {
      height: 0;
     }

     @media (max-width: 900px) {
      .fx-header {
       padding-top: calc(74px + env(safe-area-inset-top));
       font-size: clamp(1.9rem, 11vw, 3.7rem);
       line-height: 0.92;
       max-width: 92vw;
      }

      .fx-left,
      .fx-right {
       display: none;
      }

      .fx-center {
       width: 92vw;
       top: 50%;
       bottom: auto;
       transform: translate(-50%, calc(-50% - 9vh));
      }

      .fx-featured-title {
       font-size: clamp(1.75rem, 9.3vw, 3.2rem);
       line-height: 0.96;
       white-space: normal;
       text-wrap: balance;
       max-width: 92vw;
      }

      .fx-footer {
       bottom: calc(18px + env(safe-area-inset-bottom));
      }

      .fx-cta {
       padding: 0.8rem 1.35rem !important;
       font-size: 0.98rem !important;
      }

      .fx-progress {
       width: min(250px, 66vw);
       margin-top: 0.9rem;
      }

      .fx-progress-numbers {
       font-size: 0.72rem;
      }
     }
    `}</style>
   </div>
  )
 }
)

FullScreenScrollFX.displayName = 'FullScreenScrollFX'
export default FullScreenScrollFX
