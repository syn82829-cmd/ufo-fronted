import { useLocation, useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

function CasePage() {

  const location = useLocation()
  const navigate = useNavigate()

  const caseState = location.state

  if (!caseState) {
    return <div className="app">Case not found</div>
  }

  const caseData = cases[caseState.id]

  if (!caseData) {
    return <div className="app">Case config missing</div>
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

          <button
            className="casepage-header-btn casepage-settings-btn"
          >
            ⚙
          </button>

        </div>

        <img
          src={caseState.image}
          className="casepage-case-image"
          alt={caseData.name}
        />

        <button className="casepage-open-btn">
          Открыть кейс — {caseState.price} ⭐️
        </button>

      </div>

      {/* DROPS */}
      <div className="casepage-drops">

        {caseData.drops.map((drop) => (
          <div key={drop.id} className="drop-card">

            <Lottie
              animationData={darkMatterAnimations[drop.id]}
              loop
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
