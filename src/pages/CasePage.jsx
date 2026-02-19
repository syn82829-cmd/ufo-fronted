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

    const winId = pool[Math.floor(Math.random() * pool.length)]

    // создаём массив рулетки
    const reelItems = []
    const totalItems = 60
    const winIndex = 45

    for (let i = 0; i < totalItems; i++) {
      if (i === winIndex) {
        reelItems.push(winId)
      } else {
        const randomDrop =
          caseData.drops[
            Math.floor(Math.random() * caseData.drops.length)
          ].id
        reelItems.push(randomDrop)
      }
    }

    const reel = reelRef.current
    reel.innerHTML = ""

    reelItems.forEach((dropId) => {
      const item = document.createElement("div")
      item.className = "roulette-item"

      const img = document.createElement("img")
      img.src = `/cases/${id}.png` // временно статичный плейсхолдер
      img.className = "roulette-static"

      item.appendChild(img)
      reel.appendChild(item)
    })

    const itemWidth = 140
    const offset = winIndex * itemWidth - 200

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
      setResult(winId)
    }, 4200)

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

      {/* ROULETTE */}
      {isSpinning && (
        <div className="roulette-overlay">
          <div className="roulette-window">

            <div className="roulette-line" />

            <div
              ref={reelRef}
              className="roulette-reel"
            />

          </div>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div className="result-overlay">

          <div className="result-card">

            <div className="result-title">
              Поздравляем!
            </div>

            <div className="drop-card result-size">

              <Lottie
                animationData={darkMatterAnimations[result]}
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
