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

  const refreshCrashData = useCallback(async () => {
    if (!userId || userId === "—") return

    try {
      const stateData = await getCrashState(userId)

      setCrashState((prev) => {
        if (!prev) return stateData
        if ((stateData?.roundNumber || 0) < (prev?.roundNumber || 0)) return prev

        return {
          ...prev,
          ...stateData,
          myBet: stateData?.myBet || null,
        }
      })
    } catch (err) {
      console.error("REFRESH CRASH DATA ERROR:", err)
    }
  }, [userId])

  useEffect(() => {
    const handleCrashState = (stateData) => {
      setCrashState((prev) => {
        if (!prev) return stateData

        if ((stateData?.roundNumber || 0) < (prev?.roundNumber || 0)) {
          return prev
        }

        if (
          stateData?.roundNumber === prev?.roundNumber &&
          prev?.status === "crashed" &&
          stateData?.status === "flying"
        ) {
          return prev
        }

        if (
          stateData?.roundNumber === prev?.roundNumber &&
          prev?.status === "flying" &&
          stateData?.status === "flying"
        ) {
          return {
            ...prev,
            ...stateData,
            myBet: prev?.myBet ?? null,
          }
        }

        const isNewRound = (stateData?.roundNumber || 0) > (prev?.roundNumber || 0)

        return {
          ...stateData,
          myBet: isNewRound ? null : (prev?.myBet ?? null),
        }
      })
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
  }, [])

  useEffect(() => {
    if (!userId || userId === "—") return
    refreshCrashData()
  }, [userId, refreshCrashData])

  const placeBet = useCallback(async (amount) => {
    if (!userId || userId === "—") return

    try {
      setIsBetLoading(true)
      setProfit(0)

      await placeCrashBet({
        telegram_id: userId,
        amount,
      })

      setIsBetLoading(false)

      refreshUser?.().catch((err) => {
        console.error("REFRESH USER AFTER BET ERROR:", err)
      })

      refreshCrashData().catch((err) => {
        console.error("REFRESH CRASH AFTER BET ERROR:", err)
      })
    } catch (err) {
      console.error("PLACE CRASH BET ERROR:", err)
      await refreshUser?.().catch(() => {})
      setIsBetLoading(false)
      throw err
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
      setIsCashoutLoading(false)

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
      setIsCashoutLoading(false)
      throw err
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
    setProfit,
  }
}
