import './style.css'
import ufo from './ufo.png.PNG'

function App() {
  return (
    <div className="app">

      {/* логотип */}
      <h1 className="logo">UFOmo</h1>

      {/* glass crash блок */}
      <div className="crash-panel">

        <img
          src={ufo}
          alt="UFO"
          className="ufo-image"
        />

        <div className="multiplier">
          x1.00
        </div>

      </div>

    </div>
  )
}

export default App
