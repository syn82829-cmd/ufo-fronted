import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { useUser } from "../context/UserContext"
import CaseCard from "../components/CaseCard"

import "../style.css"

function Home() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [ufoAnim, setUfoAnim] = useState(null)
  const [casesFilter, setCasesFilter] = useState("expensive")

  const cases = [
    { id: "firstpepe", image: "/cases/case1.png.PNG", name: "Pepe Case", price: 9999, free: false },
    { id: "crash", image: "/cases/case2.png.PNG", name: "All or Nothing", price: 7999, free: false },
    { id: "darkmatter", image: "/cases/case3.png.PNG", name: "Dark Matter", price: 5999, free: false },
    { id: "godparticle", image: "/cases/case4.png.PNG", name: "God Particle", price: 4999, free: false },
    { id: "purplehole", image: "/cases/case5.png.PNG", name: "Purple Hole", price: 2299, free: false },
    { id: "spacetrash", image: "/cases/case6.png.PNG", name: "Space Trash", price: 799, free: false },
    { id: "starfall", image: "/cases/case7.png.PNG", name: "Starfall", price: 499, free: false },
    { id: "randomcase", image: "/cases/case8.png.PNG", name: "Random Case", price: 999, free: false },
  ]

  useEffect(() => {
    let cancelled = false

    async function loadUfoAnim() {
      try {
        const res = await fetch("/animations/ufo.json")
        if (!res.ok) throw new Error(`Failed to load /animations/ufo.json: ${res.status}`)
        const data = await res.json()

        if (!cancelled) {
          setUfoAnim(data)
        }
      } catch (err) {
        console.error("UFO LOTTIE LOAD ERROR:", err)
      }
    }

    loadUfoAnim()

    return () => {
      cancelled = true
    }
  }, [])

  const cycleFilter = () => {
    setCasesFilter((prev) => {
      if (prev === "expensive") return "cheap"
      if (prev === "cheap") return "free"
      return "expensive"
    })
  }

  const filterLabel =
    casesFilter === "expensive"
      ? "По цене ↓"
      : casesFilter === "cheap"
        ? "По цене ↑"
        : "Бесплатные >"

  const visibleCases = useMemo(() => {
    if (casesFilter === "free") {
      return cases.filter((item) => item.free)
    }

    const sorted = [...cases].sort((a, b) =>
      casesFilter === "expensive" ? b.price - a.price : a.price - b.price
    )

    return sorted
  }, [casesFilter])

  return (
    <div className="app">
      <div className="home-topbar">
        <div className="home-topbar-left" onClick={() => navigate("/profile")}>
          <div className="home-topbar-avatar">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.username}
                className="home-topbar-avatar-image"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="home-topbar-avatar-fallback">
                {(user.username?.[0] || "G").toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="home-topbar-right">
          <div className="home-topbar-balance">
            <img src="/ui/star.PNG" className="home-topbar-balance-icon" alt="" />
            <span>{user.balance}</span>
          </div>

          <button
            type="button"
            className="home-topbar-plus"
            onClick={() => navigate("/profile")}
          >
            +
          </button>
        </div>
      </div>

      <div className="crash-panel" onClick={() => navigate("/crash")}>
        <div className="crash-title">UFO Crash</div>
        <div className="multiplier">&gt; x1.63</div>

        <button className="launch-btn" type="button">
          Запустить НЛО
        </button>

        {ufoAnim && (
          <div className="ufo-lottie" aria-hidden="true">
            <Lottie animationData={ufoAnim} loop autoplay />
          </div>
        )}
      </div>

      <div className="cases-toolbar">
        <button type="button" className="cases-filter-btn" onClick={cycleFilter}>
          {filterLabel}
        </button>
      </div>

      <div className="cases-section">
        {visibleCases.map((item) => (
          <CaseCard
            key={item.id}
            caseItem={item}
            onClick={() => navigate(`/case/${item.id}`)}
          />
        ))}
      </div>

      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/bonus")}>
          Бонусы
        </div>

        <div className="nav-item" onClick={() => navigate("/giveaways")}>
          Розыгрыши
        </div>

        <div className="nav-item active">Главная</div>

        <div className="nav-item" onClick={() => navigate("/profile")}>
          Профиль
        </div>
      </div>
    </div>
  )
}

export default Home
