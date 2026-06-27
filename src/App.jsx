import { lazy, Suspense, useEffect, useLayoutEffect } from "react"
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

function resetDocumentScroll() {
  window.scrollTo(0, 0)
  window.scrollTo({ top: 0, left: 0, behavior: "auto" })

  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

function ScrollToTop() {
  const location = useLocation()

  useLayoutEffect(() => {
    resetDocumentScroll()

    const frameOne = requestAnimationFrame(resetDocumentScroll)
    const frameTwo = requestAnimationFrame(() => {
      requestAnimationFrame(resetDocumentScroll)
    })

    const timeoutOne = window.setTimeout(resetDocumentScroll, 60)
    const timeoutTwo = window.setTimeout(resetDocumentScroll, 180)
    const timeoutThree = window.setTimeout(resetDocumentScroll, 360)

    return () => {
      cancelAnimationFrame(frameOne)
      cancelAnimationFrame(frameTwo)
      window.clearTimeout(timeoutOne)
      window.clearTimeout(timeoutTwo)
      window.clearTimeout(timeoutThree)
    }
  }, [location.pathname, location.search, location.key])

  return null
}

function AppRoutes() {
  const location = useLocation()

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/bonus" element={<Bonus />} />
        <Route path="/giveaways" element={<Giveaways />} />
        <Route path="/case/:id" element={<CasePage />} />
        <Route path="/crash" element={<Crash />} />
      </Routes>
    </Suspense>
  )
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
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
