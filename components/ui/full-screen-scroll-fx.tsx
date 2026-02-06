'use client'

import React, {
  CSSProperties,
  ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
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
  header?: ReactNode
  footer?: ReactNode
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

      fontFamily = '"Rubik Wide", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
      header,
      footer,
      gap = 1,
      gridPaddingX = 2,

      showProgress = true,
      debug = false,

      durations = { change: 0.7, snap: 800 },
      reduceMotion,

      bgTransition = 'fade',
      parallaxAmount = 4,

      currentIndex,
      onIndexChange,
      initialIndex = 0,

      colors = {
        text: 'rgba(245,245,245,0.95)',
        overlay: 'rgba(0,0,0,0.45)',
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
    const titleRefs = useRef<HTMLDivElement[]>([])

    const leftTrackRef = useRef<HTMLDivElement | null>(null)
    const rightTrackRef = useRef<HTMLDivElement | null>(null)
    const leftItemRefs = useRef<HTMLDivElement[]>([])
    const rightItemRefs = useRef<HTMLDivElement[]>([])

    const progressFillRef = useRef<HTMLDivElement | null>(null)
    const currentNumberRef = useRef<HTMLSpanElement | null>(null)

    const stRef = useRef<ScrollTrigger | null>(null)
    const lastIndexRef = useRef(index)
    const isAnimatingRef = useRef(false)
    const isSnappingRef = useRef(false)
    const sectionTopRef = useRef<number[]>([])

    const prefersReduced = useMemo(() => {
      if (typeof window === 'undefined') return false
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }, [])
    const motionOff = reduceMotion ?? prefersReduced

    const measureRAF = (fn: () => void) => {
      if (typeof window === 'undefined') return
      requestAnimationFrame(() => requestAnimationFrame(fn))
    }

    const computePositions = () => {
      const el = fixedSectionRef.current
      if (!el || total <= 0) return
      const top = el.offsetTop
      const h = el.offsetHeight
      const arr: number[] = []
      for (let i = 0; i < total; i++) arr.push(top + (h * i) / total)
      sectionTopRef.current = arr
    }

    const measureAndCenterLists = (toIndex = index, animate = true) => {
      const centerTrack = (
        container: HTMLDivElement | null,
        items: HTMLDivElement[],
        track: HTMLDivElement | null,
        shiftX: number
      ) => {
        if (!container || !track || items.length === 0) return
        const first = items[0]
        const second = items[1]
        let rowH = first.getBoundingClientRect().height
        if (second) rowH = second.getBoundingClientRect().top - first.getBoundingClientRect().top
        const contRect = container.getBoundingClientRect()
        const targetY = contRect.height / 2 - rowH / 2 - toIndex * rowH
        if (animate) {
          gsap.to(track, {
            y: targetY,
            x: shiftX,
            duration: (durations.change ?? 0.7) * 0.9,
            ease: 'power3.out',
          })
        } else {
          gsap.set(track, { y: targetY, x: shiftX })
        }
      }

      measureRAF(() => {
        measureRAF(() => {
          centerTrack(leftTrackRef.current?.parentElement as HTMLDivElement, leftItemRefs.current, leftTrackRef.current, 0)
          centerTrack(rightTrackRef.current?.parentElement as HTMLDivElement, rightItemRefs.current, rightTrackRef.current, 0)
        })
      })
    }

    const changeSection = (to: number) => {
      if (to === lastIndexRef.current || isAnimatingRef.current || total === 0) return
      const from = lastIndexRef.current
      const down = to > from
      const D = durations.change ?? 0.7
      isAnimatingRef.current = true

      if (!isControlled) setLocalIndex(to)
      onIndexChange?.(to)

      if (currentNumberRef.current) currentNumberRef.current.textContent = String(to + 1).padStart(2, '0')
      if (progressFillRef.current) {
        const p = (to / (total - 1 || 1)) * 100
        progressFillRef.current.style.width = `${p}%`
      }

      const prevTitle = titleRefs.current[from]
      const nextTitle = titleRefs.current[to]

      if (prevTitle) {
        gsap.to(prevTitle, {
          opacity: 0,
          y: down ? -24 : 24,
          duration: D * 0.45,
          ease: 'power3.out',
        })
      }

      if (nextTitle) {
        gsap.set(nextTitle, { opacity: 0, y: down ? 24 : -24, visibility: 'visible' })
        gsap.to(nextTitle, {
          opacity: 1,
          y: 0,
          duration: D * 0.75,
          ease: 'power3.out',
        })
      }

      const prevBg = bgRefs.current[from]
      const newBg = bgRefs.current[to]

      if (bgTransition === 'fade') {
        if (newBg) {
          gsap.set(newBg, { opacity: 0, scale: 1.04, yPercent: down ? 1 : -1 })
          gsap.to(newBg, { opacity: 1, scale: 1, yPercent: 0, duration: D, ease: 'power2.out' })
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
        if (newBg) {
          gsap.set(newBg, {
            opacity: 1,
            clipPath: down ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)',
            scale: 1,
            yPercent: 0,
          })
          gsap.to(newBg, { clipPath: 'inset(0 0 0 0)', duration: D, ease: 'power3.out' })
        }
        if (prevBg) gsap.to(prevBg, { opacity: 0, duration: D * 0.8, ease: 'power2.out' })
      }

      measureAndCenterLists(to, true)

      leftItemRefs.current.forEach((el, i) => {
        if (!el) return
        el.classList.toggle('active', i === to)
        gsap.to(el, { opacity: i === to ? 1 : 0.35, x: i === to ? 10 : 0, duration: D * 0.6, ease: 'power3.out' })
      })

      rightItemRefs.current.forEach((el, i) => {
        if (!el) return
        el.classList.toggle('active', i === to)
        gsap.to(el, { opacity: i === to ? 1 : 0.35, x: i === to ? -10 : 0, duration: D * 0.6, ease: 'power3.out' })
      })

      gsap.delayedCall(D, () => {
        lastIndexRef.current = to
        isAnimatingRef.current = false
      })
    }

    const goToInternal = (to: number, withScroll = true) => {
      if (total === 0) return
      const clamped = clamp(to, 0, total - 1)
      isSnappingRef.current = true
      changeSection(clamped)

      const pos = sectionTopRef.current[clamped]
      const snapMs = durations.snap ?? 800

      if (withScroll && typeof window !== 'undefined' && typeof pos === 'number') {
        window.scrollTo({ top: pos, behavior: 'smooth' })
        setTimeout(() => {
          isSnappingRef.current = false
        }, snapMs)
      } else {
        setTimeout(() => {
          isSnappingRef.current = false
        }, 20)
      }
    }

    const next = () => goToInternal(index + 1)
    const prev = () => goToInternal(index - 1)

    useImperativeHandle(apiRef, () => ({
      next,
      prev,
      goTo: (i: number) => goToInternal(i, true),
      getIndex: () => index,
      refresh: () => ScrollTrigger.refresh(),
    }))

    useLayoutEffect(() => {
      if (typeof window === 'undefined') return
      const fixed = fixedRef.current
      const fs = fixedSectionRef.current
      if (!fixed || !fs || total === 0) return

      gsap.set(bgRefs.current, { opacity: 0, scale: 1.04, yPercent: 0 })
      if (bgRefs.current[0]) gsap.set(bgRefs.current[0], { opacity: 1, scale: 1 })
      titleRefs.current.forEach((t, i) => {
        if (!t) return
        gsap.set(t, { opacity: i === index ? 1 : 0, y: i === index ? 0 : 24, visibility: 'visible' })
      })

      computePositions()
      measureAndCenterLists(index, false)

      const st = ScrollTrigger.create({
        trigger: fs,
        start: 'top top',
        end: 'bottom bottom',
        pin: fixed,
        pinSpacing: true,
        onUpdate: (self) => {
          if (motionOff || isSnappingRef.current) return
          const prog = self.progress
          const target = Math.min(total - 1, Math.floor(prog * total))
          if (target !== lastIndexRef.current && !isAnimatingRef.current) {
            const nextStep = lastIndexRef.current + (target > lastIndexRef.current ? 1 : -1)
            goToInternal(nextStep, false)
          }
          if (progressFillRef.current) {
            const p = (lastIndexRef.current / (total - 1 || 1)) * 100
            progressFillRef.current.style.width = `${p}%`
          }
        },
      })

      stRef.current = st

      if (initialIndex > 0 && initialIndex < total) {
        requestAnimationFrame(() => goToInternal(initialIndex, false))
      }

      const ro = new ResizeObserver(() => {
        computePositions()
        measureAndCenterLists(lastIndexRef.current, false)
        ScrollTrigger.refresh()
      })
      ro.observe(fs)

      return () => {
        ro.disconnect()
        st.kill()
        stRef.current = null
      }
    }, [total, initialIndex, motionOff, bgTransition, parallaxAmount])

    useEffect(() => {
      leftItemRefs.current.forEach((el, i) => {
        if (!el) return
        gsap.fromTo(
          el,
          { opacity: 0, y: 20 },
          { opacity: i === index ? 1 : 0.35, y: 0, duration: 0.45, delay: i * 0.04, ease: 'power3.out' }
        )
      })
      rightItemRefs.current.forEach((el, i) => {
        if (!el) return
        gsap.fromTo(
          el,
          { opacity: 0, y: 20 },
          { opacity: i === index ? 1 : 0.35, y: 0, duration: 0.45, delay: 0.15 + i * 0.04, ease: 'power3.out' }
        )
      })
      measureAndCenterLists(index, false)
    }, [])

    const cssVars: CSSProperties = {
      ['--fx-font' as any]: fontFamily,
      ['--fx-text' as any]: colors.text ?? 'rgba(245,245,245,0.95)',
      ['--fx-overlay' as any]: colors.overlay ?? 'rgba(0,0,0,0.45)',
      ['--fx-page-bg' as any]: colors.pageBg ?? '#000',
      ['--fx-stage-bg' as any]: colors.stageBg ?? '#000',
      ['--fx-gap' as any]: `${gap}rem`,
      ['--fx-grid-px' as any]: `${gridPaddingX}rem`,
      ['--fx-row-gap' as any]: '10px',
    }

    return (
      <div
        ref={(node) => {
          rootRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }}
        className={['fx', className].filter(Boolean).join(' ')}
        style={{ ...cssVars, ...style }}
        aria-label={ariaLabel}
      >
        {debug && <div className='fx-debug'>Section: {index + 1}</div>}

        <div className='fx-scroll'>
          <div className='fx-fixed-section' ref={fixedSectionRef}>
            <div className='fx-fixed' ref={fixedRef}>
              <div className='fx-bgs' aria-hidden='true'>
                {sections.map((s, i) => (
                  <div className='fx-bg' key={s.id ?? i}>
                    {s.renderBackground ? (
                      s.renderBackground(index === i, lastIndexRef.current === i)
                    ) : (
                      <>
                        <img
                          ref={(el) => {
                            if (el) bgRefs.current[i] = el
                          }}
                          src={s.background}
                          alt=''
                          className='fx-bg-img'
                        />
                        <div className='fx-bg-overlay' />
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className='fx-grid'>
                {header && <div className='fx-header'>{header}</div>}

                <div className='fx-content'>
                  <div className='fx-left' role='list'>
                    <div className='fx-track' ref={leftTrackRef}>
                      {sections.map((s, i) => (
                        <div
                          key={`L-${s.id ?? i}`}
                          className={`fx-item fx-left-item ${i === index ? 'active' : ''}`}
                          ref={(el) => {
                            if (el) leftItemRefs.current[i] = el
                          }}
                          onClick={() => goToInternal(i)}
                          role='button'
                          tabIndex={0}
                          aria-pressed={i === index}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') goToInternal(i)
                          }}
                        >
                          {s.leftLabel}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='fx-center'>
                    {sections.map((s, i) => (
                      <div
                        key={`C-${s.id ?? i}`}
                        className={`fx-featured ${i === index ? 'active' : ''}`}
                        ref={(el) => {
                          if (el) titleRefs.current[i] = el
                        }}
                      >
                        <h3 className='fx-featured-title'>{s.title}</h3>
                      </div>
                    ))}
                  </div>

                  <div className='fx-right' role='list'>
                    <div className='fx-track' ref={rightTrackRef}>
                      {sections.map((s, i) => (
                        <div
                          key={`R-${s.id ?? i}`}
                          className={`fx-item fx-right-item ${i === index ? 'active' : ''}`}
                          ref={(el) => {
                            if (el) rightItemRefs.current[i] = el
                          }}
                          onClick={() => goToInternal(i)}
                          role='button'
                          tabIndex={0}
                          aria-pressed={i === index}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') goToInternal(i)
                          }}
                        >
                          {s.rightLabel}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className='fx-footer'>
                  {footer && <div className='fx-footer-title'>{footer}</div>}
                  {showProgress && (
                    <div className='fx-progress'>
                      <div className='fx-progress-numbers'>
                        <span ref={currentNumberRef}>{String(index + 1).padStart(2, '0')}</span>
                        <span>{String(total).padStart(2, '0')}</span>
                      </div>
                      <div className='fx-progress-bar'>
                        <div className='fx-progress-fill' ref={progressFillRef} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className='fx-end'>
            <p className='fx-fin'>fin</p>
          </div>
        </div>

        <style jsx>{`
          .fx {
            width: 100%;
            overflow: hidden;
            background: var(--fx-page-bg);
            color: #000;
            font-family: var(--fx-font);
            text-transform: uppercase;
            letter-spacing: -0.02em;
          }

          .fx-debug {
            position: fixed;
            right: 10px;
            bottom: 10px;
            z-index: 9999;
            background: rgba(255,255,255,0.85);
            color: #000;
            padding: 6px 8px;
            border-radius: 4px;
            font: 12px/1 monospace;
          }

          .fx-fixed-section {
            height: ${Math.max(1, total + 1)}00vh;
            position: relative;
          }

          .fx-fixed {
            position: sticky;
            top: 0;
            width: 100%;
            height: 100vh;
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
            inset: -10% 0 -10% 0;
            width: 100%;
            height: 120%;
            object-fit: cover;
            filter: brightness(0.78);
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
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: var(--fx-gap);
            height: 100%;
            padding: 0 var(--fx-grid-px);
          }

          .fx-header {
            grid-column: 2 / 12;
            align-self: start;
            padding-top: 6vh;
            text-align: center;
            color: var(--fx-text);
            font-weight: 800;
            letter-spacing: -0.015em;
            line-height: 0.95;
            font-size: clamp(1.7rem, 5.2vw, 5.4rem);
            opacity: 0.92;
            pointer-events: none;
          }

          .fx-header > :global(div) {
            display: block;
          }

          .fx-content {
            grid-column: 1 / 13;
            position: absolute;
            inset: 0;
            display: grid;
            grid-template-columns: 1fr 1.35fr 1fr;
            align-items: center;
            padding: 0 var(--fx-grid-px);
          }

          .fx-left, .fx-right {
            height: 52vh;
            overflow: hidden;
            display: grid;
            align-content: center;
          }

          .fx-left {
            justify-items: start;
          }

          .fx-right {
            justify-items: end;
          }

          .fx-track {
            will-change: transform;
          }

          .fx-item {
            color: var(--fx-text);
            font-weight: 800;
            line-height: 1;
            margin: calc(var(--fx-row-gap) / 2) 0;
            opacity: 0.35;
            transition: opacity 0.3s ease, transform 0.3s ease;
            position: relative;
            font-size: clamp(1rem, 2vw, 1.65rem);
            user-select: none;
            cursor: pointer;
            text-shadow: 0 2px 10px rgba(0,0,0,0.45);
          }

          .fx-left-item.active,
          .fx-right-item.active {
            opacity: 1;
          }

          .fx-left-item.active {
            transform: translateX(10px);
            padding-left: 16px;
          }

          .fx-right-item.active {
            transform: translateX(-10px);
            padding-right: 16px;
          }

          .fx-left-item.active::before,
          .fx-right-item.active::after {
            content: '';
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--fx-text);
          }

          .fx-left-item.active::before { left: 0; }
          .fx-right-item.active::after { right: 0; }

          .fx-center {
            position: relative;
            display: grid;
            place-items: center;
            text-align: center;
            height: 58vh;
            overflow: hidden;
          }

          .fx-featured {
            position: absolute;
            opacity: 0;
            visibility: hidden;
            width: min(90vw, 980px);
          }

          .fx-featured.active {
            opacity: 1;
            visibility: visible;
          }

          .fx-featured-title {
            margin: 0;
            color: var(--fx-text);
            font-weight: 900;
            letter-spacing: -0.02em;
            line-height: 0.92;
            text-shadow: 0 4px 24px rgba(0,0,0,0.45);
            font-size: clamp(2.2rem, 7.3vw, 7.2rem);
          }

          .fx-footer {
            grid-column: 2 / 12;
            align-self: end;
            padding-bottom: 6.5vh;
            text-align: center;
          }

          .fx-footer-title {
            color: var(--fx-text);
            font-size: clamp(1.05rem, 2.2vw, 2rem);
            font-weight: 700;
            text-transform: none;
            letter-spacing: 0;
            line-height: 1.2;
            text-shadow: 0 2px 16px rgba(0,0,0,0.4);
          }

          .fx-progress {
            width: min(260px, 62vw);
            margin: 1rem auto 0;
          }

          .fx-progress-numbers {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: var(--fx-text);
            margin-bottom: 6px;
            letter-spacing: 0.08em;
          }

          .fx-progress-bar {
            height: 2px;
            background: rgba(245,245,245,0.28);
            overflow: hidden;
            border-radius: 999px;
          }

          .fx-progress-fill {
            height: 100%;
            width: 0%;
            background: var(--fx-text);
            transition: width 0.3s ease;
          }

          .fx-end {
            height: 100vh;
            display: grid;
            place-items: center;
          }

          .fx-fin {
            transform: rotate(90deg);
            color: #111;
          }

          @media (max-width: 1100px) {
            .fx-header {
              font-size: clamp(1.5rem, 4.5vw, 4.2rem);
            }

            .fx-featured-title {
              font-size: clamp(2.1rem, 8.5vw, 6rem);
            }
          }

          @media (max-width: 900px) {
            .fx-content {
              grid-template-columns: 1fr;
              row-gap: 2vh;
              place-items: center;
              padding-top: 8vh;
            }

            .fx-left,
            .fx-right {
              display: none;
            }

            .fx-header {
              grid-column: 1 / 13;
              padding-top: 7vh;
              font-size: clamp(1.1rem, 10vw, 3rem);
              line-height: 0.95;
            }

            .fx-center {
              height: auto;
              margin-top: 2vh;
            }

            .fx-featured {
              position: relative;
              width: 92vw;
            }

            .fx-featured-title {
              font-size: clamp(2rem, 13vw, 4.2rem);
              line-height: 0.95;
            }

            .fx-footer {
              grid-column: 1 / 13;
              padding-bottom: 7.5vh;
            }

            .fx-footer-title {
              font-size: clamp(1rem, 5.2vw, 1.45rem);
              max-width: 92vw;
              margin: 0 auto;
            }

            .fx-progress {
              width: min(220px, 58vw);
              margin-top: 0.8rem;
            }
          }
        `}</style>
      </div>
    )
  }
)

FullScreenScrollFX.displayName = 'FullScreenScrollFX'
export default FullScreenScrollFX
