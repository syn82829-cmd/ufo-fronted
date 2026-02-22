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
  const [isPreparing, setIsPreparing] = useState(false) // <- “пауза/загрузка”

  const reelRef = useRef(null)
  const rouletteWrapRef = useRef(null)

  const spinTimeout = useRef(null)
  const prepTimeout = useRef(null)

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
     RESET INTERNAL (без дерганий)
  ============================= */
  const hardResetSpinState = () => {
    clearTimeout(spinTimeout.current)
    clearTimeout(prepTimeout.current)
    startedRef.current = false
    setIsPreparing(false)
    setIsSpinning(false)
    setReelItems([])
    winIdRef.current = null
    winIndexRef.current = 0

    const reel = reelRef.current
    if (reel) {
      reel.style.transition = "none"
      reel.style.transform = "translateX(0px)"
    }
  }

  /* =============================
     OPEN CASE
  ============================= */
  const openCase = (e) => {
    if (e) e.preventDefault()
    if (isSpinning || isPreparing) return

    // сброс результата
    setResult(null)

    // сброс старой прокрутки
    hardResetSpinState()

    // выбираем победу
    const winId = pickWeighted()
    winIdRef.current = winId

    // имитируем “предзагрузку” как у нормальных миниаппов
    setIsPreparing(true)

    prepTimeout.current = setTimeout(() => {
      setIsPreparing(false)
      setIsSpinning(true)
      setReelItems([]) // сначала пусто, потом соберем
    }, 220) // <- пауза 220мс (можешь сделать 300-400, если хочешь)
  }

  /* =============================
     BUILD REEL (делаем реально длинной)
  ============================= */
  useLayoutEffect(() => {
    if (!isSpinning) return
    if (!rouletteWrapRef.current) return
    if (startedRef.current) return

    const wrap = rouletteWrapRef.current
    const containerWidth = wrap.offsetWidth || 320

    // размеры как в CSS: 140 + gap 20
    const itemW = 140
    const gap = 20
    const full = itemW + gap

    const visible = Math.ceil(containerWidth / full) + 4

    // вот тут “секрет”: мы делаем длинный префикс и очень жирный хвост
    // чтобы никогда не увидеть конец на разгонах/ослаблениях
    const prefix = visible + 30
    const winIndex = prefix + 90
    const tail = visible + 120
    const total = winIndex + tail

    winIndexRef.current = winIndex

    const items = new Array(total).fill(null).map(() => {
      return caseData.drops[Math.floor(Math.random() * caseData.drops.length)].id
    })

    items[winIndex] = winIdRef.current

    setReelItems(items)
    startedRef.current = true
  }, [isSpinning, caseData.drops])

  /* =============================
     START ANIMATION (после реального рендера)
  ============================= */
  useLayoutEffect(() => {
    if (!isSpinning) return
    if (!reelItems.length) return
    if (!reelRef.current || !rouletteWrapRef.current) return

    const reel = reelRef.current
    const wrap = rouletteWrapRef.current

    const itemW = 140
    const gap = 20
    const full = itemW + gap

    // СТАРТ НЕ С НУЛЯ:
    // Мы стартуем “чуть правее”, чтобы сразу были элементы слева/справа.
    // Иначе визуально кажется, что они “заканчиваются”.
    const startIndex = Math.max(0, winIndexRef.current - 70)

    const containerWidth = wrap.offsetWidth || 320
    const startOffset =
      startIndex * full -
      containerWidth / 2 +
      itemW / 2

    const winOffset =
      winIndexRef.current * full -
      containerWidth / 2 +
      itemW / 2

    // ставим стартовую позицию без анимации
    reel.style.transition = "none"
    reel.style.transform = `translateX(-${startOffset}px)`
    void reel.offsetHeight

    // маленькая задержка, чтобы браузер/мобила точно “поймали” старт
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        reel.style.transition =
          "transform 4.2s cubic-bezier(0.12, 0.75, 0.15, 1)"
        reel.style.transform = `translateX(-${winOffset}px)`
      })
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
      clearTimeout(prepTimeout.current)
    }
  }, [])

  /* =============================
     RESET
  ============================= */
  const sellItem = (e) => {
    if (e) e.preventDefault()
    hardResetSpinState()
    setResult(null)
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
              className={`casepage-case-image ${
                isSpinning || isPreparing ? "hidden-case" : ""
              }`}
              alt={caseData.name}
            />

            {(isSpinning || isPreparing) && (
              <div className="roulette-absolute" ref={rouletteWrapRef}>
                <div className="roulette-line" />

                {isPreparing ? (
                  <div className="roulette-loading">Загрузка…</div>
                ) : (
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
                )}
              </div>
            )}
          </div>

          {!isSpinning && !isPreparing && !result && (
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
