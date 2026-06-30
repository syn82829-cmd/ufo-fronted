import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { useCrashSocket } from "../hooks/useCrashSocket"
import { useCrashDisplay } from "../hooks/useCrashDisplay"
import { formatStars } from "../utils/crashHelpers"
import { triggerHaptic } from "../utils/haptics"
import { useUser } from "../context/UserContext"
import { getPlayerRank } from "../utils/playerRank"
import "../style.css"

const CRASH_BET_STORAGE_KEY = "ufo_crash_last_bet"

async function loadLottieJson(path) {
  const res = await fetch(path)

  if (!res.ok) {
    throw new Error(`Failed to load ${path}: ${res.status}`)
  }

  return res.json()
}

function Crash() {
  const navigate = useNavigate()
  const { user, refreshUser, incrementBalance, decrementBalance } = useUser()

  const savedCrashBet = useMemo(() => {
    try {
      return localStorage.getItem(CRASH_BET_STORAGE_KEY) || ""
    } catch {
      return ""
    }
  }, [])

  const betInputRef = useRef(null)
  const betZoneRef = useRef(null)

  const [ufoAnim, setUfoAnim] = useState(null)
  const [boomAnim, setBoomAnim] = useState(null)
  const [moonAnim, setMoonAnim] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [betAmount, setBetAmount] = useState(savedCrashBet || "100")
  const [isInitialDefaultBet, setIsInitialDefaultBet] = useState(!savedCrashBet)
  const [isBetInputFocused, setIsBetInputFocused] = useState(false)

  const {
    crashState,
    livePlayers,
    profit,
    isBetLoading,
    isCashoutLoading,
    placeBet,
    cashout,
  } = useCrashSocket({
    userId: user?.id,
    refreshUser,
    user,
    incrementBalance,
    decrementBalance,
  })

  const {
    displayMultiplier,
    displayCountdown,
  } = useCrashDisplay(crashState)

  const playerRank = useMemo(() => {
    return getPlayerRank(
      Number(user?.casesOpened || 0),
      Number(user?.crashGamesPlayed || 0)
    )
  }, [user?.casesOpened, user?.crashGamesPlayed])

  useEffect(() => {
    let cancelled = false

    async function loadCrashAnimations() {
      try {
        const [ufoData, boomData, moonData] = await Promise.allSettled([
          loadLottieJson("/animations/ufo.json"),
          loadLottieJson("/animations/boom.json"),
          loadLottieJson("/animations/moon.json"),
        ])

        if (cancelled) return

        if (ufoData.status === "fulfilled") {
          setUfoAnim(ufoData.value)
        } else {
          console.error("CRASH UFO LOTTIE LOAD ERROR:", ufoData.reason)
        }

        if (boomData.status === "fulfilled") {
          setBoomAnim(boomData.value)
        } else {
          console.error("CRASH BOOM LOTTIE LOAD ERROR:", boomData.reason)
        }

        if (moonData.status === "fulfilled") {
          setMoonAnim(moonData.value)
        } else {
          console.error("CRASH MOON LOTTIE LOAD ERROR:", moonData.reason)
        }
      } catch (err) {
        console.error("CRASH LOTTIE LOAD ERROR:", err)
      }
    }

    loadCrashAnimations()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isBetInputFocused) return undefined

    const scrollBetControlsIntoView = () => {
      const target = betZoneRef.current
      if (!target) return

      try {
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        })
      } catch {
        target.scrollIntoView(false)
      }
    }

    const timers = [60, 180, 340, 560, 820].map((delay) => {
      return window.setTimeout(scrollBetControlsIntoView, delay)
    })

    const viewport = window.visualViewport
    viewport?.addEventListener?.("resize", scrollBetControlsIntoView)
    viewport?.addEventListener?.("scroll", scrollBetControlsIntoView)

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      viewport?.removeEventListener?.("resize", scrollBetControlsIntoView)
      viewport?.removeEventListener?.("scroll", scrollBetControlsIntoView)
    }
  }, [isBetInputFocused])

  const numericBet = Math.max(0, Number(betAmount || 0))
  const status = crashState?.status || "waiting"
  const multiplier = Number(displayMultiplier || 1)
  const myBet = crashState?.myBet || null
  const cashedOutProfit = Number(profit || myBet?.profit || 0)

  const isWaiting = status === "waiting"
  const isFlying = status === "flying"
  const isCrashed = status === "crashed"

  const canPlaceBet =
    isWaiting &&
    numericBet > 0 &&
    !myBet &&
    !isBetLoading &&
    !isCashoutLoading

  const canCashout =
    isFlying &&
    myBet?.status === "active" &&
    !isCashoutLoading &&
    !isBetLoading

  const handleBetFocus = () => {
    setIsBetInputFocused(true)

    if (isInitialDefaultBet && betAmount === "100") {
      setBetAmount("")
      setIsInitialDefaultBet(false)
    }
  }

  const handleBetBlur = () => {
    setIsBetInputFocused(false)
  }

  const handleBetChange = (event) => {
    const nextValue = event.target.value

    setBetAmount(nextValue)
    setIsInitialDefaultBet(false)

    try {
      if (String(nextValue).trim()) {
        localStorage.setItem(CRASH_BET_STORAGE_KEY, nextValue)
      } else {
        localStorage.removeItem(CRASH_BET_STORAGE_KEY)
      }
    } catch {
      // localStorage may be unavailable inside some webviews
    }
  }

  const handleMainAction = async () => {
    if (!user?.id || user.id === "—") return

    if (canPlaceBet) {
      try {
        triggerHaptic("medium")
        await placeBet(numericBet)
      } catch (err) {
        triggerHaptic("error")
      }
      return
    }

    if (canCashout) {
      try {
        triggerHaptic("medium")
        await cashout()
        triggerHaptic("success")
      } catch (err) {
        triggerHaptic("error")
      }
      return
    }

    triggerHaptic("error")
  }

  const mainButtonContent = (() => {
    if (isBetLoading) return "Ставка..."
    if (isCashoutLoading) return "Вывод..."
    if (canCashout) return "Забрать"
    if (myBet && myBet.status === "active" && isWaiting) return "Ставка принята"
    if (myBet && myBet.status === "cashed_out") {
      return (
        <span className="crash-cashout-profit-label">
          <span>+</span>
          <img src="/ui/star.PNG" alt="" className="crash-cashout-profit-star" draggable={false} />
          <span>{formatStars(cashedOutProfit)}</span>
        </span>
      )
    }
    if (isWaiting) return "Сделать ставку"
    if (isFlying && !myBet) return "Раунд идет"
    if (isCrashed) return "Ожидание..."
    return "Ожидание..."
  })()

  const showUfo = isFlying
  const showMoon = (isFlying || isCrashed) && moonAnim
  const showCrashScene = showUfo || showMoon
  const showBoom = isCrashed && boomAnim
  const showCrashText = isCrashed && !boomAnim
  const showCountdown = isWaiting && displayCountdown !== null && displayCountdown > 0

  return (
    <div className={`app ${isBetInputFocused ? "crash-input-focused" : ""}`}>
      <div className="crash-page">
        <div className="crash-topbar">
          <div
            className="crash-topbar-left"
            onClick={() => {
              triggerHaptic("light")
              navigate("/profile")
            }}
          >
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
            </div>

            <button
              type="button"
              className="crash-topbar-plus"
              onClick={() => {
                triggerHaptic("light")
                navigate("/profile")
              }}
            >
              +
            </button>
          </div>
        </div>

        <div className="crash-header-actions">
          <button
            type="button"
            className="crash-header-btn crash-back-btn"
            onClick={() => {
              triggerHaptic("light")
              navigate(-1)
            }}
          >
            <img src="/ui/back.PNG" className="crash-header-icon" alt="" draggable={false} />
          </button>

          <button
            type="button"
            className="crash-header-btn crash-settings-btn"
            aria-disabled="true"
            tabIndex={-1}
          >
            <img src="/ui/settings.PNG" className="crash-header-icon" alt="" draggable={false} />
          </button>
        </div>

        {isSettingsOpen && (
          <div className="crash-settings-panel">
            <div className="crash-settings-title">Rocket Crash</div>
            <div className="crash-settings-text">
              Demo-режим ставок будет позже
            </div>
          </div>
        )}

        <div className="crash-flight-zone">
          <div className={`crash-multiplier ${isCrashed ? "crashed" : ""}`}>
            x{multiplier.toFixed(2)}
          </div>

          {showCrashScene && (
            <div className="crash-flight-scene">
              {showMoon && (
                <div className="crash-moon-lottie">
                  <Lottie animationData={moonAnim} loop autoplay />
                </div>
              )}

              {showUfo && ufoAnim && (
                <div className="crash-ufo-lottie flying">
                  <Lottie animationData={ufoAnim} loop autoplay />
                </div>
              )}
            </div>
          )}

          {showBoom && (
            <div className="crash-boom-lottie">
              <Lottie
                animationData={boomAnim}
                loop={false}
                autoplay
                initialSegment={[0, 75]}
              />
            </div>
          )}

          {showCrashText && (
            <div className="crash-center-text crash-word">
              Crash!
            </div>
          )}

          {showCountdown && (
            <div className="crash-center-text crash-countdown">
              {displayCountdown}
            </div>
          )}
        </div>

        <div className="crash-bet-zone" ref={betZoneRef}>
          <div className="crash-bet-controls">
            <div className="crash-bet-input-wrap">
              <img src="/ui/star.PNG" className="crash-bet-input-icon" alt="" />
              <input
                ref={betInputRef}
                type="number"
                min="1"
                inputMode="numeric"
                className="crash-bet-input"
                value={betAmount}
                onFocus={handleBetFocus}
                onBlur={handleBetBlur}
                onChange={handleBetChange}
                disabled={!isWaiting || !!myBet || isBetLoading}
                placeholder="Ставка"
              />
            </div>

            <button
              type="button"
              className={`crash-bet-btn ${canCashout ? "cashout" : ""}`}
              onClick={handleMainAction}
              disabled={!canPlaceBet && !canCashout}
            >
              {mainButtonContent}
            </button>
          </div>
        </div>

        <div className="crash-live-block">
          <div className="crash-live-title">Live ставки</div>

          <div className="crash-live-list">
            {livePlayers.map((item) => {
              const liveUser = item.user || {}
              const rank = getPlayerRank(
                Number(liveUser.casesOpened || 0),
                Number(liveUser.crashGamesPlayed || 0)
              )

              return (
                <div key={item.id} className="crash-live-row">
                  <div className="crash-live-user">
                    <div className="crash-live-avatar">
                      <span className="crash-live-avatar-fallback">
                        {(liveUser.username?.[0] || "G").toUpperCase()}
                      </span>
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

                      <div className="crash-live-name">{liveUser.username || "Unknown"}</div>
                    </div>
                  </div>

                  <div className="crash-live-bet">
                    <img src="/ui/star.PNG" className="crash-live-bet-icon" alt="" />
                    <span>{formatStars(item.amount)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className={`bottom-nav-shell ${isBetInputFocused ? "crash-keyboard-hidden" : ""}`}>
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

          <div
            className="nav-item"
            onClick={() => {
              triggerHaptic("light")
              navigate("/")
            }}
          >
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
    </div>
  )
}

export default Crash
