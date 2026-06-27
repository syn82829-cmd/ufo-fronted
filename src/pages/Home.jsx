import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useUser } from "../context/UserContext"
import { triggerHaptic } from "../utils/haptics"
import LiveDrops from "../components/LiveDrops"
import CaseCard from "../components/CaseCard"
import HomeCrashPanel from "../components/home/HomeCrashPanel"
import DepositMenu from "../components/DepositMenu"
import DailyGiftPopup from "../components/DailyGiftPopup"

import "../style.css"

const HOME_CASES = [
  { id: "firstpepe", image: "/cases/case1.webp", name: "Pepe Case", price: 5999, free: false },
  { id: "crash", image: "/cases/case2.webp", name: "All or Nothing", price: 3999, free: false },
  { id: "spacevault", image: "/cases/spacevault.webp", name: "Space Vault", price: 2999, free: false },
  { id: "darkmatter", image: "/cases/case3.webp", name: "Crypto Punk", price: 2399, free: false },
  { id: "adultsworld", image: "/cases/adultsworld.webp", name: "Adult's World", price: 1199, free: false },
  { id: "godparticle", image: "/cases/case4.webp", name: "Iced Memory", price: 1499, free: false },
  { id: "purplehole", image: "/cases/case5.webp", name: "Purple Hole", price: 699, free: false },
  { id: "spacetrash", image: "/cases/case6.webp", name: "Space Trash", price: 35, free: false },
  { id: "starfall", image: "/cases/case7.webp", name: "Starfall", price: 399, free: false },
  { id: "randomcase", image: "/cases/case8.webp", name: "Random Case", price: 499, free: false },
  { id: "darkenergy", image: "/cases/singularity.webp", name: "Dark Energy", price: 150, free: false },
  { id: "matrix", image: "/cases/matrix.webp", name: "The Matrix", price: 100, free: false },
  { id: "bigbang", image: "/cases/bigbang.webp", name: "The Big Bang", price: 50, free: false },
  { id: "3friends", image: "/cases/3friends.webp", name: "For 3 Friends", price: null, free: true },
]

function Home() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [casesFilter, setCasesFilter] = useState("expensive")
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    HOME_CASES.forEach((item) => {
      const img = new Image()
      img.decoding = "async"
      img.src = item.image
    })

    const star = new Image()
    star.decoding = "async"
    star.src = "/ui/star.PNG"
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        document.body.scrollTop ||
        document.documentElement.scrollTop

      setShowScrollTop(scrollTop > 150)
    }

    document.body.addEventListener("scroll", handleScroll, {
      passive: true,
    })

    return () => {
      document.body.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const visibleCases = useMemo(() => {
    if (casesFilter === "free") {
      return HOME_CASES.filter((item) => item.free)
    }

    return [...HOME_CASES].sort((a, b) =>
      casesFilter === "expensive"
        ? (b.price ?? 0) - (a.price ?? 0)
        : (a.price ?? 0) - (b.price ?? 0)
    )
  }, [casesFilter])

  return (
    <div className="app">
      <div className="home-topbar home-topbar-minimal">
        <div className="home-topbar-left">
          <div className="home-topbar-balance">
            <img
              src="/ui/star.PNG"
              className="home-topbar-balance-icon"
              alt=""
            />
            <span>{user?.balance ?? 0}</span>
          </div>
        </div>

        <div className="home-topbar-right">
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

      <div className="live-wins-bar">
        <div className="live-label">
          <span className="live-dot" />
          LIVE
        </div>

        <LiveDrops />
      </div>

      <HomeCrashPanel />

      <div className="cases-toolbar">
        <button
          type="button"
          className={`cases-tab ${
            casesFilter === "expensive" ? "active" : ""
          }`}
          onClick={() => {
            triggerHaptic("light")
            setCasesFilter("expensive")
          }}
        >
          Дороже
        </button>

        <button
          type="button"
          className={`cases-tab ${
            casesFilter === "cheap" ? "active" : ""
          }`}
          onClick={() => {
            triggerHaptic("light")
            setCasesFilter("cheap")
          }}
        >
          Дешевле
        </button>

        <button
          type="button"
          className={`cases-tab ${
            casesFilter === "free" ? "active" : ""
          }`}
          onClick={() => {
            triggerHaptic("light")
            setCasesFilter("free")
          }}
        >
          Бесплатно
        </button>
      </div>

      <div className="cases-section">
        {visibleCases.map((item) => (
          <CaseCard
            key={item.id}
            caseItem={item}
          />
        ))}
      </div>

      <div className="bottom-nav-shell">
        <div
          className={`bottom-nav ${
            showScrollTop ? "bottom-nav-hidden" : ""
          }`}
        >
          <div
            className="nav-item"
            onClick={() => {
              triggerHaptic("light")
              navigate("/bonus")
            }}
          >
            <img src="/ui/cupnav.PNG" alt="" className="nav-icon" />
            <span>Награды</span>
          </div>

          <div
            className="nav-item"
            onClick={() => {
              triggerHaptic("light")
              navigate("/giveaways")
            }}
          >
            <img src="/ui/frnav.PNG" alt="" className="nav-icon" />
            <span>Друзья</span>
          </div>

          <div className="nav-item active">
            <img src="/ui/main.PNG" alt="" className="nav-icon" />
            <span>Главная</span>
          </div>
        </div>

        <div
          className="floating-profile"
          onClick={() => {
            triggerHaptic("light")

            if (showScrollTop) {
              document.body.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            } else {
              navigate("/profile")
            }
          }}
        >
          <div
            className={`profile-avatar-wrapper ${
              showScrollTop ? "hidden" : ""
            }`}
          >
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.username}
                className="floating-profile-image"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="floating-profile-fallback">
                {(user?.username?.[0] || "G").toUpperCase()}
              </span>
            )}
          </div>

          <img
            src="/ui/top.PNG"
            alt=""
            className={`scroll-top-icon ${
              showScrollTop ? "visible" : ""
            }`}
          />
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
