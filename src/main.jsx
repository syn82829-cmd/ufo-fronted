import './style.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

if (window.Telegram) {
  window.Telegram.WebApp.ready()
  window.Telegram.WebApp.expand()

  const tg = window.Telegram.WebApp
  const user = tg.initDataUnsafe?.user

  if (user) {
    fetch("https://ufo-backend-1.onrender.com/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: user.id,
        username: user.username || ""
      })
    })
      .then(res => res.json())
      .then(data => console.log("User created:", data))
      .catch(err => console.error("Error:", err))
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
