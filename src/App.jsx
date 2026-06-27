import { lazy, Suspense, useEffect } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "./pages/Home"

const Profile = lazy(() => import("./pages/Profile"))
const Bonus = lazy(() => import("./pages/Bonus"))
const Giveaways = lazy(() => import("./pages/Giveaways"))
const CasePage = lazy(() => import("./pages/CasePage"))
const Crash = lazy(() => import("./pages/Crash"))

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
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bonus" element={<Bonus />} />
          <Route path="/giveaways" element={<Giveaways />} />
          <Route path="/case/:id" element={<CasePage />} />
          <Route path="/crash" element={<Crash />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
