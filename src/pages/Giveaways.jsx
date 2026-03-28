import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { useUser } from "../context/UserContext"
import friendsAnimation from "../assets/animations/frms.json"
import zarAnimation from "../assets/animations/zar.json"
import vivAnimation from "../assets/animations/viv.json"
import "../style.css"

function Giveaways() {
  const navigate = useNavigate()
  const { user } = useUser()

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

              <span className="friends-stat-value">0</span>
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
    </div>
  )
}

export default Giveaways
