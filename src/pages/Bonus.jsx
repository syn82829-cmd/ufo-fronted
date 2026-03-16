import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import {
  checkBonusChannel,
  claimBonus,
  getBonusState,
} from "../api"
import { useUser } from "../context/UserContext"
import { getPlayerRank } from "../utils/playerRank"
import DepositMenu from "../components/DepositMenu"
import podarokAnimation from "../assets/animations/podarok.json"
import "../style.css"

function Bonus() {
  const navigate = useNavigate()
  const { user, refreshUser } = useUser()

  const [bonusState, setBonusState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingChannel, setIsCheckingChannel] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isBonusSheetOpen, setIsBonusSheetOpen] = useState(false)

  const playerRank = useMemo(() => {
    return getPlayerRank(
      Number(user?.casesOpened || 0),
      Number(user?.crashGamesPlayed || 0)
    )
  }, [user?.casesOpened, user?.crashGamesPlayed])

  useEffect(() => {
    async function loadBonusState() {
      if (!user?.id || user.id === "—") {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const data = await getBonusState(user.id)
        setBonusState(data)
      } catch (err) {
        console.error("BONUS STATE LOAD ERROR:", err)
        setBonusState(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadBonusState()
  }, [user?.id])

  const handleOpenChannel = () => {
    const tg = window.Telegram?.WebApp

    if (tg?.openTelegramLink) {
      tg.openTelegramLink("https://t.me/ufomochannel")
      return
    }

    window.open("https://t.me/ufomochannel", "_blank")
  }

  const handleCheckChannel = async () => {
    if (!user?.id || isCheckingChannel) return

    try {
      setIsCheckingChannel(true)
      const result = await checkBonusChannel(user.id)

      setBonusState((prev) => ({
        ...(prev || {}),
        ...prev,
        channelSubscribed: Boolean(result?.channelSubscribed),
        conditionsMet: Boolean(result?.channelSubscribed) && Boolean(prev?.friendInvited),
        canClaim:
          Boolean(result?.channelSubscribed) &&
          Boolean(prev?.friendInvited) &&
          Number(prev?.timeLeftMs || 0) <= 0,
      }))
    } catch (err) {
      console.error("BONUS CHANNEL CHECK ERROR:", err)
    } finally {
      setIsCheckingChannel(false)
    }
  }

  const handleClaim = async () => {
    if (!user?.id || isClaiming || !bonusState?.canClaim) return

    try {
      setIsClaiming(true)

      await claimBonus(user.id)
      await refreshUser().catch(() => {})

      const updatedState = await getBonusState(user.id)
      setBonusState(updatedState)
      setIsBonusSheetOpen(false)
    } catch (err) {
      console.error("BONUS CLAIM ERROR:", err)
    } finally {
      setIsClaiming(false)
    }
  }

  const channelDone = Boolean(bonusState?.channelSubscribed)
  const friendDone = Boolean(bonusState?.friendInvited)
  const canClaim = Boolean(bonusState?.canClaim)

  const claimedCount =
    Number(
      bonusState?.claimedCount ??
      bonusState?.campaignClaimedCount ??
      bonusState?.totalClaimed ??
      0
    ) || 0

  const claimedLimit =
    Number(
      bonusState?.claimedLimit ??
      bonusState?.campaignClaimedLimit ??
      bonusState?.totalLimit ??
      500
    ) || 500

  const progressPercent =
    claimedLimit > 0 ? Math.min((claimedCount / claimedLimit) * 100, 100) : 0

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
            onClick={() => setIsDepositOpen(true)}
          >
            +
          </button>
        </div>
      </div>

      <div className="bonus-page">
        <div className="case-drops-heading">
          Награды
        </div>

        <div className="bonus-card">
          <div className="bonus-card-visual">
            <Lottie
              animationData={podarokAnimation}
              loop
              autoplay
              className="bonus-gift-lottie"
            />
          </div>

          <div className="bonus-event-title">
            Пригласи друга - забери подарок
          </div>

          <div className="bonus-event-subtitle">
            Друг должен открыть любой кейс. Подарок можно вывести или обменять на звезды!
          </div>

          <div className="bonus-event-progress">
            <div
              className="bonus-event-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="bonus-event-progress-meta">
            <span>Получено</span>
            <span>{claimedCount}/{claimedLimit}</span>
          </div>

          {isLoading ? (
            <div className="bonus-loading">
              Загрузка бонуса...
            </div>
          ) : (
            <button
              type="button"
              className="bonus-open-sheet-btn"
              onClick={() => setIsBonusSheetOpen(true)}
            >
              Забрать подарок
            </button>
          )}
        </div>
      </div>

      {isBonusSheetOpen && (
        <div
          className="bonus-sheet-overlay"
          onClick={() => setIsBonusSheetOpen(false)}
        >
          <div
            className="bonus-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bonus-sheet-handle" />

            <div className="bonus-sheet-title">
              Условия получения
            </div>

            <div className="bonus-conditions-list">
              <div className="bonus-condition-row">
                <div className="bonus-condition-left">
                  <button
                    type="button"
                    className={`bonus-check-circle ${channelDone ? "done" : ""}`}
                    onClick={handleCheckChannel}
                    disabled={isCheckingChannel}
                  >
                    {channelDone ? "✓" : ""}
                  </button>

                  <div className="bonus-condition-text-wrap">
                    <div className="bonus-condition-text">
                      Подписаться на канал @ufomochannel
                    </div>

                    {!channelDone && (
                      <button
                        type="button"
                        className="bonus-link-btn"
                        onClick={handleOpenChannel}
                      >
                        Открыть канал
                      </button>
                    )}
                  </div>
                </div>

                <div className="bonus-condition-progress">
                  {channelDone ? "1/1" : "0/1"}
                </div>
              </div>

              <div className="bonus-condition-row">
                <div className="bonus-condition-left">
                  <div className={`bonus-check-circle ${friendDone ? "done" : ""}`}>
                    {friendDone ? "✓" : ""}
                  </div>

                  <div className="bonus-condition-text-wrap">
                    <div className="bonus-condition-text">
                      Пригласить друга
                    </div>
                  </div>
                </div>

                <div className="bonus-condition-progress">
                  {friendDone ? "1/1" : "0/1"}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="bonus-claim-btn"
              onClick={handleClaim}
              disabled={!canClaim || isClaiming}
            >
              {isClaiming ? "Загрузка..." : canClaim ? "Забрать" : "Выполните условия"}
            </button>
          </div>
        </div>
      )}

      <div className="bottom-nav">
        <div className="nav-item active">
          Награды
        </div>

        <div
          className="nav-item"
          onClick={() => navigate("/giveaways")}
        >
          Друзья
        </div>

        <div
          className="nav-item"
          onClick={() => navigate("/")}
        >
          Главная
        </div>

        <div
          className="nav-item"
          onClick={() => navigate("/profile")}
        >
          Профиль
        </div>
      </div>

      <DepositMenu
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
      />
    </div>
  )
}

export default Bonus
