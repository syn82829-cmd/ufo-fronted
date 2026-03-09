import "./style.css"
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import ErrorBoundary from "./ErrorBoundary"
import { UserProvider } from "./context/UserContext"

try {
  const tg = window.Telegram?.WebApp

  if (tg) {
    tg.ready()
    tg.expand()
    tg.requestFullscreen?.()
    tg.disableVerticalSwipes?.()
  }
} catch (err) {
  console.error("Telegram WebApp init error:", err)
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <UserProvider>
        <App />
      </UserProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
