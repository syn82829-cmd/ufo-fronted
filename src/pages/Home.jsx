import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { createUser } from "../api"
import CaseCard from "../components/CaseCard"
import "../style.css"

function Home() {

  const navigate = useNavigate()

  const [user, setUser] = useState({
    id: "—",
    username: "Гость",
    balance: 0
  })

  const cases = [
  { id: "firstpepe", image: "/cases/case1.png.PNG", name: "First Pepe", price: 9999 },
  { id: "crash", image: "/cases/case2.png.PNG", name: "Crash", price: 7999 },
  { id: "darkmatter", image: "/cases/case3.png.PNG", name: "Dark Matter", price: 4999 },
  { id: "godparticle", image: "/cases/case4.png.PNG", name: "God Particle", price: 3599 },
  { id: "purplehole", image: "/cases/case5.png.PNG", name: "Purple Hole", price: 1599 },
  { id: "spacetrash", image: "/cases/case6.png.PNG", name: "Space Trash", price: 599 },
  { id: "starfall", image: "/cases/case7.png.PNG", name: "Starfall", price: 499 },
  { id: "random", image: "/cases/case8.png.PNG", name: "Random Case", price: 999 }
]

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

        console.error("INIT USER ERROR:", err)

      }

    }

    initUser()

  }, [])

  /* ============================= */
  /* UI */
  /* ============================= */

  return (
    <div className="app">

      {/* UFO Crash */}
      <div
        className="crash-panel"
        onClick={() => navigate("/crash")}
      >
        <div className="crash-title">UFO Crash</div>
        <div className="multiplier">&gt; x1.63</div>

        <button className="launch-btn">
          Запустить НЛО
        </button>

        <img
          src="/ufo.png.PNG"
          className="ufo-image"
          alt=""
        />
      </div>

      {/* Cases */}
      <div className="cases-section">

        {cases.map(item => (

          <CaseCard
            key={item.id}
            caseItem={item}
            onClick={() => navigate(`/case/${item.id}`)}
          />

        ))}

      </div>

      {/* Bottom nav */}
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
          className="nav-item active"
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

    </div>
  )
}

export default Home
