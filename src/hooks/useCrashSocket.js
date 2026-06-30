import { useCallback, useEffect, useRef, useState } from "react"

import {
  cashoutCrash,
  getCrashState,
  placeCrashBet,
} from "../api"
import { socket } from "../socket"

export function useCrashSocket({
  userId,
  refreshUser,
  user,
  incrementBalance,
  decrementBalance,
}) {
  const [crashState, setCrashState] = useState(null)
  const [livePlayers, setLivePlayers] = useState([])
  const [profit, setProfit] = useState(0)

  const [isBetLoading, setIsBetLoading] = useState(false)
  const [isCashoutLoading, setIsCashoutLoading] = useState(false)

  const pendingBetPromiseRef = useRef(null)
  const optimisticBetIdRef = useRef(null)

  const mergeCrashState = useCallback((prev, next) => {
    if (!next) return prev
    if (!prev) return next

    const prevRound = Number(prev?.roundNumber || 0)
    const nextRound = Number(next?.roundNumber || 0)

    if (nextRound < prevRound) {
      return prev
    }

    const isNewRound = nextRound > prevRound
    const prevBet = prev?.myBet ?? null
    const nextBet = next?.myBet ?? null

    return {
      ...next,
      myBet: isNewRound ? null : (nextBet ?? prevBet ?? null),
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

    const numericAmount = Number(amount || 0)
    if (!numericAmount || numericAmount <= 0) return

    const optimisticId = `optimistic-${userId}-${Date.now()}`
    optimisticBetIdRef.current = optimisticId

    const applyOptimisticBet = () => {
      setProfit(0)
      decrementBalance?.(numericAmount)

      setCrashState((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          myBet: {
            ...(prev?.myBet || {}),
            id: optimisticId,
            roundId: prev?.roundId || null,
            amount: numericAmount,
            status: "active",
            cashout_multiplier: null,
            payout: null,
            profit: null,
            isOptimistic: true,
          },
        }
      })

      setLivePlayers((prev) => {
        const optimisticItem = {
          id: optimisticId,
          amount: numericAmount,
          status: "active",
          cashout_multiplier: null,
          payout: null,
          profit: null,
          created_at: new Date().toISOString(),
          user: {
            id: user?.id ?? null,
            telegram_id: String(userId),
            username: user?.username || "You",
            casesOpened: Number(user?.casesOpened || 0),
            crashGamesPlayed: Number(user?.crashGamesPlayed || 0),
            crashWins: Number(user?.crashWins || 0),
          },
        }

        const filtered = Array.isArray(prev)
          ? prev.filter((item) => String(item?.user?.telegram_id) !== String(userId))
          : []

        return [optimisticItem, ...filtered]
      })
    }

    try {
      setIsBetLoading(true)
      applyOptimisticBet()

      const requestPromise = placeCrashBet({
        telegram_id: userId,
        amount: numericAmount,
      })

      pendingBetPromiseRef.current = requestPromise
      const result = await requestPromise

      setCrashState((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          myBet: {
            ...(prev?.myBet || {}),
            ...(result?.bet || {}),
            roundId: result?.roundId || prev?.roundId || null,
            amount: numericAmount,
            status: "active",
            isOptimistic: false,
          },
        }
      })

      setLivePlayers((prev) => {
        if (!Array.isArray(prev)) return prev

        return prev.map((item) => {
          if (item?.id !== optimisticId) return item

          return {
            ...item,
            ...(result?.bet || {}),
            id: result?.bet?.id || item.id,
            amount: numericAmount,
            status: "active",
          }
        })
      })

      refreshUser?.().catch((err) => {
        console.error("REFRESH USER AFTER BET ERROR:", err)
      })

      refreshCrashData().catch((err) => {
        console.error("REFRESH CRASH AFTER BET ERROR:", err)
      })

      return result
    } catch (err) {
      incrementBalance?.(numericAmount)

      setCrashState((prev) => {
        if (!prev?.myBet || prev.myBet.id !== optimisticId) return prev

        return {
          ...prev,
          myBet: null,
        }
      })

      setLivePlayers((prev) => {
        if (!Array.isArray(prev)) return prev
        return prev.filter((item) => item?.id !== optimisticId)
      })

      console.error("PLACE CRASH BET ERROR:", err)
      await refreshUser?.().catch(() => {})
      await refreshCrashData().catch(() => {})
      throw err
    } finally {
      setIsBetLoading(false)

      if (pendingBetPromiseRef.current) {
        pendingBetPromiseRef.current = null
      }

      if (optimisticBetIdRef.current === optimisticId) {
        optimisticBetIdRef.current = null
      }
    }
  }, [
    userId,
    user,
    refreshUser,
    refreshCrashData,
    decrementBalance,
    incrementBalance,
  ])

  const cashout = useCallback(async () => {
    if (!userId || userId === "—") return

    try {
      setIsCashoutLoading(true)

      if (pendingBetPromiseRef.current) {
        await pendingBetPromiseRef.current
      }

      const result = await cashoutCrash({
        telegram_id: userId,
      })

      const payout = Number(result?.payout || 0)
      const nextProfit = Number(result?.profit || 0)

      setProfit(nextProfit)
      incrementBalance?.(payout)

      setCrashState((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          myBet: {
            ...(prev?.myBet || {}),
            ...(result?.bet || {}),
            status: "cashed_out",
            isOptimistic: false,
          },
        }
      })

      setLivePlayers((prev) => {
        if (!Array.isArray(prev)) return prev

        return prev.map((item) => {
          if (String(item?.user?.telegram_id) !== String(userId)) {
            return item
          }

          return {
            ...item,
            status: "cashed_out",
            cashout_multiplier: result?.bet?.cashout_multiplier ?? result?.multiplier ?? null,
            payout: result?.payout ?? item?.payout ?? null,
            profit: result?.profit ?? item?.profit ?? null,
          }
        })
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
      await refreshCrashData().catch(() => {})
      throw err
    } finally {
      setIsCashoutLoading(false)
    }
  }, [userId, refreshUser, refreshCrashData, incrementBalance])

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
