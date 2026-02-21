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
    setResult(null)
    startedRef.current = false

    winIdRef.current = pickWeighted()

    setIsSpinning(true)
    setReelItems([])
  }

  /* =============================
     BUILD REEL (гарантируем что лента длиннее offset)
  ============================= */
  useLayoutEffect(() => {
    if (!isSpinning) return
    if (!rouletteWrapRef.current) return
    if (startedRef.current) return

    const wrap = rouletteWrapRef.current
    const containerWidth = wrap.offsetWidth || 320

    // размеры должны совпадать с CSS
    const itemW = 140
    const gap = 20
    const full = itemW + gap

    // сколько карточек помещается в окне + запас
    const visibleCount = Math.ceil(containerWidth / full) + 4

    // делаем победу "глубоко", чтобы прокрутка была длиннее
    const prefixItems = visibleCount + 40
    const winIndex = prefixItems + 90
    winIndexRef.current = winIndex

    // сколько пикселей мы в итоге проедем
    const offset =
      winIndex * full -
      containerWidth / 2 +
      itemW / 2

    // 🔥 ВОТ ГЛАВНЫЙ ФИКС:
    // гарантируем, что общая ширина ленты > offset + containerWidth + большой запас справа
    const extraRightPx = Math.max(2000, containerWidth * 6) // жирный буфер (чтобы НИКОГДА не пустело)
    const needPx = offset + containerWidth + extraRightPx
    const minTotal = Math.ceil(needPx / full) + 1

    const total = Math.max(minTotal, winIndex + visibleCount + 120)

    const items = new Array(total).fill(null).map(() => {
      return caseData.drops[
        Math.floor(Math.random() * caseData.drops.length)
      ].id
    })

    items[winIndex] = winIdRef.current

    setReelItems(items)
    startedRef.current = true
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

    const winIndex = winIndexRef.current

    const offset =
      winIndex * full -
      containerWidth / 2 +
      itemW / 2

    reel.style.transition = "none"
    reel.style.transform = "translateX(0px)"
    void reel.offsetHeight

    requestAnimationFrame(() => {
      reel.style.transition =
        "transform 4.2s cubic-bezier(0.12, 0.75, 0.15, 1)"
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
    return () => clearTimeout(spinTimeout.current)
  }, [])

  /* =============================
     RESET
  ============================= */
  const sellItem = (e) => {
    if (e) e.preventDefault()
    clearTimeout(spinTimeout.current)
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
