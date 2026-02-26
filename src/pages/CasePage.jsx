import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
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

function CasePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)

  const [phase, setPhase] = useState("idle") // idle | preparing | spinning | result
  const [result, setResult] = useState(null)
  const [reelItems, setReelItems] = useState([])

  const wrapRef = useRef(null)     // контейнер окна (ширина как у кейса)
  const reelRef = useRef(null)     // трек, который двигаем
  const imgRef = useRef(null)

  const pendingRef = useRef(null)  // { winner, winIndex }
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
      uniq.map(src => new Promise((resolve) => {
        const img = new Image()
        img.onload = resolve
        img.onerror = resolve
        img.src = src
      }))
    )
  }

  /* =============================
     GRID CLICK (Lottie plays)
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

    setResult(null)
    setReelItems([])
    pendingRef.current = null
    spinStartedRef.current = false
    setPhase("preparing")

    await preloadAllPng()

    const winner = pickWeighted()

    // длиннее лента = никогда не увидишь край
    const totalItems = 90
    const winIndex = 65

    const items = []
    for (let i = 0; i < totalItems; i++) {
      if (i === winIndex) items.push(winner)
      else items.push(safeDrops[Math.floor(Math.random() * safeDrops.length)].id)
    }

    pendingRef.current = { winner, winIndex }
    setReelItems(items)

    // важно: переключаем фазу после того, как items готовы
    setPhase("spinning")
  }

  /* =============================
     START SPIN (only when DOM is ready)
  ============================= */
  useLayoutEffect(() => {
    if (phase !== "spinning") return
    if (!reelRef.current) return
    if (!wrapRef.current) return
    if (!reelItems.length) return
    if (!pendingRef.current) return
    if (spinStartedRef.current) return

    const reel = reelRef.current
    const { winner, winIndex } = pendingRef.current

    // двойной rAF — чтобы iOS/Telegram точно успели размонтировать/смонтировать DOM
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const item = reel.querySelector(".roulette-item")
        if (!item) return

        const gap = parseInt(getComputedStyle(reel).gap) || 20
        const itemWidth = item.offsetWidth + gap

        const containerWidth = wrapRef.current.offsetWidth || 320

        const offset =
          winIndex * itemWidth -
          containerWidth / 2 +
          itemWidth / 2

        reel.style.transition = "none"
        reel.style.transform = "translateX(0px)"
        void reel.offsetHeight

        spinStartedRef.current = true

        reel.style.transition = "transform 5.2s cubic-bezier(0.12,0.75,0.15,1)"
        reel.style.transform = `translateX(-${offset}px)`

        const onEnd = () => {
          reel.removeEventListener("transitionend", onEnd)
          setResult(winner)
          setPhase("result")
        }

        reel.addEventListener("transitionend", onEnd)
      })
    })
  }, [phase, reelItems])

  /* =============================
     RESET
  ============================= */
  const sellItem = () => {
    setResult(null)
    setReelItems([])
    pendingRef.current = null
    spinStartedRef.current = false
    setPhase("idle")

    if (reelRef.current) {
      reelRef.current.style.transition = "none"
      reelRef.current.style.transform = "translateX(0px)"
    }
  }

  const openAgain = () => {
    sellItem()
    openCase()
  }

  const isSpinning = phase === "preparing" || phase === "spinning"
  const blurred = phase === "result" && result != null

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

          {/* ВАЖНО: картинка всегда в DOM, просто прячем при спине */}
          <div className="case-image-wrapper">
            <img
              ref={imgRef}
              src={caseData.image}
              className={`casepage-case-image ${isSpinning ? "hidden-case" : ""}`}
              alt={caseData.name}
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

          {/* КНОПКА ВСЕГДА НА МЕСТЕ */}
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

        {/* GRID всегда ниже, не прыгает */}
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

      {result && (
        <div className="result-overlay">
          <div className="result-card">
            <div className="result-title">Поздравляем!</div>

            <div className="drop-card result-size">
              <img src={pngSrc(result)} className="result-png" alt="" draggable={false} />
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
