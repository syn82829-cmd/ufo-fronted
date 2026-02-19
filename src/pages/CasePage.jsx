import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

// display names отдельно от filenames
const dropNames = {
  darkhelmet: "Dark Helmet",
  gift: "Mystery Gift",
  westside: "Westside",
  lowrider: "Lowrider",
  watch: "Cosmic Watch",
  skull: "Alien Skull",
  dyson: "Dyson Core",
  batman: "Batman Relic",
  poizon: "Poizon Artifact",
  metla: "Quantum Broom",
  ball: "Gravity Ball",
  book: "Ancient Book"
}

function CasePage() {

  const { id } = useParams()
  const navigate = useNavigate()

  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)

  // храним refs правильно
  const lottieRefs = useRef({})

  if (!caseData) {
    return <div className="app">Case config missing</div>
  }

  const handleClick = (dropId) => {

    setActiveDrop(dropId)

    const instance = lottieRefs.current[dropId]

    if (instance) {

      instance.stop()

      // forcing restart
      setTimeout(() => {
        instance.play()
      }, 10)

    }

  }

  return (
    <div className="app">

      {/* HEADER */}
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

      {/* DROPS */}
      <div className="casepage-drops">

        {caseData.drops.map((drop) => (

          <div
            key={drop.id}
            className={`drop-card ${
              activeDrop === drop.id ? "active" : ""
            }`}
            onClick={() => handleClick(drop.id)}
          >

            <Lottie
              animationData={darkMatterAnimations[drop.id]}
              autoplay={false}
              loop={false}
              lottieRef={(instance) => {
                if (instance) {
                  lottieRefs.current[drop.id] = instance
                }
              }}
              className="drop-lottie"
            />

            <div className="drop-name">
              {dropNames[drop.id] || drop.id}
            </div>

          </div>

        ))}

      </div>

    </div>
  )
}

export default CasePage
