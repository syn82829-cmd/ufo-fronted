import './style.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

const initTelegram = async () => {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp

    tg.ready()
    tg.expand()

    console.log("Telegram WebApp detected")

    const user = tg.initDataUnsafe?.user

    if (user) {
      console.log("TG USER:", user)

      try {
        const res = await fetch("https://ufo-backend-1.onrender.com/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: user.id,
            username: user.username || ""
          })
        })

        const data = await res.json()
        console.log("User created:", data)
      } catch (err) {
        console.error("Backend error:", err)
      }
    } else {
      console.log("Telegram user NOT found")
    }

  } else {
    console.log("Telegram WebApp NOT available")
  }
}

initTelegram()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
