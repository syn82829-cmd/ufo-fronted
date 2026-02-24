import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useLayoutEffect, useEffect, useMemo, memo } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

/* =============================
   LOTTIE ID -> PNG filename map
   PNG лежат в: public/drops/*.png
============================= */
const PNG_BY_ID = {
  darkhelmet: "HeroicHelmet",
  gift: "LootBag",
  westside: "WestsideSign",
  lowrider: "Lowrider",
  watch: "SwissWatch",
  skull: "skull",
  dyson: "IonicDryer",
  batman: "batman",
  poizon: "poison", // id с опечаткой оставляем, png нормальный
  metla: "metla",
  ball: "ball",
  book: "book",
}

const pngSrc = (dropId) => `/drops/${(PNG_BY_ID[dropId] || dropId)}.png`

/* =============================
   ROULETTE SLOT (PNG ONLY)
   (в рулетке НЕТ Lottie / WebP)
============================= */
const RouletteSlot = memo(function RouletteSlot({ dropId }) {
  return (
    <img
      src={pngSrc(dropId)}
      alt={dropId}
      style={{
        width: 80,
        height: 80,
        objectFit: "contain",
        pointerEvents: "none",
        userSelect: "none",
      }}
      draggable={false}
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

  // окно рулетки (тут будет windowCount + 2*buffer)
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

  // буфер слева/справа чтобы никогда не было "конца ленты"
  const bufferRef = useRef(6)
  // стартовый оффсет, чтобы не лезть в отрицательные индексы
  const startOffsetRef = useRef(0)

  // размеры должны совпадать с CSS
  const ITEM_W = 140
  const GAP = 20
  const FULL = ITEM_W + GAP

  if (!caseData) return <div className="app">Case config missing</div>

  // рулетка/результат работают по ids из cases (lottie ids),
  // но PNG берём по маппингу
  const safeDrops = useMemo(() => {
    return (caseData.drops || []).filter((d) => Boolean(PNG_BY_ID[d.id] || d.id))
  }, [caseData.drops])

  if (!safeDrops.length) {
    return <div className="app">No drops found for this case.</div>
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

  // seq такой длины, чтобы base+windowCount+buffer всегда существовал
  const buildSequence = (winId, steps, windowCount, selectIndex, startOffset, buffer) => {
    const total = startOffset + steps + selectIndex + windowCount + buffer + 240
    const seq = new Array(total)

    let prev = null
    for (let i = 0; i < total; i++) {
      const r = randIdNoRepeat(prev)
      seq[i] = r
      prev = r
    }

    const winPos = startOffset + steps + selectIndex
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

  useEffect(() => stopAll, [])

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

    const centerX = containerWidth / 2 - ITEM_W / 2
    centerShiftRef.current = centerX - selectIndex * FULL

    // буфер: рендерим extra карточки по краям
    const buffer = 6
    bufferRef.current = buffer
    const startOffset = buffer
    startOffsetRef.current = startOffset

    // шаги/длина
    const steps = 95
    stepsRef.current = steps

    const seq = buildSequence(
      winIdRef.current,
      steps,
      windowCount,
      selectIndex,
      startOffset,
      buffer
    )
    seqRef.current = seq

    // стартовое окно: base = startOffset, значит slice(base-buffer .. base+windowCount+buffer)
    const base0 = startOffset
    setWindowItems(seq.slice(base0 - buffer, base0 + windowCount + buffer))

    requestAnimationFrame(() => {
      if (trackRef.current) {
        trackRef.current.style.transition = "none"
        // inner = 0 на старте, но мы отнимаем buffer, потому что слева есть buffer элементов
        trackRef.current.style.transform = `translate3d(${centerShiftRef.current - buffer * FULL}px,0,0)`
        void trackRef.current.offsetHeight
      }
      setPhase("spinning")
    })
  }, [phase])

  /* =============================
     SPIN
     - transform каждый кадр
     - React обновляем только когда base изменился
     - буфер слева/справа чтобы не было “конца”
  ============================= */
  useEffect(() => {
    if (phase !== "spinning") return
    if (!trackRef.current) return

    const duration = 5200
    const steps = stepsRef.current
    const totalPx = FULL * steps
    const buffer = bufferRef.current
    const startOffset = startOffsetRef.current

    startRef.current = performance.now()
    lastBaseRef.current = -1

    const tick = (now) => {
      const t = Math.min((now - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3.6)

      const px = eased * totalPx
      const baseDelta = Math.floor(px / FULL)
      const inner = px - baseDelta * FULL

      const base = startOffset + baseDelta

      // двигаем DOM (учитываем, что слева от base есть buffer элементов)
      trackRef.current.style.transform = `translate3d(${centerShiftRef.current - inner - buffer * FULL}px,0,0)`

      // base сменился -> обновляем окно
      if (base !== lastBaseRef.current) {
        lastBaseRef.current = base
        const seq = seqRef.current
        const wc = windowCountRef.current
        setWindowItems(seq.slice(base - buffer, base + wc + buffer))
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        // ===== ФИНАЛЬНЫЙ SNAP =====
        // чтобы под линией 100% оказался winId, и только потом показываем результат
        stopAll()

        const seq = seqRef.current
        const wc = windowCountRef.current
        const finalBase = startOffset + steps // px = totalPx => baseDelta=steps, inner=0

        // фиксируем трек и окно
        if (trackRef.current) {
          trackRef.current.style.transition = "none"
          trackRef.current.style.transform = `translate3d(${centerShiftRef.current - buffer * FULL}px,0,0)`
        }
        setWindowItems(seq.slice(finalBase - buffer, finalBase + wc + buffer))

        // дать React 1 кадр отрисовать "правильный" стоп
        requestAnimationFrame(() => {
          setPhase("result")
          setResult(winIdRef.current)
        })
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

        {/* ===== DROPS GRID (LOTTIE) ===== */}
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
                  key={isActive ? drop.id + "-active" : drop.id + "-idle"}
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

      {/* ===== RESULT (PNG, чтобы совпадало с рулеткой) ===== */}
      {result && (
        <div className="result-overlay">
          <div className="result-card">
            <div className="result-title">Поздравляем!</div>

            <div className="drop-card result-size">
              <img
                src={pngSrc(result)}
                alt={result}
                style={{ width: 110, height: 110, objectFit: "contain" }}
                draggable={false}
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
