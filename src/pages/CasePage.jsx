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

  // { winner, winIndex, durationMs }
  const pendingRef = useRef(null)
  const spinStartedRef = useRef(false)

  // чтобы не уйти в бесконечное "добавь хвост"
  const tailFixTriesRef = useRef(0)

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

  const randDropId = () => safeDrops[Math.floor(Math.random() * safeDrops.length)].id

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
    tailFixTriesRef.current = 0
    setPhase("preparing")

    await preloadAllPng()

    const winner = pickWeighted()

    const containerWidth =
      wrapRef.current?.getBoundingClientRect().width ||
      imgRef.current?.getBoundingClientRect().width ||
      320

    const approxStep = 160
    const visible = Math.ceil(containerWidth / approxStep)

    // winIndex подальше + очень жирный хвост
    const winIndex = 85 + Math.floor(Math.random() * 12)
    const totalItems = winIndex + visible + 260

    const items = new Array(totalItems)
    for (let i = 0; i < totalItems; i++) {
      if (i === winIndex) items[i] = winner
      else items[i] = randDropId()
    }

    if (items[winIndex - 1] === winner) items[winIndex - 1] = randDropId()
    if (items[winIndex + 1] === winner) items[winIndex + 1] = randDropId()

    const durationMs = 7200

    pendingRef.current = { winner, winIndex, durationMs }
    setReelItems(items)
    setPhase("spinning")
  }

  /* =============================
     START SPIN (FIXED "NOT WHAT YOU SEE")
     ФИКСЫ:
     1) финал снапится к центру
     2) результат = элемент, который реально в центре ПОСЛЕ снапа
     3) после snap читаем DOM-центр, а не "математику по transform"
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

    const start = () => {
      const itemsEls = reel.querySelectorAll(".roulette-item")
      if (!itemsEls || itemsEls.length < 2) return

      // реальный шаг по DOM (вместе с gap)
      const r1 = itemsEls[0].getBoundingClientRect()
      const r2 = itemsEls[1].getBoundingClientRect()
      const step = r2.left - r1.left
      if (!step || step < 50) return

      const containerWidth = wrap.getBoundingClientRect().width || 320
      const itemW = r1.width

      // base: чтобы центр item(0) попал в центр окна при offset=0
      const base = containerWidth / 2 - itemW / 2

      const maxOffset = Math.max(0, reel.scrollWidth - containerWidth)

      // целимся в winIndex
      const wantedOffset = winIndex * step - base

      // если вдруг не хватило хвоста — добавляем и повторяем
      if (wantedOffset > maxOffset - step * 3 && tailFixTriesRef.current < 2) {
        tailFixTriesRef.current += 1
        setReelItems((prev) => prev.concat(new Array(260).fill(null).map(() => randDropId())))
        return
      }

      // clamp
      let finalOffset = clamp(wantedOffset, 0, maxOffset)

      // старт позиции
      reel.style.transition = "none"
      reel.style.transform = "translate3d(0px,0,0)"
      void reel.offsetHeight

      spinStartedRef.current = true

      reel.style.transition = `transform ${durationMs}ms cubic-bezier(0.12,0.75,0.15,1)`
      reel.style.transform = `translate3d(-${finalOffset}px,0,0)`

      const onEnd = () => {
        reel.removeEventListener("transitionend", onEnd)

        // ====== SNAP ПО ЦЕНТРУ (выбираем лучший индекс и ставим его строго в центр) ======
        const centerX = wrap.getBoundingClientRect().left + containerWidth / 2

        // берем кандидатов вокруг рассчитанного индекса
        const approxIdx = Math.round((finalOffset + base) / step)
        let bestIdx = clamp(approxIdx, 0, reelItems.length - 1)
        let bestDist = Infinity

        for (let i = bestIdx - 4; i <= bestIdx + 4; i++) {
          const idx = clamp(i, 0, reelItems.length - 1)
          const el = itemsEls[idx]
          if (!el) continue
          const r = el.getBoundingClientRect()
          const c = r.left + r.width / 2
          const dist = Math.abs(c - centerX)
          if (dist < bestDist) {
            bestDist = dist
            bestIdx = idx
          }
        }

        // offset для идеального центрирования bestIdx
        let snappedOffset = bestIdx * step - base
        snappedOffset = clamp(snappedOffset, 0, maxOffset)

        // подгоняем к dpr ПОСЛЕ выбора bestIdx
        const dpr = window.devicePixelRatio || 1
        snappedOffset = Math.round(snappedOffset * dpr) / dpr

        // ставим точно (без дрожи)
        reel.style.transition = "none"
        reel.style.transform = `translate3d(-${snappedOffset}px,0,0)`

        // ====== ИСТИННЫЙ RESULT: ЧИТАЕМ ПОСЛЕ SNAP ЧЕРЕЗ DOM ======
        // На следующем кадре, чтобы браузер применил transform и пересчитал rect'ы
        requestAnimationFrame(() => {
          const itemsNow = reel.querySelectorAll(".roulette-item")
          const centerX2 = wrap.getBoundingClientRect().left + (wrap.getBoundingClientRect().width || containerWidth) / 2

          let finalIdx = bestIdx
          let finalDist = Infinity

          for (let i = Math.max(0, bestIdx - 6); i <= Math.min(itemsNow.length - 1, bestIdx + 6); i++) {
            const r = itemsNow[i].getBoundingClientRect()
            const c = r.left + r.width / 2
            const dist = Math.abs(c - centerX2)
            if (dist < finalDist) {
              finalDist = dist
              finalIdx = i
            }
          }

          const finalId = reelItems[finalIdx]
          setResult(finalId)
          setPhase("result")
        })
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
    tailFixTriesRef.current = 0
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
                    <div key={index} className="roulette-item" data-index={index}>
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
