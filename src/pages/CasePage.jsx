import { useLocation, useNavigate } from "react-router-dom"

function CasePage() {

  const location = useLocation()
  const navigate = useNavigate()

  const caseData = location.state

  const drops = [
    { id: 1, name: "Common Star", image: "/drops/drop1.png" },
    { id: 2, name: "Blue Plasma", image: "/drops/drop2.png" },
    { id: 3, name: "Alien Core", image: "/drops/drop3.png" },
    { id: 4, name: "Dark Energy", image: "/drops/drop4.png" }
  ]

  if (!caseData) {
    return <div className="app">Case not found</div>
  }

  return (
    <div className="app">


      {/* HEADER */}
      <div className="casepage-header">

        {/* BACK BUTTON */}
        <button
          className="casepage-back-btn"
          onClick={() => navigate(-1)}
        >
          ←
        </button>


        {/* SETTINGS BUTTON */}
        <button
          className="casepage-settings-btn"
        >
          ⚙️
        </button>


        {/* CENTER CONTENT */}
        <div className="casepage-center">

          <div className="casepage-title">
            {caseData.name}
          </div>

          <img
            src={caseData.image}
            className="casepage-case-image"
            alt={caseData.name}
          />

          <button className="casepage-open-btn">
            Открыть кейс — {caseData.price} ⭐️
          </button>

        </div>

      </div>



      {/* DROPS */}
      <div className="casepage-drops">

        {drops.map(drop => (
          <div key={drop.id} className="drop-card">

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


    </div>
  )
}

export default CasePage
