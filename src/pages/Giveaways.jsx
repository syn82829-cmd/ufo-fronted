import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { getReferralState } from "../api"
import { useUser } from "../context/UserContext"
import { triggerHaptic } from "../utils/haptics"
import friendsAnimation from "../assets/animations/frms.json"
import zarAnimation from "../assets/animations/zar.json"
import vivAnimation from "../assets/animations/viv.json"
import "../style.css"

const BOT_USERNAME = String(import.meta.env.VITE_BOT_USERNAME || "AuraCasesBot").replace(/^@/, "")

function formatNumber(value) {
  return String(Number(value || 0))
}

function Giveaways() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [referralState, setReferralState] = useState(null)
  const [copied, setCopied] = useState(false)

  const referralCode = referralState?.referralCode || "--------"
  const totalEarned = formatNumber(referralState?.totalEarned)
  const withdrawn = formatNumber(referralState?.withdrawn)
  const available = formatNumber(referralState?.available)

  useEffect(() => {
    let cancelled = false

    async function loadReferralState() {
      if (!user?.id || user.id === "—") return

      try {
        const data = await getReferralState(user.id)
        if (!cancelled) {
          setReferralState(data)
        }
      } catch (error) {
        console.error("REFERRAL STATE LOAD ERROR:", error)
      }
    }

    loadReferralState()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  const copyReferralCode = async () => {
    if (!referralCode || referralCode === "--------") return

    try {
      triggerHaptic("light")
      await navigator.clipboard?.writeText(referralCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch (error) {
      console.error("COPY REFERRAL CODE ERROR:", error)
    }
  }

  const inviteFriend = () => {
    if (!referralCode || referralCode === "--------") return

    triggerHaptic("light")

    const referralLink = `https://t.me/${BOT_USERNAME}?start=ref_${encodeURIComponent(referralCode)}`
    const text = "Открывай бесплатный кейс каждый день!\n\nЗаходи и выбивай звёзды и подарки в бесплатном кейсе 💙"
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`
    const tg = window.Telegram?.WebApp

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl)
      return
    }

    window.open(shareUrl, "_blank")
  }

  return (
    <div className="app">
      <div className="friends-page">
        <button
          type="button"
          className="friends-hero-badge"
        >
          <span className="friends-hero-badge-text">
            ЗАРАБАТЫВАЙ С GIFTON
          </span>
        </button>

        <div className="friends-hero-visual">
          <Lottie
            animationData={friendsAnimation}
            loop
            autoplay
            className="friends-hero-lottie"
          />
        </div>

        <div className="friends-hero-text">
          Приглашай друзей и получай 15% с их пополнений на свой баланс!
        </div>

        <button
          type="button"
          className="friends-invite-btn"
          onClick={inviteFriend}
        >
          Пригласить друга
        </button>

        <div className="friends-stats-grid">
          <div className="friends-stat-card">
            <div className="friends-stat-top">
              <div className="friends-stat-lottie-wrap">
                <Lottie
                  animationData={zarAnimation}
                  loop
                  autoplay
                  className="friends-stat-lottie"
                />
              </div>

              <span className="friends-stat-value">{totalEarned}</span>
            </div>

            <div className="friends-stat-label">
              Всего заработано
            </div>
          </div>

          <div className="friends-stat-card">
            <div className="friends-stat-top">
              <div className="friends-stat-lottie-wrap">
                <Lottie
                  animationData={vivAnimation}
                  loop
                  autoplay
                  className="friends-stat-lottie"
                />
              </div>

              <span className="friends-stat-value">{withdrawn}</span>
            </div>

            <div className="friends-stat-label">
              Выведено
            </div>
          </div>
        </div>

        <div className="friends-withdraw-card">
          <div className="friends-withdraw-top">
            <div className="friends-withdraw-title-row">
              <img
                src="/ui/star.PNG"
                alt=""
                className="friends-withdraw-star"
                draggable={false}
              />
              <span className="friends-withdraw-value">{available}</span>
            </div>

            <div className="friends-withdraw-label">
              Доступно для вывода
            </div>
          </div>

          <button
            type="button"
            className="friends-withdraw-btn"
            disabled
          >
            Вывести
          </button>
        </div>

        <div className="friends-referral-section">
          <div className="friends-referral-title">
            Реферальный промокод
          </div>

          <div className="friends-referral-card">
            <button
              type="button"
              className="friends-referral-code-row"
              onClick={copyReferralCode}
            >
              <span className="friends-referral-code">
                {referralCode}
              </span>

              <span className="friends-referral-edit" aria-hidden="true">
                ✎
              </span>
            </button>

            <div className="friends-referral-bonus">
              <span className="friends-referral-bonus-line">
                При оплате с вашим промокодом
              </span>
              <span className="friends-referral-bonus-line">
                друг получит
                <span className="friends-referral-star-bonus">
                  +50
                  <img
                    src="/ui/star.PNG"
                    alt=""
                    className="friends-referral-star"
                    draggable={false}
                  />
                </span>
              </span>
              <span className="friends-referral-bonus-line">
                и станет вашим рефералом
              </span>
            </div>

            <div className="friends-referral-hint">
              {copied ? "Промокод скопирован" : "Нажмите на код, чтобы скопировать"}
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-nav-shell">
        <div className="bottom-nav">
          <div
            className="nav-item"
            onClick={() => navigate("/bonus")}
          >
            <img src="/ui/cupnav.PNG" alt="" className="nav-icon" />
            <span>Награды</span>
          </div>

          <div className="nav-item active">
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
    </div>
  )
}

export default Giveaways
