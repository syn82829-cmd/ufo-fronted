import { useState, useEffect } from 'react'
import './style.css'

function App() {

  const [activeTab, setActiveTab] = useState('Главная')

  const [user, setUser] = useState({
    id: '—',
    username: 'Гость',
    balance: 0
  })

  const cases = [
    { id: 1, image: "/cases/case1.png.PNG", name: "First Pepe", price: "9999 ⭐️" },
    { id: 2, image: "/cases/case2.png.PNG", name: "Crash", price: "7999 ⭐️" },
    { id: 3, image: "/cases/case3.png.PNG", name: "Dark Matter", price: "4999 ⭐️" },
    { id: 4, image: "/cases/case4.png.PNG", name: "God Particle", price: "3599 ⭐️" },
    { id: 5, image: "/cases/case5.png.PNG", name: "Purple Hole", price: "1599 ⭐️" },
    { id: 6, image: "/cases/case6.png.PNG", name: "Space Trash", price: "599 ⭐️" },
    { id: 7, image: "/cases/case7.png.PNG", name: "Starfall", price: "499 ⭐️" },
    { id: 8, image: "/cases/case8.png.PNG", name: "Random Case", price: "999 ⭐️" }
  ]

  const tabs = ['Бонусы', 'Розыгрыши', 'Главная', 'Профиль']


  /* ============================= */
  /* TELEGRAM INIT */
  /* ============================= */

  useEffect(() => {

    if (window.Telegram && window.Telegram.WebApp) {

      const tg = window.Telegram.WebApp

      tg.expand()

      const tgUser = tg.initDataUnsafe?.user

      if (tgUser) {

        setUser({
          id: tgUser.id,
          username: tgUser.username || tgUser.first_name || 'User',
          balance: 0
        })

      }

    }

  }, [])



  /* ============================= */
  /* UI */
  /* ============================= */

  return (
    <div className="app">


      {/* ============================= */}
      {/* HOME */}
      {/* ============================= */}

      {activeTab === 'Главная' && (
        <>
          <div className="crash-panel">

            <div className="crash-title">
              UFO Crash
            </div>

            <div className="multiplier">
              &gt; x1.63
            </div>

            <button className="launch-btn">
              Запустить НЛО
            </button>

            <img
              src="/ufo.png.PNG"
              className="ufo-image"
              alt=""
            />

          </div>


          <div className="cases-section">

            {cases.map(caseItem => (
              <div className="case-card" key={caseItem.id}>

                <div className="case-title">
                  {caseItem.name}
                </div>

                <img
                  src={caseItem.image}
                  className="case-image"
                  alt=""
                />

                <div className="case-price-badge">
                  {caseItem.price}
                </div>

              </div>
            ))}

          </div>
        </>
      )}



      {/* ============================= */}
      {/* PROFILE */}
      {/* ============================= */}

      {activeTab === 'Профиль' && (

        <div className="profile-page">


          {/* PROFILE CARD */}
          <div className="profile-card">


            {/* AVATAR */}
            <div className="profile-avatar">
              👽
            </div>


            {/* USER INFO */}
            <div className="profile-text">

              <div className="profile-name">
                {user.username}
              </div>

              <div className="profile-id">
                ID: {user.id}
              </div>

            </div>



            {/* BALANCE BLOCK */}
            <div className="profile-balance-block">

              <div className="profile-balance-row">

                <div className="profile-balance-label">
                  Баланс
                </div>

                <div className="profile-balance">
                  {user.balance} ⭐️
                </div>

              </div>

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


        </div>

      )}



      {/* ============================= */}
      {/* BONUS / RAFFLES */}
      {/* ============================= */}

      {(activeTab === 'Бонусы' || activeTab === 'Розыгрыши') && (

        <div className="empty-page">

          <div className="empty-glass">
            {activeTab} — скоро 🚀
          </div>

        </div>

      )}



      {/* ============================= */}
      {/* BOTTOM NAV */}
      {/* ============================= */}

      <div className="bottom-nav">

        {tabs.map(tab => (

          <div
            key={tab}
            className={`nav-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>

        ))}

      </div>


    </div>
  )
}

export default App
