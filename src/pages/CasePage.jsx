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

  if (!caseData) {
    return <div className="app">Case config missing</div>
  }

  /* =============================
     PLAY DROP ANIMATION
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
     OPEN CASE
  ============================= */

  const openCase = () => {

    if (isSpinning) return

    setResult(null)
    setIsSpinning(true)

    // weighted random
    const pool = []
    caseData.drops.forEach(drop => {
      const weight = drop.chance || 10
      for (let i = 0; i < weight; i++) {
        pool.push(drop.id)
      }
    })

    const winId =
      pool[Math.floor(Math.random() * pool.length)]

    const totalItems = 60
    const winIndex = 45

    const items = []

    for (let i = 0; i < totalItems; i++) {
      if (i === winIndex) {
        items.push(winId)
      } else {
        const random =
          caseData.drops[
            Math.floor(Math.random() * caseData.drops.length)
          ].id
        items.push(random)
      }
    }

    setReelItems(items)

    // ждём рендер
    setTimeout(() => {

      const reel = reelRef.current
      if (!reel) return

      const itemWidth = 160 // 140 + 20 gap
      const containerWidth = reel.parentElement.offsetWidth

      const offset =
        winIndex * itemWidth -
        containerWidth / 2 +
        itemWidth / 2

      reel.style.transition = "none"
      reel.style.transform = "translateX(0px)"

      requestAnimationFrame(() => {
        reel.style.transition =
          "transform 4.2s cubic-bezier(0.12, 0.75, 0.15, 1)"
        reel.style.transform =
          `translateX(-${offset}px)`
      })

    }, 50)

    setTimeout(() => {
      setIsSpinning(false)
      setResult(winId)
    }, 4300)
  }

  /* =============================
     RESET
  ============================= */

  const sellItem = () => {
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

            <div className="casepage-title">
              {caseData.name}
            </div>

            <button className="casepage-header-btn casepage-settings-btn">
              ⚙
            </button>

          </div>

          {/* 🔥 PNG заменяется рулеткой */}

          {!isSpinning && (
            <img
              src={caseData.image}
              className="casepage-case-image"
              alt={caseData.name}
            />
          )}

          {isSpinning && (
            <div className="roulette-window">

              <div className="roulette-line" />

              <div
                ref={reelRef}
                className="roulette-reel"
              >

                {reelItems.map((dropId, index) => (
                  <div
                    key={index}
                    className="roulette-item"
                  >
                    <Lottie
                      animationData={
                        darkMatterAnimations[dropId]
                      }
                      autoplay={false}
                      loop={false}
                      style={{ width: 80, height: 80 }}
                    />
                  </div>
                ))}

              </div>

            </div>
          )}

          {!isSpinning && !result && (
            <button
              className="casepage-open-btn"
              onClick={openCase}
            >
              Открыть кейс
            </button>
          )}

        </div>

        {/* DROPS GRID */}

        <div className="casepage-drops">

          {caseData.drops.map(drop => {

            const isActive = activeDrop === drop.id

            return (
              <div
                key={drop.id}
                className="drop-card"
                onClick={() => handleClick(drop.id)}
              >

                <Lottie
                  key={isActive ? drop.id + "-active" : drop.id}
                  animationData={
                    darkMatterAnimations[drop.id]
                  }
                  autoplay={isActive}
                  loop={false}
                  className="drop-lottie"
                />

                <div className="drop-name">
                  {drop.name || drop.id}
                </div>

              </div>
            )

          })}

        </div>

      </div>

      {/* RESULT */}

      {result && (
        <div className="result-overlay">

          <div className="result-card">

            <div className="result-title">
              Поздравляем!
            </div>

            <div className="drop-card result-size">

              <Lottie
                animationData={
                  darkMatterAnimations[result]
                }
                autoplay
                loop={false}
              />

              <div className="drop-name">
                {result}
              </div>

            </div>

            <div className="result-buttons">

              <button
                className="glass-btn sell"
                onClick={sellItem}
              >
                Продать
              </button>

              <button
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
