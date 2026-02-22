import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useLayoutEffect, useEffect, useMemo } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

function CasePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)

  // phases: idle -> prep -> spinning -> result
  const [phase, setPhase] = useState("idle")
  const [result, setResult] = useState(null)

  // render window only
  const [windowItems, setWindowItems] = useState([])

  const wrapRef = useRef(null)
  const trackRef = useRef(null)

  const rafRef = useRef(null)
  const startRef = useRef(0)
  const lastBaseRef = useRef(-1)

  const winIdRef = useRef(null)
  const seqRef = useRef([])
  const stepsRef = useRef(0)
  const windowCountRef = useRef(16)

  const selectIndexRef = useRef(7)   // индекс окна под линией
  const centerShiftRef = useRef(0)   // постоянный сдвиг, чтобы selectIndex был по центру

  // fixed sizes (match CSS)
  const ITEM_W = 140
  const GAP = 20
  const FULL = ITEM_W + GAP

  if (!caseData) return <div className="app">Case config missing</div>

  // ✅ SAFE drops: only those that exist in mapping
  const safeDrops = useMemo(() => {
    return (caseData.drops || []).filter((d) => !!darkMatterAnimations[d.id])
  }, [caseData.drops])

  if (!safeDrops.length) {
    return <div className="app">No drops with animations found for this case.</div>
  }

  /* =============================
     GRID click animation
  ============================= */
  const handleClick = (dropId) => {
    if (activeDrop === dropId) {
      setActiveDrop(null)
      setTimeout(() => setActiveDrop(dropId), 10)
    } else {
      setActiveDrop(dropId)
    }
  }

  /* =============================
     weighted random
  ============================= */
  const pickWeighted = () => {
    const pool = []
    safeDrops.forEach((drop) => {
      const w = drop.chance || 10
      for (let i = 0; i < w; i++) pool.push(drop.id)
    })
    return pool[Math.floor(Math.random() * pool.length)]
  }

  // helper: random id but avoid repeating the previous too often
  const randIdNoRepeat = (prev) => {
    if (safeDrops.length === 1) return safeDrops[0].id
    let x = prev
    let tries = 0
    while (x === prev && tries < 10) {
      x = safeDrops[Math.floor(Math.random() * safeDrops.length)].id
      tries++
    }
    return x
  }

  // IMPORTANT:
  // Под линией стоит windowItems[selectIndex], а windowItems = seq.slice(base, base+windowCount)
  // => под линией будет seq[base + selectIndex]
  // Хотим, чтобы на финише base=steps и inner≈0 => winId должен быть в seq[steps + selectIndex]
  const buildSequence = (winId, steps, windowCount, selectIndex) => {
    const total = steps + windowCount + 120 // жирный запас, чтобы хвост никогда не ощущался
    const seq = new Array(total)

    let prev = null
    for (let i = 0; i < total; i++) {
      const r = randIdNoRepeat(prev)
      seq[i] = r
      prev = r
    }

    const winPos = steps + selectIndex
    seq[winPos] = winId

    // убираем одинаковые рядом с win
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

  /* =============================
     OPEN CASE
  ============================= */
  const openCase = (e) => {
    if (e) e.preventDefault()
    if (phase === "prep" || phase === "spinning") return

    stopAll()
    setResult(null)
    setWindowItems([])
    lastBaseRef.current = -1

    winIdRef.current = pickWeighted()
    setPhase("prep")
  }

  /* =============================
     PREP
  ============================= */
  useLayoutEffect(() => {
    if (phase !== "prep") return
    if (!wrapRef.current) return

    const containerWidth = wrapRef.current.offsetWidth || 320
    const visible = Math.ceil(containerWidth / FULL)

    // сколько карточек рендерим
    const windowCount = Math.min(Math.max(visible + 10, 16), 26)
    windowCountRef.current = windowCount

    // индекс под линией (центр окна)
    const selectIndex = Math.floor(windowCount / 2)
    selectIndexRef.current = selectIndex

    // смещение, чтобы selectIndex оказался по центру при inner=0
    const centerX = containerWidth / 2 - ITEM_W / 2
    centerShiftRef.current = centerX - selectIndex * FULL

    // сколько слотов пролетит
    const steps = 120
    stepsRef.current = steps

    const seq = buildSequence(winIdRef.current, steps, windowCount, selectIndex)
    seqRef.current = seq

    setWindowItems(seq.slice(0, windowCount))

    requestAnimationFrame(() => {
      if (trackRef.current) {
        trackRef.current.style.transition = "none"
        trackRef.current.style.transform = `translateX(${centerShiftRef.current}px)`
      }
      setPhase("spinning")
    })
  }, [phase])

  /* =============================
     SPIN (rAF)
     - DOM transform каждый кадр
     - React windowItems только при смене base (чтобы не лагало)
  ============================= */
  useEffect(() => {
    if (phase !== "spinning") return
    if (!trackRef.current) return

    const duration = 3800 // ms (нормальная “длина”, не слишком долг)
    const steps = stepsRef.current
    const totalPx = FULL * steps

    startRef.current = performance.now()
    lastBaseRef.current = -1

    const tick = (now) => {
      const t = Math.min((now - startRef.current) / duration, 1)

      // быстро стартует, мягко останавливается
      const eased = 1 - Math.pow(1 - t, 3.0)

      const px = eased * totalPx
      const base = Math.floor(px / FULL)
      const inner = px - base * FULL

      // transform: держим selectIndex под линией + двигаем внутри слота
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${centerShiftRef.current - inner}px)`
      }

      // обновляем окно только при смене base
      if (base !== lastBaseRef.current) {
        lastBaseRef.current = base
        const seq = seqRef.current
        const wc = windowCountRef.current
        const next = seq.slice(base, base + wc)
        setWindowItems(next)
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

  /* =============================
     RESET
  ============================= */
  const sellItem = (e) => {
    if (e) e.preventDefault()
    stopAll()
    setResult(null)
    setPhase("idle")
    setWindowItems([])
    lastBaseRef.current = -1

    if (trackRef.current) {
      trackRef.current.style.transition = "none"
      trackRef.current.style.transform = `translateX(0px)`
    }
  }

  const openAgain = (e) => {
    if (e) e.preventDefault()
    sellItem()
    openCase()
  }

  const blurred = result != null

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

            <button
              type="button"
              className="casepage-header-btn casepage-settings-btn"
            >
              ⚙
            </button>
          </div>

          <div className="case-image-wrapper">
            <img
              src={caseData.image}
              className={`casepage-case-image ${phase === "prep" || phase === "spinning" ? "hidden-case" : ""}`}
              alt={caseData.name}
            />

            {(phase === "prep" || phase === "spinning") && (
              <div className="roulette-absolute" ref={wrapRef}>
                <div className="roulette-line" />

                <div ref={trackRef} className="roulette-reel">
                  {windowItems.map((dropId, index) => {
                    const anim = darkMatterAnimations[dropId]
                    return (
                      <div key={`${dropId}-${index}`} className="roulette-item">
                        {/* ✅ Lottie статично: autoplay={false}, loop={false} */}
                        {/* важное: НЕ меняем key на каждом кадре, только на смене windowItems */}
                        {anim ? (
                          <Lottie
                            animationData={anim}
                            autoplay={false}
                            loop={false}
                            className="roulette-lottie"
                            style={{ width: 80, height: 80 }}
                          />
                        ) : (
                          <div className="roulette-lottie roulette-lottie--empty" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {phase === "idle" && !result && (
            <button
              type="button"
              className="casepage-open-btn"
              onClick={openCase}
            >
              Открыть кейс
            </button>
          )}

          {phase === "prep" && (
            <button type="button" className="casepage-open-btn" disabled>
              Загрузка…
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
                {darkMatterAnimations[drop.id] ? (
                  <Lottie
                    key={isActive ? drop.id + "-active" : drop.id}
                    animationData={darkMatterAnimations[drop.id]}
                    autoplay={isActive}
                    loop={false}
                    className="drop-lottie"
                  />
                ) : (
                  <div className="drop-lottie" />
                )}

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

            {/* ✅ приз анимированный */}
            <div className="drop-card result-size">
              <Lottie
                animationData={darkMatterAnimations[result]}
                autoplay
                loop={false}
              />
              <div className="drop-name">{result}</div>
            </div>

            <div className="result-buttons">
              <button
                type="button"
                className="glass-btn sell"
                onClick={sellItem}
              >
                Продать
              </button>

              <button
                type="button"
                className="glass-btn open"
                onClick={openAgain}
              >
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
