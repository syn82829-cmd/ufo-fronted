import { useParams, useNavigate } from "react-router-dom"
import { useLayoutEffect, useMemo, useRef, useState } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

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

function CasePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)
  const [phase, setPhase] = useState("idle")
  const [result, setResult] = useState(null)
  const [reelItems, setReelItems] = useState([])

  const wrapRef = useRef(null)
  const reelRef = useRef(null)
  const imgRef = useRef(null)

  const spinDataRef = useRef(null) // { winnerIndex, duration }
  const spinStartedRef = useRef(false)

  if (!caseData) return <div className="app">Case config missing</div>

  const safeDrops = useMemo(() => {
    return (caseData.drops || []).filter(d => Boolean(PNG_BY_ID[d.id] || d.id))
  }, [caseData.drops])

  /* =============================
     PRELOAD PNG
  ============================= */
  const preloadAllPng = async () => {
    const uniq = Array.from(new Set(safeDrops.map(d => pngSrc(d.id))))
    await Promise.all(
      uniq.map(src =>
        new Promise(res => {
          const img = new Image()
          img.onload = res
          img.onerror = res
          img.src = src
        })
      )
    )
  }

  /* =============================
     WEIGHTED PICK
  ============================= */
  const pickWeighted = () => {
    const pool = []
    safeDrops.forEach(drop => {
      const w = drop.chance || 10
      for (let i = 0; i < w; i++) pool.push(drop.id)
    })
    return pool[Math.floor(Math.random() * pool.length)]
  }

  /* =============================
     OPEN CASE
  ============================= */
  const openCase = async () => {
    if (phase === "preparing" || phase === "spinning") return
    if (!safeDrops.length) return

    setResult(null)
    setReelItems([])
    spinDataRef.current = null
    spinStartedRef.current = false
    setPhase("preparing")

    await preloadAllPng()

    const winner = pickWeighted()

    const winIndex = 80 + Math.floor(Math.random() * 10)
    const totalItems = winIndex + 120

    const items = new Array(totalItems)

    for (let i = 0; i < totalItems; i++) {
      if (i === winIndex) items[i] = winner
      else items[i] = safeDrops[Math.floor(Math.random() * safeDrops.length)].id
    }

    spinDataRef.current = {
      winnerIndex: winIndex,
      duration: 7000,
    }

    setReelItems(items)
    setPhase("spinning")
  }

  /* =============================
     START SPIN (детерминированный)
  ============================= */
  useLayoutEffect(() => {
    if (phase !== "spinning") return
    if (!reelRef.current || !wrapRef.current) return
    if (!reelItems.length) return
    if (!spinDataRef.current) return
    if (spinStartedRef.current) return

    const reel = reelRef.current
    const wrap = wrapRef.current
    const { winnerIndex, duration } = spinDataRef.current

    const itemsEls = reel.querySelectorAll(".roulette-item")
    if (itemsEls.length < 2) return

    const r1 = itemsEls[0].getBoundingClientRect()
    const r2 = itemsEls[1].getBoundingClientRect()

    const step = r2.left - r1.left
    const itemWidth = r1.width
    const containerWidth = wrap.getBoundingClientRect().width

    const base = containerWidth / 2 - itemWidth / 2

    let offset = winnerIndex * step - base

    const maxOffset = reel.scrollWidth - containerWidth
    offset = Math.min(Math.max(offset, 0), maxOffset)

    reel.style.transition = "none"
    reel.style.transform = "translate3d(0,0,0)"
    void reel.offsetHeight

    spinStartedRef.current = true

    reel.style.transition = `transform ${duration}ms cubic-bezier(0.12,0.75,0.15,1)`
    reel.style.transform = `translate3d(-${offset}px,0,0)`

    const onEnd = () => {
      reel.removeEventListener("transitionend", onEnd)

      reel.style.transition = "none"
      reel.style.transform = `translate3d(-${offset}px,0,0)`

      // ✅ ОДИН источник истины
      setResult(reelItems[winnerIndex])
      setPhase("result")
    }

    reel.addEventListener("transitionend", onEnd)
  }, [phase, reelItems])

  /* =============================
     RESET
  ============================= */
  const sellItem = () => {
    setResult(null)
    setReelItems([])
    spinDataRef.current = null
    spinStartedRef.current = false
    setPhase("idle")

    if (reelRef.current) {
      reelRef.current.style.transition = "none"
      reelRef.current.style.transform = "translate3d(0,0,0)"
    }
  }

  const openAgain = () => {
    sellItem()
    openCase()
  }

  const isSpinning = phase === "preparing" || phase === "spinning"
  const blurred = phase === "result"

  return (
    <div className="app">
      <div className={blurred ? "blurred" : ""}>
        <div className="casepage-header">

          <div className="casepage-title-row">
            <button className="casepage-header-btn" onClick={() => navigate(-1)}>←</button>
            <div className="casepage-title">{caseData.name}</div>
            <button className="casepage-header-btn">⚙</button>
          </div>

          <div className="case-image-wrapper">
            <img
              ref={imgRef}
              src={caseData.image}
              className={`casepage-case-image ${isSpinning ? "hidden-case" : ""}`}
              alt=""
            />

            {isSpinning && (
              <div ref={wrapRef} className="roulette-window">
                <div className="roulette-line" />
                <div ref={reelRef} className="roulette-reel">
                  {reelItems.map((dropId, index) => (
                    <div key={index} className="roulette-item">
                      <img src={pngSrc(dropId)} className="roulette-png" alt="" draggable={false} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!result && (
            <button
              className="casepage-open-btn"
              onClick={openCase}
              disabled={phase !== "idle"}
            >
              {phase === "spinning" ? "Крутится…" : "Открыть кейс"}
            </button>
          )}
        </div>

        <div className="casepage-drops">
          {caseData.drops.map((drop) => {
            const isActive = activeDrop === drop.id
            return (
              <div key={drop.id} className="drop-card" onClick={() => setActiveDrop(drop.id)}>
                <Lottie
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
              <img src={pngSrc(result)} className="result-png" alt="" draggable={false} />
              <div className="drop-name">{result}</div>
            </div>

            <div className="result-buttons">
              <button className="glass-btn sell" onClick={sellItem}>Продать</button>
              <button className="glass-btn open" onClick={openAgain}>Открыть еще</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CasePage
