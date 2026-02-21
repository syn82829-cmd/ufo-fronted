import './style.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// 🔥 Блокируем любые submit'ы (они вызывают reload → Not Found на /case/...)
document.addEventListener(
  'submit',
  (e) => {
    e.preventDefault()
    e.stopPropagation()
  },
  true
)

// 🔥 На всякий — блокируем клики по <a href=""> если вдруг где-то есть
document.addEventListener(
  'click',
  (e) => {
    const a = e.target?.closest?.('a')
    if (a && a.getAttribute('href')) {
      // если это якорь или внешний линк — оставим как есть
      const href = a.getAttribute('href')
      if (href.startsWith('#') || href.startsWith('http')) return

      // иначе это может перезагрузить SPA-роут
      e.preventDefault()
      e.stopPropagation()
    }
  },
  true
)

if (window.Telegram && window.Telegram.WebApp) {
  window.Telegram.WebApp.ready()
  window.Telegram.WebApp.expand()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
