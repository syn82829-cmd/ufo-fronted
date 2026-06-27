import { memo, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import Lottie from "lottie-react"

import { triggerHaptic } from "../../utils/haptics"
import { socket } from "../../socket"

function HomeCrashPanel() {
  const navigate = useNavigate()
  const ufoRef = useRef()

  const [ufoAnim, setUfoAnim] = useState(null)
  const [crashState, setCrashState] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadUfoAnim() {
      try {
        const res = await fetch("/animations/ufo.json")
        if (!res.ok) throw new Error(`Failed to load /animations/ufo.json: ${res.status}`)
        const data = await res.json()

        if (!cancelled) {
          setUfoAnim(data)
        }
      } catch (err) {
        console.error("UFO LOTTIE LOAD ERROR:", err)
      }
    }

    loadUfoAnim()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (ufoAnim && ufoRef.current) {
      ufoRef.current.goToAndStop(0, true)
    }
  }, [ufoAnim])

  useEffect(() => {
    const handleCrashState = (stateData) => {
      setCrashState(stateData)
    }

    socket.on("crash:state", handleCrashState)

    return () => {
      socket.off("crash:state", handleCrashState)
    }
  }, [])

  const status = crashState?.status || "waiting"
  const multiplier = Number(crashState?.multiplier || 1)
  const countdown = crashState?.countdown ?? 5

  const isWaiting = status === "waiting"
  const isFlying = status === "flying"
  const isCrashed = status === "crashed"

  const showStart = isWaiting && countdown === 0
  const showCountdown = isWaiting && countdown > 0

  const crashMainValue = isFlying
    ? `x${multiplier.toFixed(2)}`
    : showCountdown
      ? String(countdown)
      : showStart
        ? "Start!"
        : isCrashed
          ? `x${multiplier.toFixed(2)}`
          : "5"

  const crashSubText = showCountdown
    ? "Ожидание игроков"
    : showStart
      ? "Start!"
      : ""

  const crashMainClass = isCrashed
    ? "multiplier crashed"
    : isFlying
      ? "multiplier flying"
      : "multiplier waiting"

  return (
    <div
      className="crash-panel"
      onClick={() => {
        triggerHaptic("light")
        navigate("/crash")
      }}
    >
      <div className="crash-title">Rocket Crash</div>

      <div className={crashMainClass}>
        {crashMainValue}
      </div>

      {!!crashSubText && (
        <div className="home-crash-subtext">
          {crashSubText}
        </div>
      )}

      <button className="launch-btn" type="button">
        Запустить
      </button>

      {ufoAnim && (
        <div className="ufo-lottie" aria-hidden="true">
          <Lottie
            lottieRef={ufoRef}
            animationData={ufoAnim}
            autoplay={false}
            loop={false}
          />
        </div>
      )}
    </div>
  )
}

export default memo(HomeCrashPanel)
