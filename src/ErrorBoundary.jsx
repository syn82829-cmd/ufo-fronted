import React from "react"

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error("🔥 UI Crash:", error)
    console.error("📌 Component stack:", info?.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app" style={{ padding: 20 }}>
          <div style={{ opacity: 0.85, marginBottom: 10 }}>
            Произошла ошибка в интерфейсе (не роутинг).
          </div>

          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.7 }}>
            {String(this.state.error)}
          </pre>

          <button
            type="button"
            style={{ marginTop: 12 }}
            onClick={() => window.location.reload()}
          >
            Перезагрузить
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
