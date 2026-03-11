import { useCallback, useEffect, useState } from "react"

import {
  cashoutCrash,
  getCrashState,
  placeCrashBet,
} from "../api"
import { socket } from "../socket"

export function useCrashSocket({ userId, refreshUser }) {
  const [crashState, setCrashState] = useState(null)
  const [livePlayers, setLivePlayers] = useState([])
  const [profit, setProfit] = useState(0)

  const [isBetLoading, setIsBetLoading] = useState(false)
  const [isCashoutLoading, setIsCashoutLoading] = useState(false)

  const mergeCrashState = useCallback((prev, next) => {
    if (!next) return prev
    if (!prev) return next

    const prevRound = Number(prev?.roundNumber || 0)
    const nextRound = Number(next?.roundNumber || 0)

    if (nextRound < prevRound) {
      return prev
    }

    const isNewRound = nextRound > prevRound

    return {
      ...next,
      myBet: isNewRound ? null : (next?.myBet ?? prev?.myBet ?? null),
    }
  }, [])

  const refreshCrashData = useCallback(async () => {
    if (!userId || userId === "—") return

    try {
      const stateData = await getCrashState(userId)
      setCrashState((prev) => mergeCrashState(prev, stateData))
    } catch (err) {
      console.error("REFRESH CRASH DATA ERROR:", err)
    }
  }, [userId, mergeCrashState])

  useEffect(() => {
    const handleCrashState = (stateData) => {
      setCrashState((prev) => mergeCrashState(prev, stateData))
    }

    const handleCrashLive = (liveData) => {
      setLivePlayers(Array.isArray(liveData) ? liveData : [])
    }

    socket.on("crash:state", handleCrashState)
    socket.on("crash:live", handleCrashLive)

    return () => {
      socket.off("crash:state", handleCrashState)
      socket.off("crash:live", handleCrashLive)
    }
  }, [mergeCrashState])

  useEffect(() => {
    if (!userId || userId === "—") return
    refreshCrashData()
  }, [userId, refreshCrashData])

  const placeBet = useCallback(async (amount) => {
    if (!userId || userId === "—") return

    try {
      setIsBetLoading(true)
      setProfit(0)

      const result = await placeCrashBet({
        telegram_id: userId,
        amount,
      })

      setCrashState((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          myBet: {
            ...(prev?.myBet || {}),
            ...(result?.bet || {}),
            roundId: result?.roundId || prev?.roundId || null,
            amount: Number(amount),
            status: "active",
          },
        }
      })

      refreshUser?.().catch((err) => {
        console.error("REFRESH USER AFTER BET ERROR:", err)
      })

      refreshCrashData().catch((err) => {
        console.error("REFRESH CRASH AFTER BET ERROR:", err)
      })

      return result
    } catch (err) {
      console.error("PLACE CRASH BET ERROR:", err)
      await refreshUser?.().catch(() => {})
      throw err
    } finally {
      setIsBetLoading(false)
    }
  }, [userId, refreshUser, refreshCrashData])

  const cashout = useCallback(async () => {
    if (!userId || userId === "—") return

    try {
      setIsCashoutLoading(true)

      const result = await cashoutCrash({
        telegram_id: userId,
      })

      setProfit(Number(result?.profit || 0))

      setCrashState((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          myBet: {
            ...(prev?.myBet || {}),
            ...(result?.bet || {}),
            status: "cashed_out",
          },
        }
      })

      refreshUser?.().catch((err) => {
        console.error("REFRESH USER AFTER CASHOUT ERROR:", err)
      })

      refreshCrashData().catch((err) => {
        console.error("REFRESH CRASH AFTER CASHOUT ERROR:", err)
      })

      return result
    } catch (err) {
      console.error("CRASH CASHOUT ERROR:", err)
      await refreshUser?.().catch(() => {})
      throw err
    } finally {
      setIsCashoutLoading(false)
    }
  }, [userId, refreshUser, refreshCrashData])

  return {
    crashState,
    livePlayers,
    profit,
    isBetLoading,
    isCashoutLoading,
    refreshCrashData,
    placeBet,
    cashout,
  }
}
