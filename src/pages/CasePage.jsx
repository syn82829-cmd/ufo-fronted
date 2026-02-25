import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useLayoutEffect, useEffect, useMemo, memo } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

/* =============================
   LOTTIE ID -> PNG filename map
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
  poizon: "poison",
  metla: "metla",
  ball: "ball",
  book: "book",
}
const pngSrc = (dropId) => `/drops/${(PNG_BY_ID[dropId] || dropId)}.png`

/* =============================
   ROULETTE SLOT (PNG ONLY)
============================= */
const RouletteSlot = memo(function RouletteSlot({ dropId }) {
  return (
    <img
      src={pngSrc(dropId)}
      alt={dropId}
      className="roulette-png"
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

  const [windowItems, setWindowItems] = useState([])
  const [rouletteW, setRouletteW] = useState(null)

  const wrapRef = useRef(null)
  const trackRef = useRef(null)
  const caseImgRef = useRef(null)

  const rafRef = useRef(null)
  const startRef = useRef(0)
  const lastBaseRef = useRef(-1)

  const seqRef = useRef([])
  const stepsRef = useRef(0)
  const windowCountRef = useRef(18)
  const selectIndexRef = useRef(0)
  const centerShiftRef = useRef(0)

  const bufferRef = useRef(8)         // побольше, чтобы край DOM никогда не попадал в окно
  const startOffsetRef = useRef(0)

  // размеры должны совпадать с CSS
  const ITEM_W = 140
  const GAP = 20
  const FULL = ITEM_W + GAP

  if (!caseData) return <div className="app">Case config missing</div>

  const safeDrops = useMemo(() => {
    return (caseData.drops || []).filter((d) => Boolean(PNG_BY_ID[d.id] || d.id))
  }, [caseData.drops])

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

  const buildSequence = (steps, windowCount, selectIndex, startOffset, buffer, forcedWinner) => {
    // запас делаем жирный — чтобы вообще никогда не закончилась
    const total = startOffset + steps + selectIndex + windowCount + buffer + 400
    const seq = new Array(total)

    let prev = null
    for (let i = 0; i < total; i++) {
      const r = randIdNoRepeat(prev)
      seq[i] = r
      prev = r
    }

    // Победитель ставится в гарантированную позицию
    const winPos = startOffset + steps + selectIndex
    seq[winPos] = forcedWinner

    // убираем дубль рядом
    if (winPos - 1 >= 0 && seq[winPos - 1] === forcedWinner) seq[winPos - 1] = randIdNoRepeat(forcedWinner)
    if (winPos + 1 < total && seq[winPos + 1] === forcedWinner) seq[winPos + 1] = randIdNoRepeat(forcedWinner)

    return { seq, winPos }
  }

  const stopAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }
  useEffect(() => stopAll, [])

  // preload PNG чтобы не было “что-то грузится по ходу”
  const preloadAllPng = async () => {
    const uniq = Array.from(new Set(safeDrops.map((d) => pngSrc(d.id))))
    await Promise.all(
      uniq.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image()
            img.onload = resolve
            img.onerror = resolve
            img.src = src
          })
      )
    )
  }

  const openCase = async () => {
    if (phase === "preparing" || phase === "spinning") return

    stopAll()
    setResult(null)
    setWindowItems([])
    lastBaseRef.current = -1

    setPhase("preparing")

    // важная штука: прогреваем png
    await preloadAllPng()

    setPhase("preparing") // (на случай, если React успел)
    // выбираем победителя
    const winner = pickWeighted()

    // рассчитываем ширину рулетки = ширина кейса (картинки)
    const imgW = caseImgRef.current?.offsetWidth || 320
    setRouletteW(imgW)

    // дальше подготовка в useLayoutEffect, но winner пробрасываем в ref
    // просто запишем в ref через seqRef на prep этапе
    winIdRef.current = winner
  }

  const winIdRef = useRef(null)

  /* =============================
     PREP
  ============================= */
  useLayoutEffect(() => {
    if (phase !== "preparing") return
    if (!wrapRef.current) return
    if (!winIdRef.current) return

    const containerWidth = rouletteW || caseImgRef.current?.offsetWidth || 320

    const visible = Math.ceil(containerWidth / FULL)
    const windowCount = Math.min(Math.max(visible + 6, 12), 18) // чуть меньше — плотнее и стабильнее
    windowCountRef.current = windowCount

    const selectIndex = Math.floor(windowCount / 2)
    selectIndexRef.current = selectIndex

    const centerX = containerWidth / 2 - ITEM_W / 2
    centerShiftRef.current = centerX - selectIndex * FULL

    const buffer = 8
    bufferRef.current = buffer
    const startOffset = buffer
    startOffsetRef.current = startOffset

    const steps = 96
    stepsRef.current = steps

    const { seq } = buildSequence(steps, windowCount, selectIndex, startOffset, buffer, winIdRef.current)
    seqRef.current = seq

    const base0 = startOffset
    setWindowItems(seq.slice(base0 - buffer, base0 + windowCount + buffer))

    requestAnimationFrame(() => {
      if (trackRef.current) {
        trackRef.current.style.transition = "none"
        // стартуем с учётом buffer слева
        trackRef.current.style.transform = `translate3d(${centerShiftRef.current - buffer * FULL}px,0,0)`
        void trackRef.current.offsetHeight
      }
      setPhase("spinning")
    })
  }, [phase, rouletteW])

  /* =============================
     SPIN
  ============================= */
  useEffect(() => {
    if (phase !== "spinning") return
    if (!trackRef.current) return

    const duration = 5200
    const steps = stepsRef.current
    const totalPx = FULL * steps
    const buffer = bufferRef.current
    const startOffset = startOffsetRef.current
    const seq = seqRef.current
    const wc = windowCountRef.current

    startRef.current = performance.now()
    lastBaseRef.current = -1

    const tick = (now) => {
      const t = Math.min((now - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3.6)

      const px = eased * totalPx
      const baseDelta = Math.floor(px / FULL)
      const inner = px - baseDelta * FULL
      const base = startOffset + baseDelta

      trackRef.current.style.transform = `translate3d(${centerShiftRef.current - inner - buffer * FULL}px,0,0)`

      if (base !== lastBaseRef.current) {
        lastBaseRef.current = base
        setWindowItems(seq.slice(base - buffer, base + wc + buffer))
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        stopAll()

        // ===== ФИНАЛ: берём фактический элемент под линией =====
        const finalBase = startOffset + steps
        const finalIndex = finalBase + selectIndexRef.current
        const finalWinner = seq[finalIndex] // <-- вот это 100% совпадает с тем, что под линией

        // snap transform (inner=0)
        if (trackRef.current) {
          trackRef.current.style.transition = "none"
          trackRef.current.style.transform = `translate3d(${centerShiftRef.current - buffer * FULL}px,0,0)`
        }
        setWindowItems(seq.slice(finalBase - buffer, finalBase + wc + buffer))

        requestAnimationFrame(() => {
          setResult(finalWinner)
          setPhase("result")
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
    winIdRef.current = null
    setRouletteW(null)
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
            <button type="button" className="casepage-header-btn casepage-back-btn" onClick={() => navigate(-1)}>
              ←
            </button>
            <div className="casepage-title">{caseData.name}</div>
            <button type="button" className="casepage-header-btn casepage-settings-btn">⚙</button>
          </div>

          <div className="case-image-wrapper">
            <img
              ref={caseImgRef}
              src={caseData.image}
              className={`casepage-case-image ${showRoulette ? "hidden-case" : ""}`}
              alt={caseData.name}
            />

            {showRoulette && (
              <div
                className="roulette-absolute"
                ref={wrapRef}
                style={{ width: rouletteW ? `${rouletteW}px` : undefined }}
              >
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
              <div key={drop.id} className="drop-card" onClick={() => handleClick(drop.id)}>
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

      {/* ===== RESULT (PNG) ===== */}
      {result && (
        <div className="result-overlay">
          <div className="result-card">
            <div className="result-title">Поздравляем!</div>

            <div className="drop-card result-size">
              <img src={pngSrc(result)} alt={result} className="result-png" draggable={false} />
              <div className="drop-name">{result}</div>
            </div>

            <div className="result-buttons">
              <button type="button" className="glass-btn sell" onClick={sellItem}>Продать</button>
              <button type="button" className="glass-btn open" onClick={openAgain}>Открыть еще</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CasePage
