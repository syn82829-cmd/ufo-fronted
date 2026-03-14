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

  useEffect(() => {
    const handleCrashState = (stateData) => {
      setCrashState(stateData)
    }

    socket.on("crash:state", handleCrashState)

    return () => {
      socket.off("crash:state", handleCrashState)
    }
  }, [])

  const cycleFilter = () => {
    triggerHaptic("light")

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

  const status = crashState?.status || "waiting"
  const multiplier = Number(crashState?.multiplier || 1)
  const countdown = crashState?.countdown ?? 5

  const isWaiting = status === "waiting"
  const isFlying = status === "flying"
  const isCrashed = status === "crashed"

  const showStart = isWaiting && countdown === 0
  const showCountdown = isWaiting && countdown > 0

  const crashMainValue = isFlying
    ? `x${multiplier.toFixed(2)}`
    : showCountdown
      ? String(countdown)
      : showStart
        ? "Start!"
        : isCrashed
          ? `x${multiplier.toFixed(2)}`
          : "5"

  const crashSubText = showCountdown
    ? "Ожидание игроков"
    : showStart
      ? "Start!"
      : ""

  const crashMainClass = isCrashed
    ? "multiplier crashed"
    : isFlying
      ? "multiplier flying"
      : "multiplier waiting"

  return (
    <div className="app">
      <div className="home-topbar">
        <div
          className="home-topbar-left"
          onClick={() => {
            triggerHaptic("light")
            navigate("/profile")
          }}
        >
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

          <div className="home-topbar-user">
            <div className="home-topbar-name">{user.username}</div>

            <div className="home-topbar-rank">
              <img
                src={playerRank.image}
                alt={playerRank.name}
                className="home-topbar-rank-icon"
                draggable={false}
              />
              <span className="home-topbar-rank-text">{playerRank.name}</span>
            </div>
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
            onClick={() => {
              triggerHaptic("light")
              setIsDepositOpen(true)
            }}
          >
            +
          </button>
        </div>
      </div>

      <div
        className="crash-panel"
        onClick={() => {
          triggerHaptic("light")
          navigate("/crash")
        }}
      >
        <div className="crash-title">UFO Crash</div>

        <div className={crashMainClass}>
          {crashMainValue}
        </div>

        {!!crashSubText && (
          <div className="home-crash-subtext">
            {crashSubText}
          </div>
        )}

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
            onClick={() => {
              triggerHaptic("light")
              navigate(`/case/${item.id}`)
            }}
          />
        ))}
      </div>

      <div className="bottom-nav">
        <div
          className="nav-item"
          onClick={() => {
            triggerHaptic("light")
            navigate("/bonus")
          }}
        >
          Бонусы
        </div>

        <div
          className="nav-item"
          onClick={() => {
            triggerHaptic("light")
            navigate("/giveaways")
          }}
        >
          Розыгрыши
        </div>

        <div className="nav-item active">Главная</div>

        <div
          className="nav-item"
          onClick={() => {
            triggerHaptic("light")
            navigate("/profile")
          }}
        >
          Профиль
        </div>
      </div>

      <DepositMenu
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
      />

      <DailyGiftPopup />
    </div>
  )
}

export default Home
