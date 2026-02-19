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

  // состояния рулетки
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState(null)

  const reelRef = useRef(null)

  if (!caseData) {
    return <div className="app">Case config missing</div>
  }

  /* =======================================
     PLAY DROP ANIMATION
  ======================================= */

  const handleClick = (dropId) => {

    if (activeDrop === dropId) {
      setActiveDrop(null)
      setTimeout(() => setActiveDrop(dropId), 10)
    } else {
      setActiveDrop(dropId)
    }

  }

  /* =======================================
     OPEN CASE
  ======================================= */

  const openCase = () => {

    if (isSpinning) return

    setIsSpinning(true)
    setResult(null)

    // weighted random
    const pool = []

    caseData.drops.forEach(drop => {
      const weight = drop.chance || 10
      for (let i = 0; i < weight; i++) {
        pool.push(drop.id)
      }
    })

    const winId = pool[Math.floor(Math.random() * pool.length)]
    setResult(winId)

    const reel = reelRef.current

    const itemWidth = 140
    const totalItems = 40

    const winIndex = 30
    const offset = winIndex * itemWidth

    reel.style.transition = "none"
    reel.style.transform = "translateX(0px)"

    setTimeout(() => {

      reel.style.transition =
        "transform 4s cubic-bezier(0.15, 0.8, 0.2, 1)"

      reel.style.transform =
        `translateX(-${offset}px)`

    }, 50)

    setTimeout(() => {

      setIsSpinning(false)

    }, 4200)

  }

  /* =======================================
     RESET CASE
  ======================================= */

  const sellItem = () => {

    setResult(null)
    setIsSpinning(false)

  }

  const openAgain = () => {

    openCase()

  }

  /* =======================================
     UI
  ======================================= */

  const blurred = result != null

  return (
    <div className="app">

      {/* MAIN CONTENT */}
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

          <img
            src={caseData.image}
            className="casepage-case-image"
            alt={caseData.name}
          />

          {!isSpinning && !result && (

            <button
              className="casepage-open-btn"
              onClick={openCase}
            >
              Открыть кейс
            </button>

          )}

        </div>

        {/* DROPS GRID — всегда видна */}
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
                  animationData={darkMatterAnimations[drop.id]}
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

      {/* ROULETTE OVERLAY */}
      {isSpinning && (

        <div className="roulette-overlay">

          <div className="roulette-window">

            <div className="roulette-line" />

            <div
              ref={reelRef}
              className="roulette-reel"
            >

              {[...Array(40)].map((_, i) => {

                const drop =
                  caseData.drops[
                    i % caseData.drops.length
                  ]

                return (

                  <div
                    key={i}
                    className="roulette-item"
                  >

                    <Lottie
                      animationData={
                        darkMatterAnimations[drop.id]
                      }
                      autoplay
                      loop
                    />

                  </div>

                )

              })}

            </div>

          </div>

        </div>

      )}

      {/* RESULT OVERLAY */}
      {result && (

        <div className="result-overlay">

          <div className="result-card">

            <div className="result-title">
              Поздравляем!
            </div>

            <div className="drop-card large">

              <Lottie
                animationData={
                  darkMatterAnimations[result]
                }
                autoplay
                loop
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
