import { useParams, useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

function CasePage() {

  const { id } = useParams()
  const navigate = useNavigate()

  const caseData = cases[id]

  if (!caseData) {
    return <div className="app">Case config missing</div>
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
