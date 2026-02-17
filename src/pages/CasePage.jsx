import { useLocation } from "react-router-dom"

function CasePage() {

  const location = useLocation()
  const caseData = location.state

  // Фейковый дроп пока (потом подключим к базе)
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

      {/* CASE IMAGE */}
      <div className="casepage-top">
        <img
          src={caseData.image}
          className="casepage-case-image"
          alt={caseData.name}
        />
      </div>

      {/* DROP LIST */}
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
