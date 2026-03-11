import { useEffect, useRef, useState } from "react"

const CRASH_WAITING_MS = 5000

function getMultiplierByElapsedMs(elapsedMs) {
  const elapsed = Math.max(0, elapsedMs) / 1000
  return +Math.exp(0.14 * elapsed).toFixed(2)
}

export function useCrashDisplay(crashState) {
  const [displayMultiplier, setDisplayMultiplier] = useState(1)
  const [displayCountdown, setDisplayCountdown] = useState(null)
  const [showStartText, setShowStartText] = useState(false)

  const animationFrameRef = useRef(null)

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (!crashState) {
      setDisplayMultiplier(1)
      setDisplayCountdown(null)
      setShowStartText(false)
      return
    }

    const status = crashState.status

    if (status === "waiting") {
      setDisplayMultiplier(1)

      const serverNow = crashState.serverTime
        ? new Date(crashState.serverTime).getTime()
        : Date.now()

      const localNow = Date.now()
      const offsetMs = localNow - serverNow

      const countdownStartedAt = crashState.countdownStartedAt
        ? new Date(crashState.countdownStartedAt).getTime()
        : null

      const updateWaiting = () => {
        if (!countdownStartedAt) {
          setDisplayCountdown(crashState.countdown ?? null)
          setShowStartText(false)
          animationFrameRef.current = requestAnimationFrame(updateWaiting)
          return
        }

        const correctedNow = Date.now() - offsetMs
        const elapsedMs = Math.max(0, correctedNow - countdownStartedAt)
        const remainingMs = Math.max(0, CRASH_WAITING_MS - elapsedMs)

        if (remainingMs <= 250) {
          setDisplayCountdown(0)
          setShowStartText(true)
        } else {
          setDisplayCountdown(Math.ceil(remainingMs / 1000))
          setShowStartText(false)
        }

        animationFrameRef.current = requestAnimationFrame(updateWaiting)
      }

      updateWaiting()
      return
    }

    if (status === "flying") {
      setDisplayCountdown(null)
      setShowStartText(false)

      const flyingStartedAt = crashState.flyingStartedAt
        ? new Date(crashState.flyingStartedAt).getTime()
        : null

      const updateFlying = () => {
        if (!flyingStartedAt) {
          animationFrameRef.current = requestAnimationFrame(updateFlying)
          return
        }

        const elapsedMs = Date.now() - flyingStartedAt
        const animatedMultiplier = getMultiplierByElapsedMs(elapsedMs)

        setDisplayMultiplier(animatedMultiplier)
        animationFrameRef.current = requestAnimationFrame(updateFlying)
      }

      updateFlying()
      return
    }

    if (status === "crashed") {
      setDisplayCountdown(null)
      setShowStartText(false)
      setDisplayMultiplier(Number(crashState.crashPoint || crashState.multiplier || 1))
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [crashState])

  return {
    displayMultiplier,
    displayCountdown,
    showStartText,
  }
}
