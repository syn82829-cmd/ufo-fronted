import { useNavigate } from "react-router-dom"
import { useUser } from "../context/UserContext"
import "../style.css"

function Profile() {
  const navigate = useNavigate()
  const { user } = useUser()

  return (
    <div className="app">
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-avatar">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.username}
                className="profile-avatar-image"
                draggable={false}
              />
            ) : (
              <span className="profile-avatar-fallback">
                {(user.username?.[0] || "G").toUpperCase()}
              </span>
            )}
          </div>

          <div className="profile-info">
            <div className="profile-name">{user.username}</div>
            <div className="profile-id">ID: {user.id}</div>
          </div>

          <div className="profile-balance">
            <span className="profile-balance-value">{user.balance}</span>
            <img src="/ui/star.PNG" className="profile-balance-icon" alt="" />
          </div>
        </div>

        <div className="profile-actions">
          <button className="deposit-btn large">Пополнить</button>
          <button className="withdraw-btn large">Вывести</button>
        </div>

        <div className="inventory-wrapper">
          <div className="inventory-block">
            <div className="inventory-empty">В инвентаре пока пусто</div>
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

        <div className="nav-item active">Профиль</div>
      </div>
    </div>
  )
}

export default Profile
