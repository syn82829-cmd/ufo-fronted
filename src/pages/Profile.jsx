import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { createUser } from "../api"
import "../style.css"

function Profile() {

  const navigate = useNavigate()

  const [user, setUser] = useState({
    id: "—",
    username: "Гость",
    balance: 0
  })


  /* ============================= */
  /* INIT USER */
  /* ============================= */

  useEffect(() => {

    async function initUser() {

      let tgUser = null

      if (window.Telegram?.WebApp) {

        const tg = window.Telegram.WebApp

        tg.ready()
        tg.expand()

        tgUser = tg.initDataUnsafe?.user

      }

      // fallback for dev
      if (!tgUser) {

        tgUser = {
          id: 999999999,
          username: "test_user"
        }

      }

      try {

        const dbUser = await createUser({
          id: tgUser.id,
          username: tgUser.username || ""
        })

        setUser({
          id: dbUser.telegram_id,
          username: dbUser.username || "Гость",
          balance: dbUser.balance ?? 0
        })

      } catch (err) {

        console.error("PROFILE INIT ERROR:", err)

      }

    }

    initUser()

  }, [])


  /* ============================= */
  /* UI */
  /* ============================= */

  return (
    <div className="app">

      <div className="profile-page">

        {/* PROFILE CARD */}
        <div className="profile-card">

          <div className="profile-avatar">
            👽
          </div>


          {/* FIXED CONTAINER */}
          <div className="profile-info">

            <div className="profile-name">
              {user.username}
            </div>

            <div className="profile-id">
              ID: {user.id}
            </div>

          </div>


          {/* BALANCE RIGHT SIDE */}
          <div className="profile-balance">
            {user.balance} ⭐️
          </div>

        </div>


        {/* ACTION BUTTONS */}
        <div className="profile-actions">

          <button className="deposit-btn large">
            Пополнить
          </button>

          <button className="withdraw-btn large">
            Вывести
          </button>

        </div>


        {/* INVENTORY */}
        <div className="inventory-wrapper">

          <div className="inventory-block">

            <div className="inventory-empty">
              В инвентаре пока пусто
            </div>

          </div>

        </div>

      </div>


      {/* BOTTOM NAV */}
      <div className="bottom-nav">

        <div
          className="nav-item"
          onClick={() => navigate("/bonus")}
        >
          Бонусы
        </div>

        <div
          className="nav-item"
          onClick={() => navigate("/giveaways")}
        >
          Розыгрыши
        </div>

        <div
          className="nav-item"
          onClick={() => navigate("/")}
        >
          Главная
        </div>

        <div className="nav-item active">
          Профиль
        </div>

      </div>

    </div>
  )

}

export default Profile
