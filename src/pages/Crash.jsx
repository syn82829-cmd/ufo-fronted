import { useEffect, useMemo, useState } from "react"
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
    balance: 12450,
    casesOpened: 7,
    crashGamesPlayed: 3,
    bet: 250,
  },
  {
    id: 2,
    username: "nova_queen",
    avatar: "",
    balance: 22100,
    casesOpened: 18,
    crashGamesPlayed: 11,
    bet: 500,
  },
  {
    id: 3,
    username: "voidrunner",
    avatar: "",
    balance: 9800,
    casesOpened: 42,
    crashGamesPlayed: 6,
    bet: 1000,
  },
  {
    id: 4,
    username: "cosmo_jett",
    avatar: "",
    balance: 17800,
    casesOpened: 81,
    crashGamesPlayed: 14,
    bet: 1500,
  },
]

function Crash() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [ufoAnim, setUfoAnim] = useState(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

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
            <div className="crash-topbar-balance">
              <img src="/ui/star.PNG" className="crash-topbar-balance-icon" alt="" />
              <span>{user.balance}</span>
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
            <img
              src="/ui/back.PNG"
              className="crash-header-icon"
              alt=""
              draggable={false}
            />
          </button>

          <button
            type="button"
            className="crash-header-btn crash-settings-btn"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
          >
            <img
              src="/ui/settings.PNG"
              className="crash-header-icon"
              alt=""
              draggable={false}
            />
          </button>
        </div>

        {isSettingsOpen && (
          <div className="crash-settings-panel">
            <div className="crash-settings-title">UFO Crash</div>
            <div className="crash-settings-text">
              Здесь позже добавим авто-вывод, звук и боевые настройки игры
            </div>
          </div>
        )}

        <div className="crash-flight-zone">
          {ufoAnim && (
            <div className="crash-ufo-lottie" aria-hidden="true">
              <Lottie animationData={ufoAnim} loop autoplay />
            </div>
          )}
        </div>

        <div className="crash-bet-zone">
          <button type="button" className="crash-bet-btn">
            Сделать ставку
          </button>
        </div>

        <div className="crash-live-block">
          <div className="crash-live-title">Live ставки</div>

          <div className="crash-live-list">
            {mockPlayers.map((player) => {
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
                    <span>{player.bet}</span>
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
