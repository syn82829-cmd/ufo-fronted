import { useEffect, useRef, useState } from "react"
import { CRASH_WAITING_MS } from "../utils/crashMath"

export function useCrashDisplay(crashState) {
  const [displayMultiplier, setDisplayMultiplier] = useState(1)
  const [displayCountdown, setDisplayCountdown] = useState(null)
  const [showStartText, setShowStartText] = useState(false)

  const animationFrameRef = useRef(null)
  const roundRef = useRef(null)

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (!crashState) {
      roundRef.current = null
      setDisplayMultiplier(1)
      setDisplayCountdown(null)
      setShowStartText(false)
      return
    }

    const {
      status,
      roundNumber,
      serverTime,
      countdownStartedAt,
      crashPoint,
      multiplier,
      countdown,
    } = crashState

    roundRef.current = roundNumber

    const serverNow = serverTime ? new Date(serverTime).getTime() : Date.now()
    const localNow = Date.now()
    const offsetMs = localNow - serverNow

    if (status === "waiting") {
      setDisplayMultiplier(1)

      const countdownStartMs = countdownStartedAt
        ? new Date(countdownStartedAt).getTime()
        : null

      const updateWaiting = () => {
        if (roundRef.current !== roundNumber) return

        if (!countdownStartMs) {
          setDisplayCountdown(countdown ?? null)
          setShowStartText(false)
          animationFrameRef.current = requestAnimationFrame(updateWaiting)
          return
        }

        const correctedNow = Date.now() - offsetMs
        const elapsedMs = Math.max(0, correctedNow - countdownStartMs)
        const remainingMs = Math.max(0, CRASH_WAITING_MS - elapsedMs)

        if (remainingMs <= 120) {
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
      setDisplayMultiplier(Number(multiplier || 1))
      return
    }

    if (status === "crashed") {
      setDisplayCountdown(null)
      setShowStartText(false)
      setDisplayMultiplier(Number(crashPoint || multiplier || 1))
      return
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
