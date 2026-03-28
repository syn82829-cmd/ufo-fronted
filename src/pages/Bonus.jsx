import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { getBonusState } from "../api"
import { useUser } from "../context/UserContext"
import DepositMenu from "../components/DepositMenu"
import podarokAnimation from "../assets/animations/podarok.json"
import "../style.css"

const BONUS_REWARD_STORAGE_KEY = "ufo_bonus_reserved_reward"

function Bonus() {
  const navigate = useNavigate()
  const { user } = useUser()

  const [bonusState, setBonusState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isSavingReward, setIsSavingReward] = useState(false)

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

  const hasReservedReward = (() => {
    try {
      const raw = localStorage.getItem(BONUS_REWARD_STORAGE_KEY)
      if (!raw) return false

      const parsed = JSON.parse(raw)
      if (!parsed?.reservedUntil) return false

      return Number(parsed.reservedUntil) > Date.now()
    } catch {
      return false
    }
  })()

  const handleReserveGift = async () => {
    if (!user?.id || isSavingReward || hasReservedReward) return

    try {
      setIsSavingReward(true)

      const now = Date.now()
      const reservedUntil = now + 24 * 60 * 60 * 1000

      const rewardItem = {
        id: `bonus_podarok_${now}`,
        source: "bonus",
        dropId: "podarok",
        dropName: "Gift",
        png: "podarok",
        lottie: "/animations/spacetrash/podarok.json",
        priceStars: "25",
        priceGems: "0,15",
        status: "locked",
        createdAt: now,
        reservedUntil,
        conditions: {
          channelSubscribed: false,
          friendInvited: false,
        },
        ownerId: user.id,
      }

      localStorage.setItem(BONUS_REWARD_STORAGE_KEY, JSON.stringify(rewardItem))
      navigate("/profile")
    } catch (err) {
      console.error("BONUS RESERVE ERROR:", err)
    } finally {
      setIsSavingReward(false)
    }
  }

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
            Пригласи друга — получи подарок
          </div>

          <div className="bonus-event-subtitle">
            Друг должен открыть любой кейс. Подарок можно как вывести так и обменять на звезды. Только раз в день!
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
              onClick={handleReserveGift}
              disabled={isSavingReward || hasReservedReward}
            >
              {isSavingReward
                ? "Сохраняем..."
                : hasReservedReward
                  ? "Подарок уже в инвентаре"
                  : "Получить подарок"}
            </button>
          )}
        </div>
      </div>

      <div className="bottom-nav-shell">
        <div className="bottom-nav">
          <div className="nav-item active">
            <img src="/ui/cupnav.PNG" alt="" className="nav-icon" />
            <span>Награды</span>
          </div>

          <div
            className="nav-item"
            onClick={() => navigate("/giveaways")}
          >
            <img src="/ui/frnav.PNG" alt="" className="nav-icon" />
            <span>Друзья</span>
          </div>

          <div
            className="nav-item"
            onClick={() => navigate("/")}
          >
            <img src="/ui/main.PNG" alt="" className="nav-icon" />
            <span>Главная</span>
          </div>
        </div>

        <div
          className="floating-profile"
          onClick={() => navigate("/profile")}
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
    </div>
  )
}

export default Bonus
