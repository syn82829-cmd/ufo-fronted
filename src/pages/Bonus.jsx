import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { checkBonusChannel, getBonusState, getReferralState, prepareReferralShare, reserveBonusGift } from "../api"
import { useUser } from "../context/UserContext"
import { triggerHaptic } from "../utils/haptics"
import DepositMenu from "../components/DepositMenu"
import podarokAnimation from "../assets/animations/podarok.json"
import "../style.css"

const BONUS_REWARD_STORAGE_KEY = "ufo_bonus_reserved_reward"
const BOT_USERNAME = String(import.meta.env.VITE_BOT_USERNAME || "giftsonbot").replace(/^@/, "")
const CHANNEL_URL = "https://t.me/giftonchanneI"
const SHARE_CACHE_PREFIX = "gifton_share_"

const bonusTasks = [
  { id: "invite_friend", title: "Пригласите друга", reward: 3, iconSrc: "/ui/ref.webp" },
  { id: "subscribe_channel", title: "Подпишитесь на канал", reward: 2, iconSrc: "/ui/ch.webp" },
  { id: "vote_channel", title: "Проголосуйте за канал", reward: 2, iconSrc: "/ui/golos.webp" },
]

function Bonus() {
  const navigate = useNavigate()
  const { user } = useUser()
  const reserveInFlightRef = useRef(false)
  const shareInFlightRef = useRef(null)

  const [bonusState, setBonusState] = useState(null)
  const [referralCode, setReferralCode] = useState("")
  const [preparedShare, setPreparedShare] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isShareLoading, setIsShareLoading] = useState(false)
  const [isDepositOpen, setIsDepositOpen] = useState(false)

  useEffect(() => {
    async function loadBonusState() {
      if (!user?.id || user.id === "—") {
        setIsLoading(false)
        return
      }

      try {
        const [bonusData, referralData] = await Promise.all([
          getBonusState(user.id),
          getReferralState(user.id),
        ])

        setBonusState(bonusData)
        setReferralCode(referralData?.referralCode || "")
      } catch (err) {
        console.error("BONUS STATE LOAD ERROR:", err)
        setBonusState(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadBonusState()
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || user.id === "—" || !referralCode) return
    if (!window.Telegram?.WebApp?.shareMessage) return

    try {
      const cached = JSON.parse(localStorage.getItem(`${SHARE_CACHE_PREFIX}${referralCode}`) || "null")
      if (cached?.id) {
        setPreparedShare(cached)
        return
      }
    } catch {}

    let cancelled = false
    setIsShareLoading(true)

    const promise = prepareReferralShare({ telegram_id: user.id, referral_code: referralCode })
    shareInFlightRef.current = promise

    promise
      .then((prepared) => {
        if (cancelled) return

        if (prepared?.ok && prepared?.preparedInlineMessageId) {
          const share = { id: prepared.preparedInlineMessageId, fallbackText: prepared.fallbackText || "" }
          setPreparedShare(share)
          try {
            localStorage.setItem(`${SHARE_CACHE_PREFIX}${referralCode}`, JSON.stringify(share))
          } catch {}
        } else {
          setPreparedShare({ id: null, fallbackText: prepared?.fallbackText || "" })
        }
      })
      .catch((err) => console.error("BONUS SHARE PRELOAD ERROR:", err))
      .finally(() => {
        if (!cancelled) setIsShareLoading(false)
        if (shareInFlightRef.current === promise) shareInFlightRef.current = null
      })

    return () => {
      cancelled = true
    }
  }, [user?.id, referralCode])

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

  const openInviteShare = () => {
    if (!referralCode) return
    if (window.Telegram?.WebApp?.shareMessage && !preparedShare?.id) return

    triggerHaptic("light")

    const tg = window.Telegram?.WebApp
    if (tg?.shareMessage && preparedShare?.id) {
      tg.shareMessage(preparedShare.id)
      return
    }

    const referralLink = `https://t.me/${BOT_USERNAME}?start=ref_${encodeURIComponent(referralCode)}`
    const text = preparedShare?.fallbackText || "Забирай бесплатный подарок каждый день!\n\nОткрывай кейсы и выигрывай NFT💙"
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`

    if (tg?.openTelegramLink) tg.openTelegramLink(shareUrl)
    else window.open(shareUrl, "_blank")
  }

  const checkChannelAfterOpen = () => {
    if (!user?.id || user.id === "—") return

    window.setTimeout(() => {
      checkBonusChannel(user.id)
        .then((result) => {
          setBonusState((prev) => ({
            ...(prev || {}),
            channelSubscribed: Boolean(result?.channelSubscribed),
          }))
        })
        .catch((err) => console.error("BONUS CHANNEL CHECK ERROR:", err))
    }, 900)
  }

  const openChannelTask = () => {
    triggerHaptic("light")
    const tg = window.Telegram?.WebApp

    if (tg?.openTelegramLink) tg.openTelegramLink(CHANNEL_URL)
    else window.open(CHANNEL_URL, "_blank")

    checkChannelAfterOpen()
  }

  const handleTaskClick = (taskId) => {
    if (taskId === "invite_friend") {
      openInviteShare()
      return
    }

    openChannelTask()
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
          {bonusTasks.map((task) => {
            const disabled = task.id === "invite_friend" && window.Telegram?.WebApp?.shareMessage && (!preparedShare?.id || isShareLoading)

            return (
              <button
                key={task.id}
                type="button"
                className={`bonus-task-card ${disabled ? "disabled" : ""}`}
                onClick={() => handleTaskClick(task.id)}
                disabled={disabled}
              >
                <img src={task.iconSrc} alt="" className="bonus-task-icon" draggable={false} />
                <span className="bonus-task-title">{task.title}</span>
                <span className="bonus-task-reward">
                  <img src="/ui/star.PNG" alt="" className="bonus-task-star" draggable={false} />
                  <span>+{task.reward}</span>
                </span>
              </button>
            )
          })}
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
