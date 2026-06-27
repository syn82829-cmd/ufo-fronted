import { lazy, Suspense, useEffect } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"

import Home from "./pages/Home"

const Profile = lazy(() => import("./pages/Profile"))
const Bonus = lazy(() => import("./pages/Bonus"))
const Giveaways = lazy(() => import("./pages/Giveaways"))
const CasePage = lazy(() => import("./pages/CasePage"))
const Crash = lazy(() => import("./pages/Crash"))

function PageLoader() {
  return (
    <div className="route-loader">
      Загрузка…
    </div>
  )
}

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }

    scrollTop()

    const frame = requestAnimationFrame(scrollTop)

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [location.pathname])

  return null
}

function App() {
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual"
    }

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
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
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
