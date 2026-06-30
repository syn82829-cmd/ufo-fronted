import { useCallback, useEffect, useRef, useState } from "react"

import {
  cashoutCrash,
  getCrashHistory,
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
  const [crashHistory, setCrashHistory] = useState([])
  const [profit, setProfit] = useState(0)

  const [isBetLoading, setIsBetLoading] = useState(false)
  const [isCashoutLoading, setIsCashoutLoading] = useState(false)

  const pendingBetPromiseRef = useRef(null)
  const optimisticBetIdRef = useRef(null)
  const betInFlightRef = useRef(false)
  const placedBetRoundRef = useRef(null)
  const cashoutInFlightRef = useRef(false)
  const cashedOutRoundRef = useRef(null)
  const lastHistoryRoundRef = useRef(null)

  const pushCrashHistory = useCallback((stateData) => {
    const roundNumber = Number(stateData?.roundNumber || 0)
    const multiplier = Number(stateData?.crashPoint || stateData?.multiplier || 0)

    if (!roundNumber || !multiplier) return
    if (lastHistoryRoundRef.current === roundNumber) return

    lastHistoryRoundRef.current = roundNumber

    setCrashHistory((prev) => {
      const filtered = Array.isArray(prev)
        ? prev.filter((item) => Number(item?.roundNumber) !== roundNumber)
        : []

      return [
        {
          id: stateData?.roundId || `round-${roundNumber}`,
          roundNumber,
          multiplier,
          crashedAt: stateData?.crashedAt || new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 14)
    })
  }, [])

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
    const nextRoundId = next?.roundId || null
    const isCashoutLockedRound =
      nextRoundId && cashedOutRoundRef.current === nextRoundId

    if (isNewRound) {
      placedBetRoundRef.current = null
      cashedOutRoundRef.current = null
      betInFlightRef.current = false
      cashoutInFlightRef.current = false

      return {
        ...next,
        myBet: null,
      }
    }

    if (
      isCashoutLockedRound &&
      prevBet?.status === "cashed_out" &&
      nextBet?.status !== "cashed_out"
    ) {
      return {
        ...next,
        myBet: prevBet,
      }
    }

    return {
      ...next,
      myBet: nextBet ?? prevBet ?? null,
    }
  }, [])

  const refreshCrashData = useCallback(async () => {
    if (!userId || userId === "—") return

    try {
      const stateData = await getCrashState(userId)
      setCrashState((prev) => mergeCrashState(prev, stateData))
      if (stateData?.status === "crashed") {
        pushCrashHistory(stateData)
      }
    } catch (err) {
      console.error("REFRESH CRASH DATA ERROR:", err)
    }
  }, [userId, mergeCrashState, pushCrashHistory])

  const refreshCrashHistory = useCallback(async () => {
    try {
      const history = await getCrashHistory(14)
      setCrashHistory(Array.isArray(history) ? history : [])
      const latest = Array.isArray(history) ? history[0] : null
      if (latest?.roundNumber) {
        lastHistoryRoundRef.current = Number(latest.roundNumber)
      }
    } catch (err) {
      console.error("REFRESH CRASH HISTORY ERROR:", err)
    }
  }, [])

  useEffect(() => {
    const handleCrashState = (stateData) => {
      setCrashState((prev) => mergeCrashState(prev, stateData))
      if (stateData?.status === "crashed") {
        pushCrashHistory(stateData)
      }
    }

    const handleCrashLive = (liveData) => {
      setLivePlayers((prev) => {
        const nextLive = Array.isArray(liveData) ? liveData : []
        const lockedRoundId = cashedOutRoundRef.current

        if (!lockedRoundId || !Array.isArray(prev)) {
          return nextLive
        }

        const prevOwnCashout = prev.find((item) => {
          return (
            String(item?.user?.telegram_id) === String(userId) &&
            item?.status === "cashed_out"
          )
        })

        if (!prevOwnCashout) return nextLive

        return nextLive.map((item) => {
          if (String(item?.user?.telegram_id) !== String(userId)) {
            return item
          }

          if (item?.status === "cashed_out") {
            return item
          }

          return {
            ...item,
            status: "cashed_out",
            cashout_multiplier: prevOwnCashout.cashout_multiplier,
            payout: prevOwnCashout.payout,
            profit: prevOwnCashout.profit,
          }
        })
      })
    }

    socket.on("crash:state", handleCrashState)
    socket.on("crash:live", handleCrashLive)

    return () => {
      socket.off("crash:state", handleCrashState)
      socket.off("crash:live", handleCrashLive)
    }
  }, [mergeCrashState, pushCrashHistory, userId])

  useEffect(() => {
    if (!userId || userId === "—") return
    refreshCrashData()
    refreshCrashHistory()
  }, [userId, refreshCrashData, refreshCrashHistory])

  const placeBet = useCallback(async (amount) => {
    if (!userId || userId === "—") return

    const numericAmount = Number(amount || 0)
    if (!numericAmount || numericAmount <= 0) return

    const currentRoundId = crashState?.roundId || null

    if (
      betInFlightRef.current ||
      (currentRoundId && placedBetRoundRef.current === currentRoundId)
    ) {
      return
    }

    betInFlightRef.current = true
    placedBetRoundRef.current = currentRoundId

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
            roundId: prev?.roundId || currentRoundId,
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
            roundId: result?.roundId || prev?.roundId || currentRoundId || null,
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

      if (placedBetRoundRef.current === currentRoundId) {
        placedBetRoundRef.current = null
      }

      console.error("PLACE CRASH BET ERROR:", err)
      await refreshUser?.().catch(() => {})
      await refreshCrashData().catch(() => {})
      throw err
    } finally {
      setIsBetLoading(false)
      betInFlightRef.current = false

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
    crashState,
    refreshUser,
    refreshCrashData,
    decrementBalance,
    incrementBalance,
  ])

  const cashout = useCallback(async (optimisticMultiplier) => {
    if (!userId || userId === "—" || cashoutInFlightRef.current) return

    const currentBet = crashState?.myBet || null
    const currentRoundId = crashState?.roundId || currentBet?.roundId || null

    if (
      !currentBet ||
      currentBet.status !== "active" ||
      (currentRoundId && cashedOutRoundRef.current === currentRoundId)
    ) {
      return
    }

    cashoutInFlightRef.current = true
    cashedOutRoundRef.current = currentRoundId

    const safeMultiplier = Math.max(1, Number(optimisticMultiplier || crashState?.multiplier || 1))
    const optimisticPayout = Math.floor(Number(currentBet.amount || 0) * safeMultiplier)
    const optimisticProfit = Math.max(optimisticPayout - Number(currentBet.amount || 0), 0)

    const applyOptimisticCashout = () => {
      setProfit(optimisticProfit)

      setCrashState((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          myBet: {
            ...(prev?.myBet || {}),
            cashout_multiplier: safeMultiplier,
            payout: optimisticPayout,
            profit: optimisticProfit,
            status: "cashed_out",
            isOptimisticCashout: true,
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
            cashout_multiplier: safeMultiplier,
            payout: optimisticPayout,
            profit: optimisticProfit,
          }
        })
      })
    }

    try {
      applyOptimisticCashout()

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
            isOptimisticCashout: false,
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

      return result
    } catch (err) {
      setProfit(0)

      setCrashState((prev) => {
        if (!prev) return prev

        return {
          ...prev,
          myBet: {
            ...currentBet,
            status: "active",
            isOptimisticCashout: false,
          },
        }
      })

      if (cashedOutRoundRef.current === currentRoundId) {
        cashedOutRoundRef.current = null
      }

      console.error("CRASH CASHOUT ERROR:", err)
      await refreshUser?.().catch(() => {})
      await refreshCrashData().catch(() => {})
      throw err
    } finally {
      cashoutInFlightRef.current = false
      setIsCashoutLoading(false)
    }
  }, [
    userId,
    crashState,
    refreshUser,
    refreshCrashData,
    incrementBalance,
  ])

  return {
    crashState,
    livePlayers,
    crashHistory,
    profit,
    isBetLoading,
    isCashoutLoading,
    refreshCrashData,
    placeBet,
    cashout,
  }
}
