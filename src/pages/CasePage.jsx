import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useLayoutEffect, useEffect } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

function CasePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [reelItems, setReelItems] = useState([])

  const reelRef = useRef(null)
  const rouletteWrapRef = useRef(null)

  const spinTimeout = useRef(null)
  const buildTimeout = useRef(null)

  const winIdRef = useRef(null)
  const winIndexRef = useRef(0)
  const startedRef = useRef(false)

  if (!caseData) return <div className="app">Case config missing</div>

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
     WEIGHTED RANDOM
  ============================= */
  const pickWeighted = () => {
    const pool = []
    caseData.drops.forEach((drop) => {
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
    if (isSpinning) return

    clearTimeout(spinTimeout.current)
    clearTimeout(buildTimeout.current)

    setResult(null)
    setReelItems([])
    startedRef.current = false

    winIdRef.current = pickWeighted()
    setIsSpinning(true)

    // “реальная пауза”, как у рефов: даём DOM смонтироваться
    buildTimeout.current = setTimeout(() => {
      // после небольшой паузы Build произойдёт в useLayoutEffect ниже
      // (мы просто гарантируем что wrap/ref уже существуют)
      startedRef.current = false
      setReelItems([]) // триггер для эффекта
    }, 120)
  }

  /* =============================
     BUILD REEL (3 сегмента, чтобы не кончалось)
  ============================= */
  useLayoutEffect(() => {
    if (!isSpinning) return
    if (!rouletteWrapRef.current) return
    if (startedRef.current) return

    const wrap = rouletteWrapRef.current
    const containerWidth = wrap.offsetWidth || 320

    // ВАЖНО: размеры совпадают с CSS: 140 + gap 20
    const itemW = 140
    const gap = 20
    const full = itemW + gap

    // сколько видно одновременно
    const visibleCount = Math.ceil(containerWidth / full) + 4

    // сегмент — это “кусок” ленты, который мы потом троим
    const segmentLen = Math.max(visibleCount + 40, 80) // минимум 80 чтобы точно не пустело

    // победу ставим в СЕРЕДНЕМ сегменте
    const middleStart = segmentLen
    const winIndex = middleStart + Math.floor(segmentLen * 0.6) // победа “глубоко”
    winIndexRef.current = winIndex

    const segment = new Array(segmentLen).fill(null).map(() => {
      const r = caseData.drops[Math.floor(Math.random() * caseData.drops.length)].id
      return r
    })

    // делаем 3 сегмента
    const items = [...segment, ...segment, ...segment]

    // фиксируем победу в нужной точке
    items[winIndex] = winIdRef.current

    startedRef.current = true
    setReelItems(items)
  }, [isSpinning, caseData.drops])

  /* =============================
     RUN TRANSFORM AFTER REEL RENDERED
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

    // стартуем не с 0, а со “второго сегмента”
    const segmentLen = Math.floor(reelItems.length / 3)
    const startShift = segmentLen * full

    // выставляем начальную позицию (чтобы слева/справа был запас)
    reel.style.transition = "none"
    reel.style.transform = `translateX(-${startShift}px)`
    // force reflow
    void reel.offsetHeight

    const winIndex = winIndexRef.current

    // смещение к победе (учитываем стартовый сдвиг)
    const offset =
      winIndex * full -
      containerWidth / 2 +
      itemW / 2

    requestAnimationFrame(() => {
      reel.style.transition = "transform 4.2s cubic-bezier(0.12, 0.75, 0.15, 1)"
      reel.style.transform = `translateX(-${offset}px)`
    })

    clearTimeout(spinTimeout.current)
    spinTimeout.current = setTimeout(() => {
      setIsSpinning(false)
      setResult(winIdRef.current)
    }, 4300)
  }, [isSpinning, reelItems])

  /* =============================
     CLEANUP
  ============================= */
  useEffect(() => {
    return () => {
      clearTimeout(spinTimeout.current)
      clearTimeout(buildTimeout.current)
    }
  }, [])

  /* =============================
     RESET
  ============================= */
  const sellItem = (e) => {
    if (e) e.preventDefault()
    clearTimeout(spinTimeout.current)
    clearTimeout(buildTimeout.current)
    setResult(null)
    setIsSpinning(false)
    setReelItems([])
  }

  const openAgain = (e) => {
    if (e) e.preventDefault()
    sellItem()
    openCase()
  }

  const blurred = result != null

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
            <img
              src={caseData.image}
              className={`casepage-case-image ${isSpinning ? "hidden-case" : ""}`}
              alt={caseData.name}
            />

            {isSpinning && (
              <div className="roulette-absolute" ref={rouletteWrapRef}>
                <div className="roulette-line" />

                <div ref={reelRef} className="roulette-reel">
                  {reelItems.map((dropId, index) => (
                    <div key={index} className="roulette-item">
                      <Lottie
                        animationData={darkMatterAnimations[dropId]}
                        autoplay={false}
                        loop={false}
                        style={{ width: 80, height: 80 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!isSpinning && !result && (
            <button
              type="button"
              className="casepage-open-btn"
              onClick={openCase}
            >
              Открыть кейс
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
                  key={isActive ? drop.id + "-active" : drop.id}
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
