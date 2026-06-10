import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { useUser } from "../context/UserContext"
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
  const LIVE_DROPS = [
  "/drops/Baklajan.png",
  "/drops/Dog.png",
  "/drops/Fen.png",
  "/drops/HeroicHelmet.png",
  "/drops/IonicDryer.png",
  "/drops/Klever.png",
  "/drops/Kosak.png",
  "/drops/LootBag.png",
  "/drops/Lowrider.png",
  "/drops/Mokey.png",
  "/drops/Moon.png",
  "/drops/Poo.png",
  "/drops/Runa.png",
  "/drops/SwissWatch.png",
  "/drops/WestsideSign.png",
  "/drops/astral.png",
  "/drops/ball.png",
  "/drops/batman.png",
  "/drops/beer.png",
  "/drops/bitsushka.png",
  "/drops/book.png",
  "/drops/pepebr.png",
  "/drops/pepecat.png",
  "/drops/podarok.png",
  "/drops/poison.png",
  "/drops/qksl.png",
  "/drops/raketa.png",
  "/drops/ring.png",
  "/drops/rock.png",
  "/drops/santa.png",
  "/drops/shlapa.png",
  "/drops/shlem.png",
  "/drops/skull.png",
  "/drops/soska.png",
  "/drops/spfrog.png",
  "/drops/spkos.png",
  "/drops/spsoska.png",
  "/drops/spwatch.png",
  "/drops/star.png",
  "/drops/tikva.png",
  "/drops/ufopoo.png",
  "/drops/unbear.png",
]

const [liveDrops, setLiveDrops] = useState(() =>
  Array.from({ length: 6 }, () =>
    LIVE_DROPS[Math.floor(Math.random() * LIVE_DROPS.length)]
  )
)

  const cases = [
    { id: "firstpepe", image: "/cases/case1.png.PNG", name: "Pepe Case", price: 5999, free: false },
    { id: "crash", image: "/cases/case2.png.PNG", name: "All or Nothing", price: 3999, free: false },
    { id: "spacevault", image: "/cases/spacevault.PNG", name: "Space Vault", price: 2999, free: false },
    { id: "darkmatter", image: "/cases/case3.png.PNG", name: "Crypto Punk", price: 2399, free: false },
    { id: "godparticle", image: "/cases/case4.png.PNG", name: "Iced Memory", price: 1299, free: false },
    { id: "purplehole", image: "/cases/case5.png.PNG", name: "Purple Hole", price: 999, free: false },
    { id: "spacetrash", image: "/cases/case6.png.PNG", name: "Space Trash", price: 35, free: false },
    { id: "starfall", image: "/cases/case7.png.PNG", name: "Starfall", price: 399, free: false },
    { id: "randomcase", image: "/cases/case8.png.PNG", name: "Random Case", price: 499, free: false },
    { id: "milkyway", image: "/cases/milkyway.PNG", name: "Milky Way", price: 100, free: false },
    { id: "singularity", image: "/cases/singularity.PNG", name: "Singularity", price: 50, free: false },
    { id: "3friends", image: "/cases/3friends.PNG", name: "For 3 Friends", price: null, free: true },
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

  useEffect(() => {
    const handleCrashState = (stateData) => {
      setCrashState(stateData)
    }

    socket.on("crash:state", handleCrashState)

    return () => {
      socket.off("crash:state", handleCrashState)
    }
  }, [])
useEffect(() => {
  let timeout

  const addDrop = () => {
    const randomDrop =
      LIVE_DROPS[Math.floor(Math.random() * LIVE_DROPS.length)]

    setLiveDrops((prev) => [
      randomDrop,
      ...prev.slice(0, 5),
    ])

    timeout = setTimeout(
      addDrop,
      2500 + Math.random() * 7000
    )
  }

  timeout = setTimeout(addDrop, 4000)

  return () => clearTimeout(timeout)
}, [])
  

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
      <div className="home-topbar home-topbar-minimal">
        <div className="home-topbar-left">
          <div className="home-topbar-balance">
            <img src="/ui/star.PNG" className="home-topbar-balance-icon" alt="" />
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

  <div className="live-items">
    {liveDrops.map((drop, index) => (
      <div
        className="live-drop"
        key={`${drop}-${index}`}
      >
        <img src={drop} alt="" />
      </div>
    ))}
  </div>
</div>
      
      <div
        className="crash-panel"
        onClick={() => {
          triggerHaptic("light")
          navigate("/crash")
        }}
      >
        <div className="crash-title">Rocket Crash</div>

        <div className={crashMainClass}>
          {crashMainValue}
        </div>

        {!!crashSubText && (
          <div className="home-crash-subtext">
            {crashSubText}
          </div>
        )}

        <button className="launch-btn" type="button">
          Запустить
        </button>

        {ufoAnim && (
          <div className="ufo-lottie" aria-hidden="true">
            <Lottie animationData={ufoAnim} loop autoplay />
          </div>
        )}
      </div>
      
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
            onClick={() => {
              triggerHaptic("light")
              navigate(`/case/${item.id}`)
            }}
          />
        ))}
      </div>

      <div className="bottom-nav-shell">
        <div className="bottom-nav">
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
            navigate("/profile")
          }}
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
