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

  // этапы: idle -> preparing -> spinning -> result
  const [phase, setPhase] = useState("idle")
  const [result, setResult] = useState(null)
  const [reelItems, setReelItems] = useState([])

  const reelRef = useRef(null)
  const rouletteWrapRef = useRef(null)

  const spinTimeout = useRef(null)
  const prepTimeout = useRef(null)

  const winIdRef = useRef(null)
  const winIndexRef = useRef(0)
  const startedRef = useRef(false)

  // ✅ ВАЖНО: используем только те drop.id, для которых реально есть анимация
  const validDrops = useMemo(() => {
    if (!caseData?.drops) return []
    return caseData.drops.filter(d => !!darkMatterAnimations[d.id])
  }, [caseData])

  if (!caseData) return <div className="app">Case config missing</div>
  if (!validDrops.length) {
    return (
      <div className="app">
        Нет доступных анимаций для дропов этого кейса (проверь соответствие id в cases.js и animations.js)
      </div>
    )
  }

  const isPreparing = phase === "preparing"
  const isSpinning = phase === "spinning"
  const hasResult = phase === "result"

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
     WEIGHTED RANDOM (ТОЛЬКО validDrops)
  ============================= */
  const pickWeighted = () => {
    const pool = []
    validDrops.forEach((drop) => {
      const w = drop.chance || 10
      for (let i = 0; i < w; i++) pool.push(drop.id)
    })
    return pool[Math.floor(Math.random() * pool.length)]
  }

  /* =============================
     OPEN CASE
  ============================= */
  const openCase = (e) => {
    if (e) e.preventDefault()

    if (isPreparing || isSpinning) return

    clearTimeout(spinTimeout.current)
    clearTimeout(prepTimeout.current)

    setResult(null)
    setReelItems([])
    startedRef.current = false

    const winId = pickWeighted()
    winIdRef.current = winId

    // ✅ “реальная” загрузка: PNG на месте, а вместо кнопки пишем "Загрузка..."
    setPhase("preparing")

    // небольшая пауза (как в тех миниаппах), чтобы ощущалось “генерируется”
    prepTimeout.current = setTimeout(() => {
      setPhase("spinning")
    }, 350)
  }

  /* =============================
     BUILD REEL (ДЛИННАЯ ЛЕНТА + БУФЕРЫ)
  ============================= */
  useLayoutEffect(() => {
    if (!isSpinning) return
    if (!rouletteWrapRef.current) return
    if (startedRef.current) return

    const wrap = rouletteWrapRef.current
    const containerWidth = wrap.offsetWidth || 320

    const itemW = 140
    const gap = 20
    const full = itemW + gap

    // сколько реально видно карточек
    const visibleCount = Math.ceil(containerWidth / full) + 4

    // ✅ огромные буферы, чтобы “никогда не заканчивалось”
    const prefix = visibleCount + 40      // слева
    const travel = 120                    // сколько “пролетит” до победы
    const winIndex = prefix + travel
    const tail = visibleCount + 80        // справа
    const total = winIndex + tail

    winIndexRef.current = winIndex

    const items = new Array(total).fill(null).map(() => {
      const r = validDrops[Math.floor(Math.random() * validDrops.length)].id
      return r
    })

    // победа в нужной позиции
    items[winIndex] = winIdRef.current

    setReelItems(items)
    startedRef.current = true
  }, [isSpinning, validDrops])

  /* =============================
     START ANIMATION AFTER RENDER
  ============================= */
  useLayoutEffect(() => {
    if (!isSpinning) return
    if (!reelRef.current) return
    if (!rouletteWrapRef.current) return
    if (!reelItems.length) return

    const reel = reelRef.current
    const wrap = rouletteWrapRef.current

    const containerWidth = wrap.offsetWidth || 320
    const itemW = 140
    const gap = 20
    const full = itemW + gap

    const winIndex = winIndexRef.current

    // ✅ стартуем НЕ с нуля, а из “середины” (чтобы слева точно были элементы)
    const startIndex = Math.max(0, winIndex - 140)
    const startX = startIndex * full

    // цель: поставить winIndex в центр линии
    const targetX =
      winIndex * full -
      containerWidth / 2 +
      itemW / 2

    // reset
    reel.style.transition = "none"
    reel.style.transform = `translateX(-${startX}px)`
    void reel.offsetHeight

    // ✅ двойной rAF — стабильнее на iOS/Safari
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        reel.style.transition =
          "transform 4.2s cubic-bezier(0.12, 0.75, 0.15, 1)"
        reel.style.transform = `translateX(-${targetX}px)`
      })
    })

    clearTimeout(spinTimeout.current)
    spinTimeout.current = setTimeout(() => {
      setPhase("result")
      setResult(winIdRef.current)
    }, 4300)
  }, [isSpinning, reelItems])

  /* =============================
     CLEANUP
  ============================= */
  useEffect(() => {
    return () => {
      clearTimeout(spinTimeout.current)
      clearTimeout(prepTimeout.current)
    }
  }, [])

  /* =============================
     RESET
  ============================= */
  const sellItem = (e) => {
    if (e) e.preventDefault()
    clearTimeout(spinTimeout.current)
    clearTimeout(prepTimeout.current)

    setResult(null)
    setReelItems([])
    startedRef.current = false
    setPhase("idle")
  }

  const openAgain = (e) => {
    if (e) e.preventDefault()
    sellItem()
    openCase()
  }

  const blurred = hasResult

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
            {/* PNG остаётся во время preparing */}
            <img
              src={caseData.image}
              className={`casepage-case-image ${isSpinning ? "hidden-case" : ""}`}
              alt={caseData.name}
            />

            {isSpinning && (
              <div className="roulette-absolute" ref={rouletteWrapRef}>
                <div className="roulette-line" />

                <div ref={reelRef} className="roulette-reel">
                  {reelItems.map((dropId, index) => {
                    const anim = darkMatterAnimations[dropId]
                    // ✅ защита: если вдруг undefined — рендерим пустую карточку, НЕ крашимся
                    return (
                      <div key={index} className="roulette-item">
                        {anim ? (
                          <Lottie
                            animationData={anim}
                            autoplay={false}
                            loop={false}
                            style={{ width: 80, height: 80 }}
                          />
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {phase === "idle" && (
            <button
              type="button"
              className="casepage-open-btn"
              onClick={openCase}
            >
              Открыть кейс
            </button>
          )}

          {phase === "preparing" && (
            <button
              type="button"
              className="casepage-open-btn loading"
              disabled
            >
              Загрузка…
            </button>
          )}
        </div>

        <div className="casepage-drops">
          {caseData.drops.map((drop) => {
            const isActive = activeDrop === drop.id
            const anim = darkMatterAnimations[drop.id]

            return (
              <div
                key={drop.id}
                className="drop-card"
                onClick={() => handleClick(drop.id)}
              >
                {anim ? (
                  <Lottie
                    key={isActive ? drop.id + "-active" : drop.id}
                    animationData={anim}
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

      {hasResult && result && (
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
