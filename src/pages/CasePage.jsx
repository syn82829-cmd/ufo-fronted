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

  // window items (не вся лента!)
  const [windowItems, setWindowItems] = useState([])
  const [slotX, setSlotX] = useState(0) // текущий translate внутри одного слота

  const wrapRef = useRef(null)
  const rafRef = useRef(null)
  const startRef = useRef(0)

  const winIdRef = useRef(null)
  const seqRef = useRef([])          // длинная последовательность id (но без рендера сотен Lottie)
  const stepsRef = useRef(0)         // сколько слотов “пролетит”
  const windowCountRef = useRef(16)  // сколько карточек рендерим

  if (!caseData) return <div className="app">Case config missing</div>

  // ✅ SAFE drops: только те, у которых реально есть animationData
  const safeDrops = useMemo(() => {
    const arr = (caseData.drops || []).filter(d => !!darkMatterAnimations[d.id])
    return arr
  }, [caseData.drops])

  // если вдруг конфиг кривой
  if (!safeDrops.length) {
    return (
      <div className="app">
        No drops with animations found for this case.
      </div>
    )
  }

  /* =============================
     DROP CLICK (анимация в сетке)
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
     WEIGHTED RANDOM (по safeDrops)
  ============================= */
  const pickWeighted = () => {
    const pool = []
    safeDrops.forEach((drop) => {
      const w = drop.chance || 10
      for (let i = 0; i < w; i++) pool.push(drop.id)
    })
    return pool[Math.floor(Math.random() * pool.length)]
  }

  /* =============================
     BUILD SEQUENCE
     Делаем длинную последовательность (например 110 шагов),
     но рендерим только окно (16 элементов).
  ============================= */
  const buildSequence = (winId, steps) => {
    const seq = []
    for (let i = 0; i < steps; i++) {
      const r = safeDrops[Math.floor(Math.random() * safeDrops.length)].id
      seq.push(r)
    }
    // фиксируем победу на последнем шаге (чтобы “приехала” под линию)
    seq[steps - 1] = winId
    return seq
  }

  /* =============================
     STOP + CLEAN
  ============================= */
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
    setSlotX(0)

    // win
    const winId = pickWeighted()
    winIdRef.current = winId

    setPhase("prep")
  }

  /* =============================
     PREP (реальная подготовка)
     - считаем размеры
     - формируем seq
     - выставляем окно
  ============================= */
  useLayoutEffect(() => {
    if (phase !== "prep") return
    if (!wrapRef.current) return

    const wrap = wrapRef.current
    const containerWidth = wrap.offsetWidth || 320

    const itemW = 140
    const gap = 20
    const full = itemW + gap

    // сколько карточек видно + запас
    const visible = Math.ceil(containerWidth / full)
    const windowCount = Math.min(Math.max(visible + 8, 14), 22)
    windowCountRef.current = windowCount

    // сколько “шагов” прокрутить (чем больше — тем дольше и “бесконечнее” ощущение)
    // 90–130 — норм для мобилы
    const steps = 110
    stepsRef.current = steps

    const seq = buildSequence(winIdRef.current, steps)
    seqRef.current = seq

    // стартовое окно: первые windowCount элементов
    setWindowItems(seq.slice(0, windowCount))
    setSlotX(0)

    // и только теперь запускаем spin
    setPhase("spinning")
  }, [phase])

  /* =============================
     SPIN (rAF)
     Имитируем “бесконечность”:
     - двигаем slotX от 0 до full*steps
     - каждые full пикселей сдвигаем окно на 1
  ============================= */
  useEffect(() => {
    if (phase !== "spinning") return

    const itemW = 140
    const gap = 20
    const full = itemW + gap

    const duration = 3600 // ms (можешь 4200 сделать)
    const steps = stepsRef.current
    const totalPx = full * steps

    startRef.current = performance.now()

    const tick = (now) => {
      const t = Math.min((now - startRef.current) / duration, 1)

      // easing (похоже на рулетку)
      const eased = 1 - Math.pow(1 - t, 3)

      const px = eased * totalPx

      const baseIndex = Math.floor(px / full)
      const inner = px - baseIndex * full

      setSlotX(inner)

      const seq = seqRef.current
      const windowCount = windowCountRef.current

      // обновляем окно только когда реально сменился baseIndex
      // (иначе лишние ререндеры)
      const start = baseIndex
      const next = seq.slice(start, start + windowCount)

      // если вышли за край (на финише) — добиваем последним состоянием
      if (next.length === windowCount) {
        setWindowItems(next)
      } else {
        // подстраховка
        const filled = [...next]
        while (filled.length < windowCount) filled.push(seq[seq.length - 1])
        setWindowItems(filled)
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        // финал
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
    setSlotX(0)
  }

  const openAgain = (e) => {
    if (e) e.preventDefault()
    sellItem()
    openCase()
  }

  const blurred = result != null

  // трансформ только внутри окна
  const trackStyle = {
    transform: `translateX(-${slotX}px)`,
    transition: "none",
  }

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
              className={`casepage-case-image ${phase === "spinning" || phase === "prep" ? "hidden-case" : ""}`}
              alt={caseData.name}
            />

            {(phase === "prep" || phase === "spinning") && (
              <div className="roulette-absolute" ref={wrapRef}>
                <div className="roulette-line" />

                <div className="roulette-reel" style={trackStyle}>
                  {windowItems.map((dropId, index) => {
                    const anim = darkMatterAnimations[dropId]
                    return (
                      <div key={`${dropId}-${index}`} className="roulette-item">
                        {anim ? (
                          <Lottie
                            animationData={anim}
                            autoplay={false}
                            loop={false}
                            style={{ width: 80, height: 80 }}
                          />
                        ) : (
                          <div style={{ width: 80, height: 80, opacity: 0.35 }} />
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
            <button
              type="button"
              className="casepage-open-btn"
              disabled
            >
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
