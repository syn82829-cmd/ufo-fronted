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

  const lottieRefs = useRef({})

  if (!caseData) {
    return <div className="app">Case config missing</div>
  }

  const handleClick = (dropId) => {

    // если нажали на уже активный — просто перезапускаем
    if (activeDrop === dropId) {
      lottieRefs.current[dropId]?.goToAndPlay(0, true)
      return
    }

    // останавливаем все
    Object.values(lottieRefs.current).forEach(anim => {
      anim?.stop()
    })

    // активируем новый
    setActiveDrop(dropId)

    // запускаем
    setTimeout(() => {
      lottieRefs.current[dropId]?.goToAndPlay(0, true)
    }, 0)
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

        {caseData.drops.map((drop) => (
          <div
            key={drop.id}
            className="drop-card"
            onClick={() => handleClick(drop.id)}
          >

            <Lottie
              lottieRef={(el) => (lottieRefs.current[drop.id] = el)}
              animationData={darkMatterAnimations[drop.id]}
              loop={false}
              autoplay={false}
              className="drop-lottie"
            />

            <div className="drop-name">
              {drop.id}
            </div>

          </div>
        ))}

      </div>

    </div>
  )
}

export default CasePage
