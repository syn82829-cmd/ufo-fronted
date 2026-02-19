import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

const ITEM_WIDTH = 160 // 140 + 20 gap
const SPIN_DURATION = 4200

function CasePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [reelItems, setReelItems] = useState([])

  const reelRef = useRef(null)

  if (!caseData) {
    return <div className="app">Case config missing</div>
  }

  const handleClick = (dropId) => {
    setActiveDrop(dropId === activeDrop ? null : dropId)
  }

  const openCase = () => {
    if (isSpinning) return

    setIsSpinning(true)
    setResult(null)

    // weighted random
    const pool = []
    caseData.drops.forEach(d => {
      const w = d.chance || 10
      for (let i = 0; i < w; i++) pool.push(d.id)
    })

    const winId = pool[Math.floor(Math.random() * pool.length)]

    const before = 100
    const after = 100
    const winIndex = before

    const items = []

    for (let i = 0; i < before + 1 + after; i++) {
      if (i === winIndex) {
        items.push(winId)
      } else {
        items.push(
          caseData.drops[
            Math.floor(Math.random() * caseData.drops.length)
          ].id
        )
      }
    }

    setReelItems(items)

    requestAnimationFrame(() => {
      const reel = reelRef.current
      if (!reel) return

      const containerWidth = reel.parentElement.offsetWidth
      const offset =
        winIndex * ITEM_WIDTH -
        containerWidth / 2 +
        ITEM_WIDTH / 2

      reel.style.transition = "none"
      reel.style.transform = "translateX(0px)"

      void reel.offsetHeight

      reel.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(0.08, 0.85, 0.18, 1)`
      reel.style.transform = `translateX(-${offset}px)`
    })

    setTimeout(() => {
      setIsSpinning(false)
      setResult(winId)
    }, SPIN_DURATION)
  }

  return (
    <div className="app">
      <div className={result ? "blurred" : ""}>
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
              <div className="roulette-absolute">
                <div className="roulette-line" />
                <div ref={reelRef} className="roulette-reel">
                  {reelItems.map((id, i) => (
                    <div key={i} className="roulette-item">
                      <Lottie
                        animationData={darkMatterAnimations[id]}
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
              <button type="button" className="glass-btn sell">
                Продать
              </button>
              <button
                type="button"
                className="glass-btn open"
                onClick={openCase}
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
