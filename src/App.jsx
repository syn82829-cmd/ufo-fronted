import './style.css'

function App() {
  return (
    <div className="app">

      <div className="crash-panel">

        <div className="crash-left">

          <div className="crash-title">
            UFO Crash
          </div>

          <button className="launch-btn">
            Запустить НЛО
          </button>

        </div>

        <img
          src="/ufo.png.PNG"
          className="ufo-image"
        />

      </div>

    </div>
  )
}

export default App
