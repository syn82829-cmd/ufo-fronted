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

    // ширина окна — если wrap ещё не в DOM, берём img
    const containerWidth =
      wrapRef.current?.getBoundingClientRect().width ||
      imgRef.current?.getBoundingClientRect().width ||
      320

    // просто для прикидки длины, не для точной математики
    const approxStep = 160
    const visible = Math.ceil(containerWidth / approxStep)

    // делаем хвост реально большим, чтобы winIndex никогда не оказался близко к концу
    const winIndex = 85 + Math.floor(Math.random() * 12) // чуть дальше, чтобы “дороже”
    const totalItems = winIndex + visible + 260 // ВАЖНО: жирный хвост справа

    const items = new Array(totalItems)
    for (let i = 0; i < totalItems; i++) {
      if (i === winIndex) items[i] = winner
      else items[i] = randDropId()
    }

    // косметика: не ставим winner рядом с winner
    if (items[winIndex - 1] === winner) items[winIndex - 1] = randDropId()
    if (items[winIndex + 1] === winner) items[winIndex + 1] = randDropId()

    const durationMs = 7200

    pendingRef.current = { winner, winIndex, durationMs }
    setReelItems(items)
    setPhase("spinning")
  }

  /* =============================
     START SPIN (железный фикс)
     - шаг считаем по DOM (левый край 2-го - левый край 1-го)
     - offset считаем так, чтобы ЦЕНТР winIndex совпал с центром окна
     - offset подгоняем под devicePixelRatio (убирает “между” на iOS/Telegram)
     - РЕЗУЛЬТАТ считаем ПО ФИНАЛЬНОМУ offset (математически),
       то есть 100% совпадает с тем, что на экране под линией.
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

    const start = () => {
      const itemsEls = reel.querySelectorAll(".roulette-item")
      if (!itemsEls || itemsEls.length < 2) return

      const r1 = itemsEls[0].getBoundingClientRect()
      const r2 = itemsEls[1].getBoundingClientRect()

      const step = r2.left - r1.left // включает gap
      if (!step || step < 50) return

      const containerWidth = wrap.getBoundingClientRect().width || 320
      const itemW = r1.width

      // base = сколько надо, чтобы центр 0-го итема совпал с центром окна при offset=0
      const base = containerWidth / 2 - itemW / 2

      // целимся строго в winIndex
      const wantedOffset = winIndex * step - base

      // Проверка "хвоста" (на всякий):
      // если вдруг maxOffset меньше wantedOffset — значит ленты не хватило
      const maxOffset = Math.max(0, reel.scrollWidth - containerWidth)
      if (wantedOffset > maxOffset - step * 3 && tailFixTriesRef.current < 2) {
        tailFixTriesRef.current += 1

        // добавим хвост и попробуем ещё раз автоматически
        setReelItems((prev) => {
          const extra = new Array(260).fill(null).map(() => randDropId())
          return prev.concat(extra)
        })
        return
      }

      // clamp (но почти никогда не сработает, т.к. хвост большой)
      let finalOffset = Math.min(Math.max(wantedOffset, 0), maxOffset)

      // ✅ главный фикс “между блоками” на iOS/Telegram:
      // подгоняем offset под пиксельную сетку девайса
      const dpr = window.devicePixelRatio || 1
      finalOffset = Math.round(finalOffset * dpr) / dpr

      // старт в нуле
      reel.style.transition = "none"
      reel.style.transform = "translate3d(0px,0,0)"
      void reel.offsetHeight

      spinStartedRef.current = true

      // крутим
      reel.style.transition = `transform ${durationMs}ms cubic-bezier(0.12,0.75,0.15,1)`
      reel.style.transform = `translate3d(-${finalOffset}px,0,0)`

      const onEnd = () => {
        reel.removeEventListener("transitionend", onEnd)

        // фиксируем без дрожи
        reel.style.transition = "none"
        reel.style.transform = `translate3d(-${finalOffset}px,0,0)`

        // 🔥 РЕАЛЬНЫЙ индекс под линией:
        // центр окна соответствует координате (finalOffset + base) в “шаговой” системе
        const idx = Math.round((finalOffset + base) / step)

        // защита от выхода за границы
        const safeIdx = Math.min(Math.max(idx, 0), reelItems.length - 1)

        // ✅ результат 100% совпадает с тем, что под линией
        setResult(reelItems[safeIdx])
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
                      <img
                        src={pngSrc(dropId)}
                        className="roulette-png"
                        alt=""
                        draggable={false}
                      />
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
