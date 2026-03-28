import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { useUser } from "../context/UserContext"
import DepositMenu from "../components/DepositMenu"
import friendsAnimation from "../assets/animations/frms.json"
import "../style.css"

function Giveaways() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [isDepositOpen, setIsDepositOpen] = useState(false)

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

      <div className="friends-page">
        <button
          type="button"
          className="friends-hero-badge"
        >
          ЗАРАБАТЫВАЙ С UFOMO
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
          Приглашай друзей и получай 15% с их пополнения на свой баланс
        </div>

        <button
          type="button"
          className="friends-invite-btn"
        >
          Пригласить друга
        </button>

        <div className="friends-stats-grid">
          <div className="friends-stat-card">
            <div className="friends-stat-top">
              <img
                src="/ui/ref-total.png"
                alt=""
                className="friends-stat-icon"
                draggable={false}
              />
              <span className="friends-stat-value">0</span>
            </div>

            <div className="friends-stat-label">
              Всего заработано
            </div>
          </div>

          <div className="friends-stat-card">
            <div className="friends-stat-top">
              <img
                src="/ui/ref-withdrawn.png"
                alt=""
                className="friends-stat-icon"
                draggable={false}
              />
              <span className="friends-stat-value">0</span>
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
              <span className="friends-withdraw-value">0</span>
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

      <DepositMenu
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
      />
    </div>
  )
}

export default Giveaways
