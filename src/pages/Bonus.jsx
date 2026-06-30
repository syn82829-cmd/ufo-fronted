import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { getBonusState, reserveBonusGift } from "../api"
import { useUser } from "../context/UserContext"
import DepositMenu from "../components/DepositMenu"
import podarokAnimation from "../assets/animations/podarok.json"
import "../style.css"

const BONUS_REWARD_STORAGE_KEY = "ufo_bonus_reserved_reward"

const bonusTasks = [
  { id: "invite_friend", title: "Пригласите друга", reward: 3, iconSrc: "/ui/ref.webp" },
  { id: "subscribe_channel", title: "Подпишитесь на канал", reward: 2, iconSrc: "/ui/ch.webp" },
  { id: "vote_channel", title: "Проголосуйте за канал", reward: 2, iconSrc: "/ui/golos.webp" },
]

function Bonus() {
  const navigate = useNavigate()
  const { user } = useUser()
  const reserveInFlightRef = useRef(false)

  const [bonusState, setBonusState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDepositOpen, setIsDepositOpen] = useState(false)

  useEffect(() => {
    async function loadBonusState() {
      if (!user?.id || user.id === "—") {
        setIsLoading(false)
        return
      }

      try {
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

  const claimedCount = Number(bonusState?.claimedCount ?? bonusState?.campaignClaimedCount ?? bonusState?.totalClaimed ?? 0) || 0
  const claimedLimit = Number(bonusState?.claimedLimit ?? bonusState?.campaignClaimedLimit ?? bonusState?.totalLimit ?? 500) || 500
  const progressPercent = claimedLimit > 0 ? Math.min((claimedCount / claimedLimit) * 100, 100) : 0

  const hasReservedReward = (() => {
    if (bonusState?.dailyGiftReservedToday) return true

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

  const handleReserveGift = () => {
    if (!user?.id || reserveInFlightRef.current || hasReservedReward) return

    reserveInFlightRef.current = true

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

    try {
      localStorage.setItem(BONUS_REWARD_STORAGE_KEY, JSON.stringify(rewardItem))
    } catch {}

    setBonusState((prev) => ({
      ...(prev || {}),
      claimedCount: Math.min(claimedCount + 1, claimedLimit),
      claimedLimit,
      dailyGiftReservedToday: true,
    }))

    navigate("/profile")

    reserveBonusGift(user.id)
      .then((reserveResult) => {
        setBonusState((prev) => ({
          ...(prev || {}),
          claimedCount: Number(reserveResult?.claimedCount ?? claimedCount + 1),
          claimedLimit: Number(reserveResult?.claimedLimit ?? claimedLimit),
          dailyGiftReservedToday: true,
        }))
      })
      .catch((err) => {
        console.error("BONUS RESERVE ERROR:", err)
      })
      .finally(() => {
        reserveInFlightRef.current = false
      })
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
          <button type="button" className="home-topbar-plus" onClick={() => setIsDepositOpen(true)}>
            +
          </button>
        </div>
      </div>

      <div className="bonus-page">
        <div className="bonus-section-heading">Ежедневный подарок</div>

        <div className="bonus-card">
          <div className="bonus-card-visual">
            <Lottie animationData={podarokAnimation} loop autoplay className="bonus-gift-lottie" />
          </div>

          <div className="bonus-event-title">Пригласи друга — получи подарок</div>

          <div className="bonus-event-subtitle">
            Друг должен открыть любой кейс. Подарок можно как вывести так и обменять на звезды. Только раз в день!
          </div>

          <div className="bonus-event-progress">
            <div className="bonus-event-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="bonus-event-progress-meta">
            <span>Получено</span>
            <span>{claimedCount}/{claimedLimit}</span>
          </div>

          <button
            type="button"
            className="bonus-open-sheet-btn"
            onClick={handleReserveGift}
            disabled={isLoading || hasReservedReward}
          >
            {hasReservedReward ? "Подарок уже в инвентаре" : "Получить подарок"}
          </button>
        </div>

        <div className="bonus-section-heading bonus-tasks-heading">Задания</div>

        <div className="bonus-tasks-list">
          {bonusTasks.map((task) => (
            <button key={task.id} type="button" className="bonus-task-card">
              <img src={task.iconSrc} alt="" className="bonus-task-icon" draggable={false} />
              <span className="bonus-task-title">{task.title}</span>
              <span className="bonus-task-reward">
                <img src="/ui/star.PNG" alt="" className="bonus-task-star" draggable={false} />
                <span>+{task.reward}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bottom-nav-shell">
        <div className="bottom-nav">
          <div className="nav-item active">
            <img src="/ui/cupnav.PNG" alt="" className="nav-icon" />
            <span>Награды</span>
          </div>

          <div className="nav-item" onClick={() => navigate("/giveaways")}>
            <img src="/ui/frnav.PNG" alt="" className="nav-icon" />
            <span>Друзья</span>
          </div>

          <div className="nav-item" onClick={() => navigate("/")}>
            <img src="/ui/main.PNG" alt="" className="nav-icon" />
            <span>Главная</span>
          </div>
        </div>

        <div className="floating-profile" onClick={() => navigate("/profile")}>
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

      <DepositMenu isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />
    </div>
  )
}

export default Bonus
