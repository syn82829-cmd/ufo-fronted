import { useEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import Profile from "./pages/Profile"
import Bonus from "./pages/Bonus"
import Giveaways from "./pages/Giveaways"
import CasePage from "./pages/CasePage"
import Crash from "./pages/Crash"

function App() {
  useEffect(() => {
    const preventDefault = (e) => e.preventDefault()

    document.addEventListener("contextmenu", preventDefault)
    document.addEventListener("copy", preventDefault)
    document.addEventListener("cut", preventDefault)
    document.addEventListener("dragstart", preventDefault)
    document.addEventListener("selectstart", preventDefault)

    return () => {
      document.removeEventListener("contextmenu", preventDefault)
      document.removeEventListener("copy", preventDefault)
      document.removeEventListener("cut", preventDefault)
      document.removeEventListener("dragstart", preventDefault)
      document.removeEventListener("selectstart", preventDefault)
    }
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/bonus" element={<Bonus />} />
        <Route path="/giveaways" element={<Giveaways />} />
        <Route path="/case/:id" element={<CasePage />} />
        <Route path="/crash" element={<Crash />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
