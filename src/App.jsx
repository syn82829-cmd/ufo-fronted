import './style.css'

function App() {

  const cases = [
    {
      id: 1,
      image: "/cases/case1.png.PNG",
      name: "First Pepe",
      price: "9999 ⭐️"
    },
    {
      id: 2,
      image: "/cases/case2.png.PNG",
      name: "Purple Hole",
      price: "4999 ⭐️"
    },
    {
      id: 3,
      image: "/cases/case3.png.PNG",
      name: "Crash",
      price: "2999 ⭐️"
    },
    {
      id: 4,
      image: "/cases/case4.png.PNG",
      name: "Random",
      price: "999 ⭐️"
    }
  ]

  return (
    <div className="app">

      {/* UFO CRASH PANEL */}
      <div className="crash-panel">

        <div className="crash-title">
          UFO Crash
        </div>

        <div className="multiplier">
          &gt; x1.63
        </div>

        <button className="launch-btn">
          Запустить НЛО
        </button>

        <img
          src="/ufo.png.PNG"
          className="ufo-image"
          alt=""
        />

      </div>


      {/* CASES SECTION */}
      <div className="cases-section">

        {cases.map(caseItem => (
          <div className="case-card" key={caseItem.id}>

            {/* TITLE */}
            {caseItem.name && (
              <div className="case-title">
                {caseItem.name}
              </div>
            )}

            {/* IMAGE */}
            <img
              src={caseItem.image}
              className="case-image"
              alt=""
            />

            {/* PRICE */}
            {caseItem.price && (
              <div className="case-price-badge">
                {caseItem.price}
              </div>
            )}

          </div>
        ))}

      </div>

    </div>
  )
}

export default App
