import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { useUser } from "../context/UserContext"
import { getPlayerRank } from "../utils/playerRank"
import "../style.css"

const mockPlayers = [
  {
    id: 1,
    username: "astro_max",
    avatar: "",
    casesOpened: 7,
    crashGamesPlayed: 3,
    bet: 250,
  },
  {
    id: 2,
    username: "nova_queen",
    avatar: "",
    casesOpened: 18,
    crashGamesPlayed: 11,
    bet: 500,
  },
  {
    id: 3,
    username: "voidrunner",
    avatar: "",
    casesOpened: 42,
    crashGamesPlayed: 6,
    bet: 1000,
  },
  {
    id: 4,
    username: "cosmo_jett",
    avatar: "",
    casesOpened: 81,
    crashGamesPlayed: 14,
    bet: 1500,
  },
]

const formatStars = (value) => {
  const num = Number(value || 0)
  return new Intl.NumberFormat("ru-RU").format(num)
}

function getRandomCrashPoint() {
  const roll = Math.random()

  if (roll < 0.35) return 1.1 + Math.random() * 0.8
  if (roll < 0.7) return 1.9 + Math.random() * 1.6
  if (roll < 0.9) return 3.5 + Math.random() * 4.5
  return 8 + Math.random() * 12
}

function Crash() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [ufoAnim, setUfoAnim] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const [betAmount, setBetAmount] = useState("100")
  const [phase, setPhase] = useState("idle") // idle | flying | crashed | cashed | countdown | start
  const [multiplier, setMultiplier] = useState(1.0)
  const [profit, setProfit] = useState(0)
  const [countdown, setCountdown] = useState(null)

  const animationFrameRef = useRef(null)
  const startedAtRef = useRef(0)
  const crashPointRef = useRef(0)
  const countdownIntervalRef = useRef(null)
  const startTimeoutRef = useRef(null)

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
        console.error("CRASH UFO LOTTIE LOAD ERROR:", err)
      }
    }

    loadUfoAnim()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current)
    }
  }, [])

  const numericBet = Math.max(0, Number(betAmount || 0))
  const canStart = phase === "idle" && numericBet > 0

  const stopLoop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const clearRoundTimers = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }

    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current)
      startTimeoutRef.current = null
    }
  }

  const fullReset = () => {
    stopLoop()
    clearRoundTimers()
    setPhase("idle")
    setMultiplier(1.0)
    setProfit(0)
    setCountdown(null)
  }

  const runPostCrashCountdown = () => {
    clearRoundTimers()
    setPhase("countdown")
    setCountdown(5)

    let value = 5

    countdownIntervalRef.current = setInterval(() => {
      value -= 1

      if (value > 0) {
        setCountdown(value)
        return
      }

      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
      setCountdown(null)
      setPhase("start")

      startTimeoutRef.current = setTimeout(() => {
        setPhase("idle")
        setMultiplier(1.0)
      }, 1100)
    }, 1000)
  }

  const startCrashLoop = () => {
    const localCrashPoint = getRandomCrashPoint()
    crashPointRef.current = localCrashPoint

    setPhase("flying")
    setMultiplier(1.0)
    setProfit(0)
    setCountdown(null)
    startedAtRef.current = performance.now()

    const tick = (now) => {
      const elapsed = (now - startedAtRef.current) / 1000
      const nextMultiplier = Number((1 + elapsed * 0.85 + elapsed * elapsed * 0.12).toFixed(2))

      if (nextMultiplier >= crashPointRef.current) {
        setMultiplier(Number(crashPointRef.current.toFixed(2)))
        setPhase("crashed")
        setProfit(0)
        animationFrameRef.current = null

        setTimeout(() => {
          runPostCrashCountdown()
        }, 900)

        return
      }

      setMultiplier(nextMultiplier)
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
  }

  const handleMainAction = () => {
    if (phase === "idle") {
      if (!canStart) return
      startCrashLoop()
      return
    }

    if (phase === "flying") {
      stopLoop()

      const payout = Math.floor(numericBet * multiplier)
      const pureProfit = Math.max(payout - numericBet, 0)

      setProfit(pureProfit)
      setPhase("cashed")

      setTimeout(() => {
        runPostCrashCountdown()
      }, 900)
    }
  }

  const mainButtonText =
    phase === "idle"
      ? "Сделать ставку"
      : phase === "flying"
        ? "Забрать"
        : phase === "countdown"
          ? "Ожидание..."
          : phase === "start"
            ? "Start!"
            : "Ожидание..."

  const crashPlayers = useMemo(() => {
    if (phase !== "flying") return mockPlayers

    const currentUser = {
      id: "me",
      username: user?.username || "you",
      avatar: user?.photoUrl || "",
      casesOpened: Number(user?.casesOpened || 0),
      crashGamesPlayed: Number(user?.crashGamesPlayed || 0),
      bet: numericBet,
    }

    return [currentUser, ...mockPlayers]
  }, [phase, user?.username, user?.photoUrl, user?.casesOpened, user?.crashGamesPlayed, numericBet])

  const showUfo = phase === "idle" || phase === "flying"
  const showCrashText = phase === "crashed"
  const showCountdown = phase === "countdown"
  const showStartText = phase === "start"

  return (
    <div className="app">
      <div className="crash-page">
        <div className="crash-topbar">
          <div className="crash-topbar-left" onClick={() => navigate("/profile")}>
            <div className="crash-topbar-avatar">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.username}
                  className="crash-topbar-avatar-image"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="crash-topbar-avatar-fallback">
                  {(user.username?.[0] || "G").toUpperCase()}
                </span>
              )}
            </div>

            <div className="crash-topbar-user">
              <div className="crash-topbar-name">{user.username}</div>

              <div className="crash-topbar-rank">
                <img
                  src={playerRank.image}
                  alt={playerRank.name}
                  className="crash-topbar-rank-icon"
                  draggable={false}
                />
                <span className="crash-topbar-rank-text">{playerRank.name}</span>
              </div>
            </div>
          </div>

          <div className="crash-topbar-right">
            <div className="crash-topbar-balance-wrap">
              <div className="crash-topbar-balance">
                <img src="/ui/star.PNG" className="crash-topbar-balance-icon" alt="" />
                <span>{user.balance}</span>
              </div>

              {profit > 0 && phase !== "flying" && (
                <div className="crash-balance-profit">
                  +{formatStars(profit)} ⭐
                </div>
              )}
            </div>

            <button
              type="button"
              className="crash-topbar-plus"
              onClick={() => navigate("/profile")}
            >
              +
            </button>
          </div>
        </div>

        <div className="crash-header-actions">
          <button
            type="button"
            className="crash-header-btn crash-back-btn"
            onClick={() => navigate(-1)}
          >
            <img src="/ui/back.PNG" className="crash-header-icon" alt="" draggable={false} />
          </button>

          <button
            type="button"
            className="crash-header-btn crash-settings-btn"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
          >
            <img src="/ui/settings.PNG" className="crash-header-icon" alt="" draggable={false} />
          </button>
        </div>

        {isSettingsOpen && (
          <div className="crash-settings-panel">
            <div className="crash-settings-title">UFO Crash</div>
            <div className="crash-settings-text">
              Боевой режим позже подключим к Stars и истории игр
            </div>
          </div>
        )}

        <div className="crash-flight-zone">
          <div className={`crash-multiplier ${phase === "crashed" ? "crashed" : ""}`}>
            x{multiplier.toFixed(2)}
          </div>

          {showUfo && ufoAnim && (
            <div className={`crash-ufo-lottie ${phase === "flying" ? "flying" : ""}`}>
              <Lottie animationData={ufoAnim} loop autoplay />
            </div>
          )}

          {showCrashText && (
            <div className="crash-center-text crash-word">
              Crash!
            </div>
          )}

          {showCountdown && (
            <div className="crash-center-text crash-countdown">
              {countdown}
            </div>
          )}

          {showStartText && (
            <div className="crash-center-text crash-word crash-start-word">
              Start!
            </div>
          )}
        </div>

        <div className="crash-bet-zone">
          <div className="crash-bet-controls">
            <div className="crash-bet-input-wrap">
              <img src="/ui/star.PNG" className="crash-bet-input-icon" alt="" />
              <input
                type="number"
                min="1"
                inputMode="numeric"
                className="crash-bet-input"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={phase !== "idle"}
                placeholder="Ставка"
              />
            </div>

            <button
              type="button"
              className={`crash-bet-btn ${phase === "flying" ? "cashout" : ""}`}
              onClick={handleMainAction}
              disabled={(phase === "idle" && !canStart) || phase === "countdown" || phase === "start" || phase === "crashed" || phase === "cashed"}
            >
              {mainButtonText}
            </button>
          </div>
        </div>

        <div className="crash-live-block">
          <div className="crash-live-title">Live ставки</div>

          <div className="crash-live-list">
            {crashPlayers.map((player) => {
              const rank = getPlayerRank(player.casesOpened, player.crashGamesPlayed)

              return (
                <div key={player.id} className="crash-live-row">
                  <div className="crash-live-user">
                    <div className="crash-live-avatar">
                      {player.avatar ? (
                        <img
                          src={player.avatar}
                          alt={player.username}
                          className="crash-live-avatar-image"
                          draggable={false}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="crash-live-avatar-fallback">
                          {(player.username?.[0] || "G").toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="crash-live-meta">
                      <div className="crash-live-rank">
                        <img
                          src={rank.image}
                          alt={rank.name}
                          className="crash-live-rank-icon"
                          draggable={false}
                        />
                        <span className="crash-live-rank-text">{rank.name}</span>
                      </div>

                      <div className="crash-live-name">{player.username}</div>
                    </div>
                  </div>

                  <div className="crash-live-bet">
                    <img src="/ui/star.PNG" className="crash-live-bet-icon" alt="" />
                    <span>{formatStars(player.bet)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="bottom-nav">
        <div className="nav-item" onClick={() => navigate("/bonus")}>
          Бонусы
        </div>

        <div className="nav-item" onClick={() => navigate("/giveaways")}>
          Розыгрыши
        </div>

        <div className="nav-item" onClick={() => navigate("/")}>
          Главная
        </div>

        <div className="nav-item" onClick={() => navigate("/profile")}>
          Профиль
        </div>
      </div>
    </div>
  )
}

export default Crash
