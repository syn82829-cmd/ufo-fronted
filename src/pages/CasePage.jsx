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

  // рулетка состояния
  const [isOpening, setIsOpening] = useState(false)
  const [isRolling, setIsRolling] = useState(false)
  const [winner, setWinner] = useState(null)

  const trackRef = useRef(null)

  if (!caseData) {
    return <div className="app">Case config missing</div>
  }

  // генерация длинной рулетки
  const generateTrack = () => {

    const items = []

    for (let i = 0; i < 40; i++) {

      const random =
        caseData.drops[
          Math.floor(Math.random() * caseData.drops.length)
        ]

      items.push(random)

    }

    // победитель заранее
    const win =
      caseData.drops[
        Math.floor(Math.random() * caseData.drops.length)
      ]

    items.push(win)

    setWinner(win)

    return items

  }

  const [trackItems, setTrackItems] = useState([])

  const openCase = () => {

    const track = generateTrack()

    setTrackItems(track)

    setIsOpening(true)

    setTimeout(() => {

      setIsRolling(true)

      const trackEl = trackRef.current

      const itemWidth = 140
      const centerOffset = (track.length - 1) * itemWidth

      trackEl.style.transition =
        "transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)"

      trackEl.style.transform =
        `translateX(-${centerOffset}px)`

      setTimeout(() => {

        setIsRolling(false)

      }, 4000)

    }, 100)

  }

  const handleClick = (dropId) => {

    if (activeDrop === dropId) {
      setActiveDrop(null)
      setTimeout(() => setActiveDrop(dropId), 10)
    } else {
      setActiveDrop(dropId)
    }

  }

  const reset = () => {

    setIsOpening(false)
    setIsRolling(false)
    setWinner(null)
    setTrackItems([])

  }

  return (
    <div className="app">

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

        {/* кейс */}
        {!isOpening && (
          <>
            <img
              src={caseData.image}
              className="casepage-case-image"
              alt={caseData.name}
            />

            <button
              className="casepage-open-btn"
              onClick={openCase}
            >
              Открыть кейс
            </button>
          </>
        )}

        {/* рулетка */}
        {isOpening && !winner && (
          <div className="roulette-container">

            <div className="roulette-center-line" />

            <div
              className="roulette-track"
              ref={trackRef}
            >

              {trackItems.map((drop, index) => (

                <div
                  className="roulette-item"
                  key={index}
                >

                  <Lottie
                    animationData={
                      darkMatterAnimations[drop.id]
                    }
                    autoplay={false}
                    loop={false}
                    className="drop-lottie"
                  />

                </div>

              ))}

            </div>

          </div>
        )}

        {/* экран выигрыша */}
        {winner && !isRolling && (

          <div className="win-screen">

            <div className="win-title">
              Поздравляем!
            </div>

            <div className="win-card">

              <Lottie
                animationData={
                  darkMatterAnimations[winner.id]
                }
                autoplay
                loop={false}
                className="drop-lottie"
              />

              <div className="drop-name">
                {winner.name || winner.id}
              </div>

            </div>

            <div className="win-buttons">

              <button className="sell-btn">
                Продать
              </button>

              <button
                className="open-again-btn"
                onClick={reset}
              >
                Открыть ещё
              </button>

            </div>

          </div>

        )}

      </div>

      {/* drops grid */}
      {!isOpening && (
        <div className="casepage-drops">

          {caseData.drops.map((drop) => {

            const isActive =
              activeDrop === drop.id

            return (

              <div
                key={drop.id}
                className="drop-card"
                onClick={() =>
                  handleClick(drop.id)
                }
              >

                <Lottie
                  key={
                    isActive
                      ? `${drop.id}-active`
                      : `${drop.id}-idle`
                  }
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
      )}

    </div>
  )

}

export default CasePage
