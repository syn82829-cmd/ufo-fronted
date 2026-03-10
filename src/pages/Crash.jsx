import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import {
  cashoutCrash,
  getCrashLive,
  getCrashState,
  placeCrashBet,
} from "../api"
import { useUser } from "../context/UserContext"
import { getPlayerRank } from "../utils/playerRank"
import "../style.css"

const formatStars = (value) => {
  const num = Number(value || 0)
  return new Intl.NumberFormat("ru-RU").format(num)
}

const getMultiplierByElapsedMs = (elapsedMs) => {
  const elapsed = Math.max(0, elapsedMs) / 1000
  return +(1 + elapsed * 0.85 + elapsed * elapsed * 0.12).toFixed(2)
}

function Crash() {
  const navigate = useNavigate()
  const { user, refreshUser } = useUser()

  const [ufoAnim, setUfoAnim] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const [betAmount, setBetAmount] = useState("100")
  const [crashState, setCrashState] = useState(null)
  const [livePlayers, setLivePlayers] = useState([])
  const [profit, setProfit] = useState(0)

  const [displayMultiplier, setDisplayMultiplier] = useState(1)
  const [displayCountdown, setDisplayCountdown] = useState(null)
  const [showStartText, setShowStartText] = useState(false)

  const [isBetLoading, setIsBetLoading] = useState(false)
  const [isCashoutLoading, setIsCashoutLoading] = useState(false)

  const stateRequestIdRef = useRef(0)
  const liveRequestIdRef = useRef(0)
  const stateLoadingRef = useRef(false)
  const liveLoadingRef = useRef(false)
  const animationFrameRef = useRef(null)

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
    if (!user?.id || user.id === "—") return

    let isMounted = true

    const loadCrashStateOnly = async () => {
      if (!isMounted || stateLoadingRef.current) return

      stateLoadingRef.current = true
      const requestId = ++stateRequestIdRef.current

      try {
        const stateData = await getCrashState(user.id)

        if (!isMounted) return
        if (requestId !== stateRequestIdRef.current) return

        setCrashState((prev) => {
          if (!prev) return stateData

          if ((stateData?.roundNumber || 0) < (prev?.roundNumber || 0)) {
            return prev
          }

          if (
            stateData?.roundNumber === prev?.roundNumber &&
            prev?.status === "crashed" &&
            stateData?.status === "flying"
          ) {
            return prev
          }

          return stateData
        })

        if (stateData?.myBet?.status !== "cashed_out") {
          setProfit(0)
        }
      } catch (err) {
        console.error("CRASH STATE LOAD ERROR:", err)
      } finally {
        stateLoadingRef.current = false
      }
    }

    const loadCrashLiveOnly = async () => {
      if (!isMounted || liveLoadingRef.current) return

      liveLoadingRef.current = true
      const requestId = ++liveRequestIdRef.current

      try {
        const liveData = await getCrashLive()

        if (!isMounted) return
        if (requestId !== liveRequestIdRef.current) return

        setLivePlayers(Array.isArray(liveData) ? liveData : [])
      } catch (err) {
        console.error("CRASH LIVE LOAD ERROR:", err)
      } finally {
        liveLoadingRef.current = false
      }
    }

    loadCrashStateOnly()
    loadCrashLiveOnly()

    const stateInterval = setInterval(loadCrashStateOnly, 150)
    const liveInterval = setInterval(loadCrashLiveOnly, 1200)

    return () => {
      isMounted = false
      clearInterval(stateInterval)
      clearInterval(liveInterval)
    }
  }, [user?.id])

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (!crashState) {
      setDisplayMultiplier(1)
      setDisplayCountdown(null)
      setShowStartText(false)
      return
    }

    const status = crashState.status

    if (status === "waiting") {
      setDisplayMultiplier(1)

      const serverNow = crashState.serverTime
        ? new Date(crashState.serverTime).getTime()
        : Date.now()
      const localNow = Date.now()
      const offsetMs = localNow - serverNow

      const countdownStartedAt = crashState.countdownStartedAt
        ? new Date(crashState.countdownStartedAt).getTime()
        : null

      const updateWaiting = () => {
        if (!countdownStartedAt) {
          setDisplayCountdown(crashState.countdown ?? null)
          setShowStartText(false)
          animationFrameRef.current = requestAnimationFrame(updateWaiting)
          return
        }

        const correctedNow = Date.now() - offsetMs
        const elapsedMs = Math.max(0, correctedNow - countdownStartedAt)
        const remainingMs = Math.max(0, 5000 - elapsedMs)

        if (remainingMs <= 250) {
          setDisplayCountdown(0)
          setShowStartText(true)
        } else {
          setDisplayCountdown(Math.ceil(remainingMs / 1000))
          setShowStartText(false)
        }

        animationFrameRef.current = requestAnimationFrame(updateWaiting)
      }

      updateWaiting()
      return
    }

    if (status === "flying") {
      setDisplayCountdown(null)
      setShowStartText(false)

      const flyingStartedAt = crashState.flyingStartedAt
        ? new Date(crashState.flyingStartedAt).getTime()
        : null

      const serverSnapshotTime = crashState.serverTime
        ? new Date(crashState.serverTime).getTime()
        : Date.now()

      const localSnapshotReceivedAt = Date.now()
      const baseMultiplier = Number(crashState.multiplier || 1)

      const updateFlying = () => {
        if (!flyingStartedAt) {
          setDisplayMultiplier(baseMultiplier)
          animationFrameRef.current = requestAnimationFrame(updateFlying)
          return
        }

        const localElapsedSinceSnapshot = Date.now() - localSnapshotReceivedAt
        const extrapolatedServerTime =
          serverSnapshotTime + Math.min(localElapsedSinceSnapshot, 180)

        const elapsedMs = Math.max(0, extrapolatedServerTime - flyingStartedAt)
        const animatedMultiplier = getMultiplierByElapsedMs(elapsedMs)

        setDisplayMultiplier(Math.max(baseMultiplier, animatedMultiplier))
        animationFrameRef.current = requestAnimationFrame(updateFlying)
      }

      updateFlying()
      return
    }

    if (status === "crashed") {
      setDisplayCountdown(null)
      setShowStartText(false)
      setDisplayMultiplier(Number(crashState.crashPoint || crashState.multiplier || 1))
    }
  }, [crashState])

  const numericBet = Math.max(0, Number(betAmount || 0))
  const status = crashState?.status || "waiting"
  const myBet = crashState?.myBet || null

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

  const refreshCrashData = async () => {
    if (!user?.id || user.id === "—") return

    try {
      const [stateData, liveData] = await Promise.all([
        getCrashState(user.id),
        getCrashLive(),
      ])

      setCrashState((prev) => {
        if (!prev) return stateData
        if ((stateData?.roundNumber || 0) < (prev?.roundNumber || 0)) return prev
        return stateData
      })

      setLivePlayers(Array.isArray(liveData) ? liveData : [])
    } catch (err) {
      console.error("REFRESH CRASH DATA ERROR:", err)
    }
  }

  const handleMainAction = async () => {
    if (!user?.id || user.id === "—") return

    if (canPlaceBet) {
      try {
        setIsBetLoading(true)
        setProfit(0)

        await placeCrashBet({
          telegram_id: user.id,
          amount: numericBet,
        })

        setIsBetLoading(false)

        refreshUser().catch((err) => {
          console.error("REFRESH USER AFTER BET ERROR:", err)
        })

        refreshCrashData().catch((err) => {
          console.error("REFRESH CRASH AFTER BET ERROR:", err)
        })
      } catch (err) {
        console.error("PLACE CRASH BET ERROR:", err)
        await refreshUser().catch(() => {})
        setIsBetLoading(false)
      }

      return
    }

    if (canCashout) {
      try {
        setIsCashoutLoading(true)

        const result = await cashoutCrash({
          telegram_id: user.id,
        })

        setProfit(Number(result?.profit || 0))
        setIsCashoutLoading(false)

        refreshUser().catch((err) => {
          console.error("REFRESH USER AFTER CASHOUT ERROR:", err)
        })

        refreshCrashData().catch((err) => {
          console.error("REFRESH CRASH AFTER CASHOUT ERROR:", err)
        })
      } catch (err) {
        console.error("CRASH CASHOUT ERROR:", err)
        await refreshUser().catch(() => {})
        setIsCashoutLoading(false)
      }
    }
  }

  const mainButtonText = (() => {
    if (isBetLoading) return "Ставка..."
    if (isCashoutLoading) return "Вывод..."
    if (canCashout) return "Забрать"
    if (myBet && myBet.status === "active" && isWaiting) return "Ставка принята"
    if (myBet && myBet.status === "cashed_out") return "Выведено"
    if (isWaiting) return "Сделать ставку"
    if (isFlying && !myBet) return "Раунд идет"
    if (isCrashed) return "Ожидание..."
    return "Ожидание..."
  })()

  const showUfo = isFlying
  const showCrashText = isCrashed
  const showCountdown = isWaiting && displayCountdown !== null && displayCountdown > 0
  const showStart = isWaiting && showStartText

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

              {profit > 0 && (
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
              Раунды идут автоматически, ставки и live теперь приходят с сервера
            </div>
          </div>
        )}

        <div className="crash-flight-zone">
          <div className={`crash-multiplier ${isCrashed ? "crashed" : ""}`}>
            x{Number(displayMultiplier || 1).toFixed(2)}
          </div>

          {showUfo && ufoAnim && (
            <div className="crash-ufo-lottie flying">
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
              {displayCountdown}
            </div>
          )}

          {showStart && (
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
              {mainButtonText}
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
