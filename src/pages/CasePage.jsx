import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useLayoutEffect, useEffect, useMemo, memo } from "react"

import { cases } from "../data/cases"

/* =============================
   PNG NAME NORMALIZER
   - fixes id/file mismatch + case sensitivity
   Files you have in /public/drops:
   HeroicHelmet, IonicDryer, LootBag, Lowrider, SwissWatch, WestsideSign,
   ball, batman, book, key, metla, poison, skull
============================= */
const DROP_PNG_MAP = {
  // canonical (exact filenames)
  HeroicHelmet: "HeroicHelmet",
  IonicDryer: "IonicDryer",
  LootBag: "LootBag",
  Lowrider: "Lowrider",
  SwissWatch: "SwissWatch",
  WestsideSign: "WestsideSign",
  ball: "ball",
  batman: "batman",
  book: "book",
  key: "key",
  metla: "metla",
  poison: "poison",
  skull: "skull",

  // common variants (just in case cases.js uses other ids)
  heroichelmet: "HeroicHelmet",
  heroicHelmet: "HeroicHelmet",
  HEROICHELMET: "HeroicHelmet",

  ionicdryer: "IonicDryer",
  ionicDryer: "IonicDryer",
  IONICDRYER: "IonicDryer",

  lootbag: "LootBag",
  lootBag: "LootBag",
  LOOTBAG: "LootBag",

  lowrider: "Lowrider",
  LowRider: "Lowrider",
  LOWRIDER: "Lowrider",

  swisswatch: "SwissWatch",
  swissWatch: "SwissWatch",
  SWISSWATCH: "SwissWatch",

  westsidesign: "WestsideSign",
  westsideSign: "WestsideSign",
  WestSideSign: "WestsideSign",
  WESTSIDESIGN: "WestsideSign",
}

function pngNameForDropId(dropId) {
  if (!dropId) return null
  return DROP_PNG_MAP[dropId] || DROP_PNG_MAP[String(dropId).toLowerCase()] || dropId
}

function pngSrcForDropId(dropId) {
  const name = pngNameForDropId(dropId)
  return name ? `/drops/${name}.png` : ""
}

/* =============================
   ROULETTE SLOT (PNG ONLY)
============================= */
const RouletteSlot = memo(function RouletteSlot({ dropId }) {
  return (
    <img
      src={pngSrcForDropId(dropId)}
      alt={dropId}
      style={{
        width: 80,
        height: 80,
        objectFit: "contain",
        pointerEvents: "none",
        userSelect: "none",
      }}
      draggable={false}
      loading="eager"
    />
  )
})

function CasePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caseData = cases[id]

  const [phase, setPhase] = useState("idle") // idle -> preparing -> spinning -> result
  const [result, setResult] = useState(null)
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

  // sizes must match CSS
  const ITEM_W = 140
  const GAP = 20
  const FULL = ITEM_W + GAP

  if (!caseData) return <div className="app">Case config missing</div>

  // ✅ now "safeDrops" means: we only keep drops that have known png name
  // (prevents '?' in roulette/grid if your cases.js contains extra ids)
  const safeDrops = useMemo(() => {
    return (caseData.drops || []).filter((d) => !!pngNameForDropId(d.id))
  }, [caseData.drops])

  if (!safeDrops.length) {
    return <div className="app">No drops with matching PNG found for this case.</div>
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

    // no adjacent duplicates for win
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

    const steps = 110
    stepsRef.current = steps

    const seq = buildSequence(winIdRef.current, steps, windowCount, selectIndex)
    seqRef.current = seq

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
  ============================= */
  useEffect(() => {
    if (phase !== "spinning") return
    if (!trackRef.current) return

    const duration = 3600
    const steps = stepsRef.current
    const totalPx = FULL * steps

    startRef.current = performance.now()
    lastBaseRef.current = -1

    const tick = (now) => {
      const t = Math.min((now - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3.15)

      const px = eased * totalPx
      const base = Math.floor(px / FULL)
      const inner = px - base * FULL

      trackRef.current.style.transform = `translate3d(${centerShiftRef.current - inner}px,0,0)`

      if (base !== lastBaseRef.current) {
        const prevBase = lastBaseRef.current
        lastBaseRef.current = base

        const seq = seqRef.current
        const wc = windowCountRef.current

        if (prevBase !== -1 && base === prevBase + 1) {
          setWindowItems((prev) => {
            if (!prev || prev.length !== wc) return seq.slice(base, base + wc)
            const next = prev.slice(1)
            next.push(seq[base + wc - 1])
            return next
          })
        } else {
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

        {/* GRID: PNG ONLY */}
        <div className="casepage-drops">
          {safeDrops.map((drop) => (
            <div key={drop.id} className="drop-card">
              <img
                src={pngSrcForDropId(drop.id)}
                alt={drop.name || drop.id}
                className="drop-image"
                draggable={false}
                loading="lazy"
              />
              <div className="drop-name">{drop.name || drop.id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RESULT: PNG ONLY */}
      {result && (
        <div className="result-overlay">
          <div className="result-card">
            <div className="result-title">Поздравляем!</div>

            <div className="drop-card result-size">
              <img
                src={pngSrcForDropId(result)}
                alt={result}
                className="drop-image"
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
