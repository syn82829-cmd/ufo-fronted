import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
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
  const [spinData, setSpinData] = useState(null)

  const reelRef = useRef(null)

  if (!caseData) {
    return <div className="app">Case config missing</div>
  }

  /* =============================
     DROP CLICK
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

    const pool = []
    caseData.drops.forEach(drop => {
      const weight = drop.chance || 10
      for (let i = 0; i < weight; i++) {
        pool.push(drop.id)
      }
    })

    const winId =
      pool[Math.floor(Math.random() * pool.length)]

    const totalItems = 140
    const winIndex = 110

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
    setSpinData({ winId, winIndex })
    setIsSpinning(true)
  }

  /* =============================
     SPIN EFFECT (СТАБИЛЬНЫЙ)
  ============================= */

  useEffect(() => {

    if (!isSpinning) return
    if (!reelRef.current) return
    if (!spinData) return
    if (reelItems.length === 0) return

    const reel = reelRef.current

    const firstItem = reel.children[0]
    if (!firstItem) return

    const itemWidth = firstItem.offsetWidth
    const gap = 20
    const fullItemWidth = itemWidth + gap
    const containerWidth = reel.parentElement.offsetWidth

    const offset =
      spinData.winIndex * fullItemWidth -
      containerWidth / 2 +
      itemWidth / 2

    reel.style.transition = "none"
    reel.style.transform = "translateX(0px)"

    void reel.offsetWidth

    reel.style.transition =
      "transform 4.5s cubic-bezier(0.08, 0.85, 0.18, 1)"

    reel.style.transform =
      `translateX(-${offset}px)`

    const timer = setTimeout(() => {
      setIsSpinning(false)
      setResult(spinData.winId)
      setSpinData(null)
    }, 4500)

    return () => clearTimeout(timer)

  }, [isSpinning, reelItems, spinData])

  /* =============================
     RESET
  ============================= */

  const sellItem = () => {
    setResult(null)
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
              type="button"
              className="casepage-header-btn casepage-back-btn"
              onClick={() => navigate(-1)}
            >
              ←
            </button>

            <div className="casepage-title">
              {caseData.name}
            </div>

            <button
              type="button"
              className="casepage-header-btn casepage-settings-btn"
            >
              ⚙
            </button>

          </div>

          <div className="case-image-wrapper">

            {!isSpinning && (
              <img
                src={caseData.image}
                className="casepage-case-image"
                alt={caseData.name}
              />
            )}

            {isSpinning && (
              <div className="roulette-absolute">

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
