import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { useUser } from "../context/UserContext"
import { getPlayerRank } from "../utils/playerRank"
import { triggerHaptic } from "../utils/haptics"
import { socket } from "../socket"
import CaseCard from "../components/CaseCard"
import DepositMenu from "../components/DepositMenu"
import DailyGiftPopup from "../components/DailyGiftPopup"

import "../style.css"

function Home() {
  const navigate = useNavigate()
  const { user } = useUser()

  const activeTab = "home" // ✅ ВАЖНО

  const [ufoAnim, setUfoAnim] = useState(null)
  const [casesFilter, setCasesFilter] = useState("expensive")
  const [crashState, setCrashState] = useState(null)
  const [isDepositOpen, setIsDepositOpen] = useState(false)

  const cases = [
    { id: "firstpepe", image: "/cases/case1.png.PNG", name: "Pepe Case", price: 9999, free: false },
    { id: "crash", image: "/cases/case2.png.PNG", name: "All or Nothing", price: 7999, free: false },
    { id: "spacevault", image: "/cases/spacevault.PNG", name: "Space Vault", price: 5999, free: false },
    { id: "darkmatter", image: "/cases/case3.png.PNG", name: "Crypto Punk", price: 4999, free: false },
    { id: "godparticle", image: "/cases/case4.png.PNG", name: "Iced Memory", price: 4499, free: false },
    { id: "purplehole", image: "/cases/case5.png.PNG", name: "Purple Hole", price: 1199, free: false },
    { id: "spacetrash", image: "/cases/case6.png.PNG", name: "Space Trash", price: 799, free: false },
    { id: "starfall", image: "/cases/case7.png.PNG", name: "Starfall", price: 499, free: false },
    { id: "randomcase", image: "/cases/case8.png.PNG", name: "Random Case", price: 999, free: false },
    { id: "3friends", image: "/cases/3friends.PNG", name: "For 3 Friends", price: null, free: true },
  ]

  const playerRank = useMemo(() => {
    return getPlayerRank(
      Number(user?.casesOpened || 0),
      Number(user?.crashGamesPlayed || 0)
    )
  }, [user?.casesOpened, user?.crashGamesPlayed])

  useEffect(() => {
    let cancelled = false

    async function loadUfoAnim() {
      try {
        const res = await fetch("/animations/ufo.json")
        const data = await res.json()
        if (!cancelled) setUfoAnim(data)
      } catch (err) {
        console.error("UFO LOTTIE LOAD ERROR:", err)
      }
    }

    loadUfoAnim()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const handler = (stateData) => setCrashState(stateData)
    socket.on("crash:state", handler)
    return () => socket.off("crash:state", handler)
  }, [])

  const cycleFilter = () => {
    triggerHaptic("light")
    setCasesFilter((prev) =>
      prev === "expensive" ? "cheap" : prev === "cheap" ? "free" : "expensive"
    )
  }

  const filterLabel =
    casesFilter === "expensive"
      ? "По цене ↓"
      : casesFilter === "cheap"
        ? "По цене ↑"
        : "Бесплатные >"

  const visibleCases = useMemo(() => {
    if (casesFilter === "free") return cases.filter((i) => i.free)
    return [...cases].sort((a, b) =>
      casesFilter === "expensive" ? b.price - a.price : a.price - b.price
    )
  }, [casesFilter])

  const status = crashState?.status || "waiting"
  const multiplier = Number(crashState?.multiplier || 1)
  const countdown = crashState?.countdown ?? 5

  const crashMainValue =
    status === "flying"
      ? `x${multiplier.toFixed(2)}`
      : status === "waiting" && countdown > 0
        ? countdown
        : status === "crashed"
          ? `x${multiplier.toFixed(2)}`
          : "5"

  const crashMainClass =
    status === "crashed"
      ? "multiplier crashed"
      : status === "flying"
        ? "multiplier flying"
        : "multiplier waiting"

  return (
    <div className="app">

      {/* TOPBAR */}
      <div className="home-topbar">
        <div className="home-topbar-left" onClick={() => navigate("/profile")}>
          <div className="home-topbar-avatar">
            {user.photoUrl ? (
              <img src={user.photoUrl} className="home-topbar-avatar-image" />
            ) : (
              <span className="home-topbar-avatar-fallback">
                {(user.username?.[0] || "G").toUpperCase()}
              </span>
            )}
          </div>

          <div className="home-topbar-user">
            <div className="home-topbar-name">{user.username}</div>
            <div className="home-topbar-rank">
              <img src={playerRank.image} className="home-topbar-rank-icon" />
              <span className="home-topbar-rank-text">{playerRank.name}</span>
            </div>
          </div>
        </div>

        <div className="home-topbar-right">
          <div className="home-topbar-balance">
            <img src="/ui/star.PNG" className="home-topbar-balance-icon" />
            <span>{user.balance}</span>
          </div>

          <button className="home-topbar-plus" onClick={() => setIsDepositOpen(true)}>
            +
          </button>
        </div>
      </div>

      {/* CRASH */}
      <div className="crash-panel" onClick={() => navigate("/crash")}>
        <div className="crash-title">Rocket Crash</div>

        <div className={crashMainClass}>{crashMainValue}</div>

        <button className="launch-btn">Играть</button>

        {ufoAnim && (
          <div className="ufo-lottie">
            <Lottie animationData={ufoAnim} loop autoplay />
          </div>
        )}
      </div>

      {/* FILTER */}
      <div className="cases-toolbar">
        <button className="cases-filter-btn" onClick={cycleFilter}>
          {filterLabel}
        </button>
      </div>

      {/* CASES */}
      <div className="cases-section">
        {visibleCases.map((item) => (
          <CaseCard
            key={item.id}
            caseItem={item}
            onClick={() => navigate(`/case/${item.id}`)}
          />
        ))}
      </div>

      {/* NAV */}
      <div className="bottom-nav">

        <div
          className={`nav-item ${activeTab === "bonus" ? "active" : ""}`}
          onClick={() => navigate("/bonus")}
        >
          <img src="/ui/cupnav.PNG" className="nav-icon" />
          <span>Награды</span>
        </div>

        <div
          className={`nav-item ${activeTab === "friends" ? "active" : ""}`}
          onClick={() => navigate("/giveaways")}
        >
          <img src="/ui/frnav.PNG" className="nav-icon" />
          <span>Друзья</span>
        </div>

        <div
          className={`nav-item ${activeTab === "home" ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          <img src="/ui/main.PNG" className="nav-icon" />
          <span>Главная</span>
        </div>

        <div
          className={`nav-avatar-item ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => navigate("/profile")}
        >
          {user?.photoUrl ? (
            <img src={user.photoUrl} className="nav-avatar-image" />
          ) : (
            <span className="nav-avatar-fallback">
              {(user?.username?.[0] || "G").toUpperCase()}
            </span>
          )}
        </div>

      </div>

      <DepositMenu isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
      <DailyGiftPopup />

    </div>
  )
}

export default Home
