export function triggerHaptic(type = "light") {
  const tg = window.Telegram?.WebApp

  if (!tg?.HapticFeedback) return

  if (type === "light") {
    tg.HapticFeedback.impactOccurred("light")
    return
  }

  if (type === "medium") {
    tg.HapticFeedback.impactOccurred("medium")
    return
  }

  if (type === "heavy") {
    tg.HapticFeedback.impactOccurred("heavy")
    return
  }

  if (type === "success") {
    tg.HapticFeedback.notificationOccurred("success")
    return
  }

  if (type === "error") {
    tg.HapticFeedback.notificationOccurred("error")
  }
}
