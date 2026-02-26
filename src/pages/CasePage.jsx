import { useParams, useNavigate } from "react-router-dom"
import { useLayoutEffect, useMemo, useRef, useState } from "react"
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

  const wrapRef = useRef(null)
  const reelRef = useRef(null)
  const imgRef = useRef(null)

  const pendingRef = useRef(null) // { winner, winIndex, durationMs }
  const spinStartedRef = useRef(false)

  // дефолты (на случай если computedStyle вернёт "normal")
  const FALLBACK_GAP = 20

  if (!caseData) return <div className="app">Case config missing</div>

  const safeDrops = useMemo(() => {
    return (caseData.drops || []).filter((d) => Boolean(PNG_BY_ID[d.id] || d.id))
  }, [caseData.drops])

  /* =============================
     PRELOAD PNG
  ============================= */
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
    safeDrops.forEach((drop) => {
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
    pendingRef.current = null
    spinStartedRef.current = false
    setPhase("preparing")

    await preloadAllPng()

    const winner = pickWeighted()

    // ширина окна — если wrap ещё не в DOM (первый запуск), берём img
    const containerWidth =
      wrapRef.current?.getBoundingClientRect().width ||
      imgRef.current?.getBoundingClientRect().width ||
      320

    // приблизительно сколько элементов видно
    // (используем 160 как “140 + 20”, но это только для длины ленты; реальный шаг берём потом из DOM)
    const approxStep = 160
    const visible = Math.ceil(containerWidth / approxStep)
    const tail = visible + 14

    const winIndex = 70 + Math.floor(Math.random() * 8)
    const totalItems = winIndex + tail + 90 // побольше запас

    const items = new Array(totalItems)
    for (let i = 0; i < totalItems; i++) {
      if (i === winIndex) items[i] = winner
      else items[i] = safeDrops[Math.floor(Math.random() * safeDrops.length)].id
    }

    if (items[winIndex - 1] === winner) items[winIndex - 1] = safeDrops[Math.floor(Math.random() * safeDrops.length)].id
    if (items[winIndex + 1] === winner) items[winIndex + 1] = safeDrops[Math.floor(Math.random() * safeDrops.length)].id

    const durationMs = 6800

    pendingRef.current = { winner, winIndex, durationMs }
    setReelItems(items)
    setPhase("spinning")
  }

  /* =============================
     START SPIN
     FIX:
     - snap ПО СЕТКЕ ЦЕНТРОВ (зависит от containerWidth!)
     - результат берём по snapped index
  ============================= */
  useLayoutEffect(() => {
    if (phase !== "spinning") return
    if (!reelRef.current) return
    if (!wrapRef.current) return
    if (!reelItems.length) return
    if (!pendingRef.current) return
    if (spinStartedRef.current) return

    const reel = reelRef.current
    const wrap = wrapRef.current
    const { winIndex, durationMs } = pendingRef.current

    const clamp = (v, a, b) => Math.min(Math.max(v, a), b)

    const measure = () => {
      const firstItem = reel.querySelector(".roulette-item")
      if (!firstItem) return null

      const gapRaw = getComputedStyle(reel).gap || `${FALLBACK_GAP}px`
      const gapVal = parseFloat(String(gapRaw).split(" ")[0]) || FALLBACK_GAP

      const itemRectW = firstItem.getBoundingClientRect().width
      const itemWidth = itemRectW + gapVal

      const containerWidth = wrap.getBoundingClientRect().width || 320
      const maxOffsetRaw = Math.max(0, reel.scrollWidth - containerWidth)

      // base — это сдвиг сетки центров относительно offset=0
      // offsets, которые идеально центруют слот i:  i*itemWidth - base
      const base = containerWidth / 2 - itemWidth / 2

      return { itemWidth, containerWidth, maxOffsetRaw, base }
    }

    const start = () => {
      const m = measure()
      if (!m) return
      const { itemWidth, containerWidth, maxOffsetRaw, base } = m

      // offset, который бы идеально поставил winIndex под линию (в центр)
      const wantedOffset = winIndex * itemWidth - base

      // сначала clamp в пределах ленты
      const safeOffset = clamp(wantedOffset, 0, maxOffsetRaw)

      // ✅ ВАЖНО: snap не от 0, а по "сетке центров":
      // snappedOffset = round((offset + base)/itemWidth) * itemWidth - base
      let snappedOffset =
        Math.round((safeOffset + base) / itemWidth) * itemWidth - base

      // ещё раз clamp
      snappedOffset = clamp(snappedOffset, 0, maxOffsetRaw)

      // индекс элемента, который будет под линией при snappedOffset
      const finalIndex = Math.round((snappedOffset + base) / itemWidth)
      const finalId =
        reelItems[finalIndex] ??
        reelItems[Math.min(Math.max(winIndex, 0), reelItems.length - 1)]

      // старт в нуле
      reel.style.transition = "none"
      reel.style.transform = "translate3d(0px,0,0)"
      void reel.offsetHeight

      spinStartedRef.current = true

      reel.style.transition = `transform ${durationMs}ms cubic-bezier(0.12,0.75,0.15,1)`
      reel.style.transform = `translate3d(-${snappedOffset}px,0,0)`

      const onEnd = () => {
        reel.removeEventListener("transitionend", onEnd)

        // на iOS иногда на финале есть микро-сдвиг, поэтому:
        // 1) фиксируем transform
        reel.style.transition = "none"
        reel.style.transform = `translate3d(-${snappedOffset}px,0,0)`

        // 2) пересчитываем финальный индекс ещё раз на финальных метриках (на всякий)
        const m2 = measure()
        if (m2) {
          const idx2 = Math.round((snappedOffset + m2.base) / m2.itemWidth)
          const id2 = reelItems[idx2] ?? finalId
          setResult(id2)
        } else {
          setResult(finalId)
        }

        setPhase("result")
      }

      reel.addEventListener("transitionend", onEnd)
    }

    requestAnimationFrame(() => requestAnimationFrame(start))
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
      reelRef.current.style.transform = "translate3d(0px,0,0)"
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
