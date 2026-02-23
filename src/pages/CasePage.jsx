import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useLayoutEffect, useEffect, useMemo, memo } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

/* =============================
   ROULETTE SLOT (stable)
   - key only by index (outside)
   - always stop at frame 0
============================= */
const RouletteSlot = memo(function RouletteSlot({ dropId }) {
  const lottieRef = useRef(null)
  const anim = darkMatterAnimations[dropId]

  useEffect(() => {
    // гарантируем "статик"
    if (lottieRef.current) {
      try {
        lottieRef.current.goToAndStop(0, true)
      } catch {}
    }
  }, [dropId])

  if (!anim) {
    return <div style={{ width: 80, height: 80, opacity: 0.25 }} />
  }

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={anim}
      autoplay={false}
      loop={false}
      rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
      style={{ width: 80, height: 80 }}
    />
  )
})

function CasePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)

  // idle -> preparing -> spinning -> result
  const [phase, setPhase] = useState("idle")
  const [result, setResult] = useState(null)

  // окно (рендерим N слотов)
  const [windowItems, setWindowItems] = useState([])

  const wrapRef = useRef(null)
  const trackRef = useRef(null)

  const rafRef = useRef(null)
  const startRef = useRef(0)
  const lastBaseRef = useRef(-1)

  const winIdRef = useRef(null)
  const seqRef = useRef([])
  const stepsRef = useRef(0)
  const windowCountRef = useRef(18)
  const selectIndexRef = useRef(0)
  const centerShiftRef = useRef(0)

  // размеры должны совпадать с CSS
  const ITEM_W = 140
  const GAP = 20
  const FULL = ITEM_W + GAP

  if (!caseData) return <div className="app">Case config missing</div>

  // только те дропы, у которых реально есть lottie
  const safeDrops = useMemo(() => {
    return (caseData.drops || []).filter((d) => !!darkMatterAnimations[d.id])
  }, [caseData.drops])

  if (!safeDrops.length) {
    return <div className="app">No drops with animations found for this case.</div>
  }

  const handleClick = (dropId) => {
    if (activeDrop === dropId) {
      setActiveDrop(null)
      setTimeout(() => setActiveDrop(dropId), 10)
    } else {
      setActiveDrop(dropId)
    }
  }

  const pickWeighted = () => {
    const pool = []
    safeDrops.forEach((drop) => {
      const w = drop.chance || 10
      for (let i = 0; i < w; i++) pool.push(drop.id)
    })
    return pool[Math.floor(Math.random() * pool.length)]
  }

  const randIdNoRepeat = (prev) => {
    if (safeDrops.length === 1) return safeDrops[0].id
    let x = prev
    let tries = 0
    while (x === prev && tries < 8) {
      x = safeDrops[Math.floor(Math.random() * safeDrops.length)].id
      tries++
    }
    return x
  }

  // seq такой длины, чтобы base+windowCount всегда существовал
  const buildSequence = (winId, steps, windowCount, selectIndex) => {
    const total = steps + selectIndex + windowCount + 120
    const seq = new Array(total)

    let prev = null
    for (let i = 0; i < total; i++) {
      const r = randIdNoRepeat(prev)
      seq[i] = r
      prev = r
    }

    const winPos = steps + selectIndex
    seq[winPos] = winId

    // чтобы рядом не было дубля winId
    if (winPos - 1 >= 0 && seq[winPos - 1] === winId) seq[winPos - 1] = randIdNoRepeat(winId)
    if (winPos + 1 < total && seq[winPos + 1] === winId) seq[winPos + 1] = randIdNoRepeat(winId)

    return seq
  }

  const stopAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }

  useEffect(() => {
    return () => stopAll()
  }, [])

  const openCase = () => {
    if (phase === "preparing" || phase === "spinning") return

    stopAll()
    setResult(null)
    setWindowItems([])
    lastBaseRef.current = -1

    winIdRef.current = pickWeighted()
    setPhase("preparing")
  }

  /* =============================
     PREP
  ============================= */
  useLayoutEffect(() => {
    if (phase !== "preparing") return
    if (!wrapRef.current) return

    const containerWidth = wrapRef.current.offsetWidth || 320
    const visible = Math.ceil(containerWidth / FULL)

    const windowCount = Math.min(Math.max(visible + 8, 14), 22)
    windowCountRef.current = windowCount

    const selectIndex = Math.floor(windowCount / 2)
    selectIndexRef.current = selectIndex

    // фиксируем так, чтобы selectIndex был под линией (по центру)
    const centerX = containerWidth / 2 - ITEM_W / 2
    centerShiftRef.current = centerX - selectIndex * FULL

    // сколько слотов пролетит (скорость/длина)
    const steps = 110
    stepsRef.current = steps

    const seq = buildSequence(winIdRef.current, steps, windowCount, selectIndex)
    seqRef.current = seq

    // стартовое окно
    setWindowItems(seq.slice(0, windowCount))

    requestAnimationFrame(() => {
      if (trackRef.current) {
        trackRef.current.style.transition = "none"
        trackRef.current.style.transform = `translate3d(${centerShiftRef.current}px,0,0)`
        void trackRef.current.offsetHeight
      }
      setPhase("spinning")
    })
  }, [phase])

  /* =============================
     SPIN
     - transform каждый кадр
     - React обновляем только когда base изменился
     - и обновляем ОКНО СДВИГОМ (не пересоздаём 18 Lottie)
  ============================= */
  useEffect(() => {
    if (phase !== "spinning") return
    if (!trackRef.current) return

    const duration = 3600 // 3.6s — ближе к “норм”
    const steps = stepsRef.current
    const totalPx = FULL * steps

    startRef.current = performance.now()
    lastBaseRef.current = -1

    const tick = (now) => {
      const t = Math.min((now - startRef.current) / duration, 1)

      // easing: быстрый старт, мягкий финиш
      const eased = 1 - Math.pow(1 - t, 3.15)

      const px = eased * totalPx
      const base = Math.floor(px / FULL)
      const inner = px - base * FULL

      // двигаем DOM
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${centerShiftRef.current - inner}px,0,0)`
      }

      // base сменился -> обновляем окно (без ремоунта всей пачки)
      if (base !== lastBaseRef.current) {
        const prevBase = lastBaseRef.current
        lastBaseRef.current = base

        const seq = seqRef.current
        const wc = windowCountRef.current

        // обычный случай: base вырос на 1
        if (prevBase !== -1 && base === prevBase + 1) {
          setWindowItems((prev) => {
            if (!prev || prev.length !== wc) return seq.slice(base, base + wc)
            const next = prev.slice(1)
            next.push(seq[base + wc - 1])
            return next
          })
        } else {
          // если вдруг прыжок (редко) — просто пересобираем окно
          setWindowItems(seq.slice(base, base + wc))
        }
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        stopAll()
        setPhase("result")
        setResult(winIdRef.current)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => stopAll()
  }, [phase])

  const sellItem = () => {
    stopAll()
    setResult(null)
    setPhase("idle")
    setWindowItems([])
    lastBaseRef.current = -1
    if (trackRef.current) {
      trackRef.current.style.transition = "none"
      trackRef.current.style.transform = `translate3d(0px,0,0)`
    }
  }

  const openAgain = () => {
    sellItem()
    openCase()
  }

  const blurred = result != null
  const showRoulette = phase === "preparing" || phase === "spinning"

  return (
    <div className="app">
      <div className={blurred ? "blurred" : ""}>
        <div className="casepage-header">
          <div className="casepage-title-row">
            <button
              type="button"
              className="casepage-header-btn casepage-back-btn"
              onClick={() => navigate(-1)}
            >
              ←
            </button>

            <div className="casepage-title">{caseData.name}</div>

            <button type="button" className="casepage-header-btn casepage-settings-btn">
              ⚙
            </button>
          </div>

          <div className="case-image-wrapper">
            <img
              src={caseData.image}
              className={`casepage-case-image ${showRoulette ? "hidden-case" : ""}`}
              alt={caseData.name}
            />

            {showRoulette && (
              <div className="roulette-absolute" ref={wrapRef}>
                <div className="roulette-line" />

                <div ref={trackRef} className="roulette-reel">
                  {windowItems.map((dropId, index) => (
                    // ✅ ключи ТОЛЬКО по index — слоты стабильные, Lottie не ремоунтится пачкой
                    <div key={index} className="roulette-item">
                      <RouletteSlot dropId={dropId} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!result && (
            <button
              type="button"
              className="casepage-open-btn"
              onClick={openCase}
              disabled={phase === "preparing" || phase === "spinning"}
            >
              {phase === "preparing" ? "Загрузка…" : phase === "spinning" ? "Крутится…" : "Открыть кейс"}
            </button>
          )}
        </div>

        <div className="casepage-drops">
          {caseData.drops.map((drop) => {
            const isActive = activeDrop === drop.id
            return (
              <div
                key={drop.id}
                className="drop-card"
                onClick={() => handleClick(drop.id)}
              >
                <Lottie
                  key={isActive ? drop.id + "-active" : drop.id}
                  animationData={darkMatterAnimations[drop.id]}
                  autoplay={isActive}
                  loop={false}
                  className="drop-lottie"
                />
                <div className="drop-name">{drop.name || drop.id}</div>
              </div>
            )
          })}
        </div>
      </div>

      {result && (
        <div className="result-overlay">
          <div className="result-card">
            <div className="result-title">Поздравляем!</div>

            <div className="drop-card result-size">
              <Lottie
                animationData={darkMatterAnimations[result]}
                autoplay
                loop={false}
              />
              <div className="drop-name">{result}</div>
            </div>

            <div className="result-buttons">
              <button type="button" className="glass-btn sell" onClick={sellItem}>
                Продать
              </button>
              <button type="button" className="glass-btn open" onClick={openAgain}>
                Открыть еще
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CasePage
