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

  // winnerRef нужен только чтобы "вставить" победителя в ленту,
  // а фактический финальный результат мы всё равно берём по индексу под линией.
  const pendingRef = useRef(null) // { winner, winIndex, durationMs }
  const spinStartedRef = useRef(false)

  // размеры должны соответствовать CSS:
  const ITEM_W = 140
  const GAP = 20
  const FULL = ITEM_W + GAP

  if (!caseData) return <div className="app">Case config missing</div>

  const safeDrops = useMemo(() => {
    return (caseData.drops || []).filter((d) => Boolean(PNG_BY_ID[d.id] || d.id))
  }, [caseData.drops])

  /* =============================
     PRELOAD PNG (чтобы не грузилось по ходу)
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
     Главная правка:
     - totalItems и winIndex зависят от ширины окна и FULL
     - делаем гарантированный “хвост” справа, чтобы лента НЕ кончалась
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

    // ширина окна (как у кейса)
    const containerWidth =
      wrapRef.current?.offsetWidth ||
      imgRef.current?.offsetWidth ||
      320

    // сколько элементов видно одновременно
    const visible = Math.ceil(containerWidth / FULL)

    // хвост справа — чтобы никогда не увидеть край
    const tail = visible + 14

    // индекс выигрыша — побольше, чтобы крутилось "дольше" и "дороже"
    // (можно чуть рандомизировать, чтобы не одинаково каждый раз)
    const winIndex = 70 + Math.floor(Math.random() * 8)

    // totalItems подбираем так, чтобы offset гарантированно влезал
    // + ещё большой запас справа
    const totalItems = winIndex + tail + 80

    const items = new Array(totalItems)

    for (let i = 0; i < totalItems; i++) {
      if (i === winIndex) {
        items[i] = winner
      } else {
        items[i] = safeDrops[Math.floor(Math.random() * safeDrops.length)].id
      }
    }

    // убираем дубль рядом с winner (косметика)
    if (items[winIndex - 1] === winner) items[winIndex - 1] = safeDrops[Math.floor(Math.random() * safeDrops.length)].id
    if (items[winIndex + 1] === winner) items[winIndex + 1] = safeDrops[Math.floor(Math.random() * safeDrops.length)].id

    // скорость/длительность — медленнее и стабильнее
    const durationMs = 6800

    pendingRef.current = { winner, winIndex, durationMs }
    setReelItems(items)
    setPhase("spinning")
  }

  /* =============================
     START SPIN (only when DOM is ready)
     Главные правки:
     - clamp offset по scrollWidth (убивает пустоту НАВСЕГДА)
     - финальный результат берём по фактическому индексу под линией
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
      const item = reel.querySelector(".roulette-item")
      if (!item) return

      const gap = parseInt(getComputedStyle(reel).gap) || GAP
      const itemWidth = item.offsetWidth + gap

      const containerWidth = wrap.offsetWidth || 320

      // offset, который бы идеально поставил winIndex под линию
      const wantedOffset =
        winIndex * itemWidth -
        containerWidth / 2 +
        itemWidth / 2

      // ✅ ЖЕЛЕЗНЫЙ ФИКС: не даём уехать дальше ширины ленты
      const maxOffset = Math.max(0, reel.scrollWidth - containerWidth)
      const safeOffset = Math.min(Math.max(0, wantedOffset), maxOffset)

      // ✅ Индекс элемента, который окажется под линией при safeOffset
      // (чтобы результат 100% совпадал с тем, что на экране)
      const finalIndex = Math.round(
        (safeOffset + containerWidth / 2 - itemWidth / 2) / itemWidth
      )
      const finalId = reelItems[finalIndex] ?? reelItems[winIndex]

      reel.style.transition = "none"
      reel.style.transform = "translateX(0px)"
      void reel.offsetHeight

      spinStartedRef.current = true

      reel.style.transition = `transform ${durationMs}ms cubic-bezier(0.12,0.75,0.15,1)`
      reel.style.transform = `translateX(-${safeOffset}px)`

      const onEnd = () => {
        reel.removeEventListener("transitionend", onEnd)
        setResult(finalId)
        setPhase("result")
      }

      reel.addEventListener("transitionend", onEnd)
    }

    // двойной rAF — чтобы Telegram/iOS точно успели разложить DOM
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
