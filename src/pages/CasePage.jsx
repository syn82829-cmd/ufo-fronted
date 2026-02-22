import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef } from "react"
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
  const spinTimeout = useRef(null)

  if (!caseData) return <div className="app">Case config missing</div>

  const handleClick = (dropId) => {
    if (activeDrop === dropId) {
      setActiveDrop(null)
      setTimeout(() => setActiveDrop(dropId), 10)
    } else {
      setActiveDrop(dropId)
    }
  }

  const openCase = () => {
    if (isSpinning) return

    clearTimeout(spinTimeout.current)
    setResult(null)
    setIsSpinning(true)

    // weighted random
    const pool = []
    caseData.drops.forEach((drop) => {
      const weight = drop.chance || 10
      for (let i = 0; i < weight; i++) pool.push(drop.id)
    })
    const winId = pool[Math.floor(Math.random() * pool.length)]

    // === ДЕЛАЕМ "БЕСКОНЕЧНУЮ" ЛЕНТУ (3 копии) ===
    const baseLength = 40          // базовый набор (можно 30–60)
    const winIndexInBase = 25      // где в базе лежит победа

    const base = Array.from({ length: baseLength }, () => {
      return caseData.drops[Math.floor(Math.random() * caseData.drops.length)].id
    })
    base[winIndexInBase] = winId

    // лента = base * 3
    const items = [...base, ...base, ...base]

    // целевой индекс победы в СРЕДНЕЙ копии
    const winIndex = baseLength + winIndexInBase

    setReelItems(items)

    // ждать рендер DOM
    setTimeout(() => {
      const reel = reelRef.current
      if (!reel) return

      const wrap = reel.parentElement
      if (!wrap) return

      // ✅ меряем реальный шаг слота (width + gap) через DOM
      const first = reel.querySelector(".roulette-item")
      let step = 160
      if (first) {
        const rect = first.getBoundingClientRect()
        // gap берём из computedStyle, чтобы не гадать
        const cs = window.getComputedStyle(reel)
        const gap = parseFloat(cs.columnGap || cs.gap || "0") || 0
        step = rect.width + gap
      }

      const containerWidth = wrap.offsetWidth || 320

      // стартуем со второй копии (чтобы не было ощущения конца)
      const startOffset = baseLength * step

      // куда доехать (центрируем winIndex)
      const targetOffset =
        winIndex * step -
        containerWidth / 2 +
        step / 2

      reel.style.transition = "none"
      reel.style.transform = `translateX(-${startOffset}px)`
      // force reflow
      void reel.offsetHeight

      requestAnimationFrame(() => {
        reel.style.transition = "transform 4.2s cubic-bezier(0.12, 0.75, 0.15, 1)"
        reel.style.transform = `translateX(-${targetOffset}px)`
      })

    }, 80)

    spinTimeout.current = setTimeout(() => {
      setIsSpinning(false)
      setResult(winId)
    }, 4400)
  }

  const sellItem = () => {
    clearTimeout(spinTimeout.current)
    setResult(null)
    setIsSpinning(false)
  }

  const openAgain = () => {
    setResult(null)
    openCase()
  }

  const blurred = result != null

  return (
    <div className="app">
      <div className={blurred ? "blurred" : ""}>
        <div className="casepage-header">
          <div className="casepage-title-row">
            <button
              className="casepage-header-btn casepage-back-btn"
              onClick={() => navigate(-1)}
            >
              ←
            </button>

            <div className="casepage-title">{caseData.name}</div>

            <button className="casepage-header-btn casepage-settings-btn">
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
              <div className="roulette-absolute">
                <div className="roulette-line" />

                <div ref={reelRef} className="roulette-reel">
                  {reelItems.map((dropId, index) => (
                    <div key={index} className="roulette-item">
                      <Lottie
                        animationData={darkMatterAnimations[dropId]}
                        autoplay={false}     // статично
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
            <button className="casepage-open-btn" onClick={openCase}>
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
                  autoplay={isActive}  // в гриде анимация ТОЛЬКО по клику
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
                autoplay   // приз анимируется
                loop={false}
              />
              <div className="drop-name">{result}</div>
            </div>

            <div className="result-buttons">
              <button className="glass-btn sell" onClick={sellItem}>
                Продать
              </button>

              <button className="glass-btn open" onClick={openAgain}>
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
