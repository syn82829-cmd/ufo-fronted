import './style.css'

function App() {

  const cases = [
    {
      id: 1,
      image: "/cases/case1.png"
    },
    {
      id: 2,
      image: "/cases/case2.png"
    },
    {
      id: 3,
      image: "/cases/case3.png"
    },
    {
      id: 4,
      image: "/cases/case4.png"
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

            <img
              src={caseItem.image}
              className="case-image"
              alt=""
            />

          </div>
        ))}

      </div>

    </div>
  )
}

export default App
