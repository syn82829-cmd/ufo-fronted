import { useParams, useNavigate } from "react-router-dom"
import { useState } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

function CasePage() {

  const { id } = useParams()
  const navigate = useNavigate()

  const caseData = cases[id]

  // какой дроп сейчас проигрывается
  const [activeDrop, setActiveDrop] = useState(null)

  // ключ для принудительного пересоздания Lottie
  const [animationKey, setAnimationKey] = useState(0)

  if (!caseData) {
    return <div className="app">Case config missing</div>
  }

  const handleClick = (dropId) => {

    setActiveDrop(dropId)

    // увеличиваем key → Lottie пересоздаётся → autoplay срабатывает
    setAnimationKey(prev => prev + 1)

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

        <img
          src={`/cases/${id}.png`}
          className="casepage-case-image"
          alt={caseData.name}
        />

        <button className="casepage-open-btn">
          Открыть кейс
        </button>

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

              {isActive ? (

                <Lottie
                  key={animationKey}
                  animationData={darkMatterAnimations[drop.id]}
                  autoplay={true}
                  loop={false}
                  className="drop-lottie"
                />

              ) : (

                <img
                  src={`/drops/${drop.id}.png`}
                  className="drop-lottie"
                  alt={drop.id}
                />

              )}

              <div className="drop-name">
                {drop.id}
              </div>

            </div>
          )

        })}

      </div>

    </div>
  )
}

export default CasePage
