import { useLocation, useNavigate } from "react-router-dom"
import "../style.css"

function CasePage() {

  const location = useLocation()
  const navigate = useNavigate()

  const caseData = location.state

  /* ============================= */
  /* TEMP DROPS (потом из базы) */
  /* ============================= */

  const drops = [
    { id: 1, name: "Common Star", image: "/drops/drop1.png" },
    { id: 2, name: "Blue Plasma", image: "/drops/drop2.png" },
    { id: 3, name: "Alien Core", image: "/drops/drop3.png" },
    { id: 4, name: "Dark Energy", image: "/drops/drop4.png" }
  ]

  /* ============================= */
  /* FALLBACK */
  /* ============================= */

  if (!caseData) {

    return (
      <div className="app">

        <div className="empty-page">

          <div className="empty-glass">
            Case not found
          </div>

        </div>

      </div>
    )

  }

  /* ============================= */
  /* UI */
  /* ============================= */

  return (

    <div className="app">

      {/* HEADER */}

      <div className="casepage-header">

        <button
          className="casepage-back-btn"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <img
          src={caseData.image}
          className="casepage-case-image"
          alt={caseData.name}
        />

      </div>


      {/* DROPS */}

      <div className="casepage-drops">

        {drops.map(drop => (

          <div
            key={drop.id}
            className="drop-card"
          >

            <img
              src={drop.image}
              className="drop-image"
              alt={drop.name}
            />

            <div className="drop-name">
              {drop.name}
            </div>

          </div>

        ))}

      </div>


      {/* OPEN BUTTON (на будущее) */}

      <div className="casepage-open-wrapper">

        <button className="casepage-open-btn">

          Открыть кейс

        </button>

      </div>


    </div>

  )

}

export default CasePage
