import { useParams, useNavigate } from "react-router-dom"
import { useLayoutEffect, useMemo, useRef, useState, useEffect } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import {
  openCaseRequest,
  openFreeCase,
  sellInventoryItem,
  getFreeCaseState,
  checkBonusChannel,
} from "../api"
import { useUser } from "../context/UserContext"
import { triggerHaptic } from "../utils/haptics"
import useCaseAnimations from "../hooks/useCaseAnimations"
import CaseHeader from "../components/case/CaseHeader"
import CaseRoulette from "../components/case/CaseRoulette"
import CaseDropsGrid from "../components/case/CaseDropsGrid"
import CaseResultModal from "../components/case/CaseResultModal"
import CaseInfoBlock from "../components/case/CaseInfoBlock"

const pngSrcByDrop = (drop) => `/drops/${drop?.png}.png`

const formatStars = (value) => {
  const num = Number(value || 0)
  return new Intl.NumberFormat("ru-RU").format(num)
}

function CasePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, refreshUser } = useUser()
  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)
  const [phase, setPhase] = useState("idle") // idle | preparing | spinning | result
  const [resultId, setResultId] = useState(null)
  const [resultInventoryItemId, setResultInventoryItemId] = useState(null)
  const [reelItems, setReelItems] = useState([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [freeCaseState, setFreeCaseState] = useState(null)
  const [isFreeCaseLoading, setIsFreeCaseLoading] = useState(false)
  const [isCheckingFreeCaseChannel, setIsCheckingFreeCaseChannel] = useState(false)
  const [caseInviteAnim, setCaseInviteAnim] = useState(null)
  const [demoMode, setDemoMode] = useState(() => {
    try {
      return localStorage.getItem("ufo_demo_mode") === "true"
    } catch {
      return false
    }
  })

  const wrapRef = useRef(null)
  const reelRef = useRef(null)
  const imgRef = useRef(null)
  const lineRef = useRef(null)

  const pendingRef = useRef(null)
  const spinStartedRef = useRef(false)
  const openLockRef = useRef(false)
  const preloadPromiseRef = useRef(null)
  const preloadKeyRef = useRef("")

  useEffect(() => {
    try {
      localStorage.setItem("ufo_demo_mode", String(demoMode))
    } catch {
      // ignore
    }
  }, [demoMode])

  const isInviteCase = caseData?.type === "invite"

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0

    const root = document.getElementById("root")
    if (root) {
      root.scrollTop = 0
    }

    const app = document.querySelector(".app")
    if (app) {
      app.scrollTop = 0
    }

    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      document.body.scrollTop = 0
      document.documentElement.scrollTop = 0

      if (root) {
        root.scrollTop = 0
      }

      if (app) {
        app.scrollTop = 0
      }
    })
  }, [id])

  const animationsById = useCaseAnimations(caseData?.drops || [])

  const dropMap = useMemo(() => {
    return Object.fromEntries(((caseData?.drops) || []).map((drop) => [drop.id, drop]))
  }, [caseData?.drops])

  const safeDrops = useMemo(() => {
    return ((caseData?.drops) || []).filter((drop) => {
      if (!drop) return false
      if (!drop.chance || drop.chance <= 0) return false
      if (!drop.png || drop.png === "placeholder") return false
      return true
    })
  }, [caseData?.drops])

  const resultDrop = useMemo(() => {
    return resultId ? dropMap[resultId] || null : null
  }, [dropMap, resultId])

  const casePrice = Number(caseData?.price || 0)
  const telegramId = user?.id
  const userBalance = Number(user?.balance || 0)
  const missingStars = Math.max(casePrice - userBalance, 0)

  const hasEnoughBalance = userBalance >= casePrice
  const canOpenPaidCase = demoMode || hasEnoughBalance
  const canOpenInviteCase = Boolean(freeCaseState?.canOpen)
  const canOpenCase = isInviteCase ? canOpenInviteCase : canOpenPaidCase

  const isPreparingOrSpinning = phase === "preparing" || phase === "spinning"
  const isSpinning = isPreparingOrSpinning
  const isInfoLayout = caseData?.specialLayout === "info"

  const navigateWithHaptic = (...args) => {
    triggerHaptic("light")
    navigate(...args)
  }

  const preloadAllPng = async () => {
    const uniq = Array.from(new Set(safeDrops.map((drop) => pngSrcByDrop(drop))))
    await Promise.all(
      uniq.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image()
            img.onload = resolve
            img.onerror = resolve
            img.src = src
          })
      )
    )
  }

  useEffect(() => {
    if (!safeDrops.length) return

    const key = safeDrops.map((drop) => `${drop.id}:${drop.png}`).join("|")
    if (preloadKeyRef.current === key && preloadPromiseRef.current) return

    preloadKeyRef.current = key
    preloadPromiseRef.current = preloadAllPng()
  }, [safeDrops])

  useEffect(() => {
    if (resultDrop?.id) {
      triggerHaptic("success")
    }
  }, [resultDrop?.id])

  useEffect(() => {
    let cancelled = false

    async function loadInviteAnim() {
      if (!isInviteCase || !caseData?.inviteLottie) {
        setCaseInviteAnim(null)
        return
      }

      try {
        const res = await fetch(caseData.inviteLottie)
        if (!res.ok) {
          throw new Error(`Failed to load invite lottie: ${res.status}`)
        }

        const data = await res.json()

        if (!cancelled) {
          setCaseInviteAnim(data)
        }
      } catch (err) {
        console.error("INVITE LOTTIE LOAD ERROR:", err)
        if (!cancelled) {
          setCaseInviteAnim(null)
        }
      }
    }

    loadInviteAnim()

    return () => {
      cancelled = true
    }
  }, [isInviteCase, caseData?.inviteLottie])

  useEffect(() => {
    async function loadFreeCaseState() {
      if (!isInviteCase) {
        setFreeCaseState(null)
        setIsFreeCaseLoading(false)
        return
      }

      if (!telegramId || telegramId === "—") {
        setFreeCaseState(null)
        setIsFreeCaseLoading(false)
        return
      }

      try {
        setIsFreeCaseLoading(true)
        const data = await getFreeCaseState({
          telegram_id: telegramId,
          caseId: caseData.id,
        })
        setFreeCaseState(data)
      } catch (err) {
        console.error("FREE CASE STATE LOAD ERROR:", err)
        setFreeCaseState(null)
      } finally {
        setIsFreeCaseLoading(false)
      }
    }

    if (caseData?.id) {
      loadFreeCaseState()
    }
  }, [isInviteCase, telegramId, caseData?.id])

  const handleOpenChannel = () => {
    triggerHaptic("light")

    const tg = window.Telegram?.WebApp

    if (tg?.openTelegramLink) {
      tg.openTelegramLink("https://t.me/ufomochannel")
      return
    }

    window.open("https://t.me/ufomochannel", "_blank")
  }

  const handleCheckFreeCaseChannel = async () => {
    if (!telegramId || isCheckingFreeCaseChannel || !isInviteCase) return

    try {
      triggerHaptic("light")
      setIsCheckingFreeCaseChannel(true)

      const result = await checkBonusChannel(telegramId)

      setFreeCaseState((prev) => {
        const invitesCount = Number(prev?.invitesCount || 0)
        const invitesRequired = Number(prev?.invitesRequired || caseData?.invitesRequired || 0)
        const nextChannelSubscribed = Boolean(result?.channelSubscribed)

        return {
          ...(prev || {}),
          invitesCount,
          invitesRequired,
          channelSubscribed: nextChannelSubscribed,
          canOpen: nextChannelSubscribed && invitesCount >= invitesRequired,
        }
      })
    } catch (err) {
      console.error("FREE CASE CHANNEL CHECK ERROR:", err)
    } finally {
      setIsCheckingFreeCaseChannel(false)
    }
  }

  const nextFrame = () =>
    new Promise((resolve) => {
      requestAnimationFrame(() => resolve())
    })

  const waitForRouletteImages = async (timeoutMs = 1800) => {
    const startedAt = performance.now()

    while (performance.now() - startedAt < timeoutMs) {
      await nextFrame()
      await nextFrame()

      const reel = reelRef.current
      if (!reel) continue

      const imgs = Array.from(reel.querySelectorAll(".roulette-png"))
      if (!imgs.length) continue

      const allReady = imgs.every((img) => img.complete && img.naturalWidth > 0)
      if (allReady) return true
    }

    return false
  }

  const handleClick = (dropId) => {
    triggerHaptic("light")

    if (activeDrop === dropId) {
      setActiveDrop(null)
      setTimeout(() => setActiveDrop(dropId), 10)
    } else {
      setActiveDrop(dropId)
    }
  }

  const pickWeighted = () => {
    const totalWeight = safeDrops.reduce((sum, drop) => sum + (drop.chance || 0), 0)
    if (!totalWeight) return null

    let roll = Math.random() * totalWeight

    for (const drop of safeDrops) {
      roll -= drop.chance || 0
      if (roll <= 0) return drop.id
    }

    return safeDrops[safeDrops.length - 1]?.id || null
  }

  const randDropId = () => {
    return safeDrops[Math.floor(Math.random() * safeDrops.length)]?.id || null
  }

  const buildSpinItems = (winnerId) => {
    const containerWidth =
      wrapRef.current?.getBoundingClientRect().width ||
      imgRef.current?.getBoundingClientRect().width ||
      320

    const approxStep = 160
    const visible = Math.ceil(containerWidth / approxStep)

    const winIndex = 52 + Math.floor(Math.random() * 8)
    const totalItems = winIndex + visible + 72

    const items = new Array(totalItems)
    for (let i = 0; i < totalItems; i++) {
      if (i === winIndex) {
        items[i] = winnerId
      } else {
        items[i] = randDropId()
      }
    }

    if (items[winIndex - 1] === winnerId) items[winIndex - 1] = randDropId()
    if (items[winIndex + 1] === winnerId) items[winIndex + 1] = randDropId()

    pendingRef.current = {
      winner: winnerId,
      winIndex,
      durationMs: 6400,
    }

    return items
  }

  const resetResultState = () => {
    setResultId(null)
    setResultInventoryItemId(null)
    setReelItems([])
    pendingRef.current = null
    spinStartedRef.current = false
    setPhase("idle")
    openLockRef.current = false

    if (reelRef.current) {
      reelRef.current.style.transition = "none"
      reelRef.current.style.transform = "translate3d(0px,0,0)"
    }
  }

  const openCase = async () => {
    if (!canOpenCase) return
    if (openLockRef.current) return
    if (phase === "preparing" || phase === "spinning") return
    if (!safeDrops.length) return

    openLockRef.current = true

    try {
      triggerHaptic("medium")

      setResultId(null)
      setResultInventoryItemId(null)
      setReelItems([])
      pendingRef.current = null
      spinStartedRef.current = false
      setPhase("preparing")

      if (preloadPromiseRef.current) {
        await preloadPromiseRef.current
      } else {
        await preloadAllPng()
      }

      let winnerId = null
      let inventoryItemId = null

      if (demoMode && !isInviteCase) {
        winnerId = pickWeighted()
      } else {
        if (!telegramId) {
          throw new Error("Telegram user not ready")
        }

        const data = isInviteCase
          ? await openFreeCase({
              telegram_id: telegramId,
              caseId: caseData.id,
            })
          : await openCaseRequest({
              telegram_id: telegramId,
              caseId: caseData.id,
            })

        winnerId = data?.drop?.dropId || null
        inventoryItemId = data?.drop?.id || null

        await refreshUser()
      }

      if (!winnerId) {
        openLockRef.current = false
        setPhase("idle")
        return
      }

      setResultInventoryItemId(inventoryItemId)

      const items = buildSpinItems(winnerId)
      setReelItems(items)

      await nextFrame()
      await nextFrame()
      await waitForRouletteImages()

      setPhase("spinning")
    } catch (err) {
      triggerHaptic("error")
      console.error("OPEN CASE ERROR:", err)

      if (!demoMode || isInviteCase) {
        await refreshUser().catch(() => {})
      }

      openLockRef.current = false
      setPhase("idle")
    }
  }

  useLayoutEffect(() => {
    if (phase !== "spinning") return
    if (!reelRef.current || !wrapRef.current || !lineRef.current) return
    if (!reelItems.length || !pendingRef.current || spinStartedRef.current) return

    const reel = reelRef.current
    const wrap = wrapRef.current
    const { winIndex, durationMs } = pendingRef.current

    const clamp = (v, a, b) => Math.min(Math.max(v, a), b)

    const getCenteredOffsetForIndex = (itemsEls, index) => {
      const winnerEl = itemsEls[index]
      if (!winnerEl) return null

      const wrapWidth = wrap.getBoundingClientRect().width || 320
      const winnerLeft = winnerEl.offsetLeft
      const winnerWidth = winnerEl.offsetWidth
      const winnerCenter = winnerLeft + winnerWidth / 2

      const rawOffset = winnerCenter - wrapWidth / 2
      const maxOffset = Math.max(0, reel.scrollWidth - wrapWidth)

      return clamp(rawOffset, 0, maxOffset)
    }

    const start = () => {
      const itemsEls = reel.querySelectorAll(".roulette-item")
      if (!itemsEls || itemsEls.length < 2) {
        setResultId(pendingRef.current?.winner || null)
        setPhase("result")
        return
      }

      const finalOffset = getCenteredOffsetForIndex(itemsEls, winIndex)
      if (finalOffset == null) {
        setResultId(pendingRef.current?.winner || null)
        setPhase("result")
        return
      }

      reel.style.transition = "none"
      reel.style.transform = "translate3d(0px,0,0)"
      void reel.offsetHeight

      spinStartedRef.current = true

      reel.style.transition = `transform ${durationMs}ms cubic-bezier(0.12,0.75,0.15,1)`
      reel.style.transform = `translate3d(-${finalOffset}px,0,0)`

      const onEnd = () => {
        reel.removeEventListener("transitionend", onEnd)

        const snappedOffset = getCenteredOffsetForIndex(itemsEls, winIndex)
        if (snappedOffset != null) {
          const dpr = window.devicePixelRatio || 1
          const roundedOffset = Math.round(snappedOffset * dpr) / dpr

          reel.style.transition = "none"
          reel.style.transform = `translate3d(-${roundedOffset}px,0,0)`
        }

        setResultId(pendingRef.current?.winner || null)
        setPhase("result")
      }

      reel.addEventListener("transitionend", onEnd)
    }

    requestAnimationFrame(() => requestAnimationFrame(start))
  }, [phase, reelItems])

  useEffect(() => {
    if (phase === "idle" || phase === "result") {
      openLockRef.current = false
    }
  }, [phase])

  const sellItem = () => {
    triggerHaptic("light")
    resetResultState()
  }

  const openAgain = async () => {
    if (openLockRef.current) return

    try {
      triggerHaptic("medium")
      openLockRef.current = true

      if (!demoMode && telegramId && resultInventoryItemId) {
        await sellInventoryItem({
          telegram_id: telegramId,
          inventoryItemId: resultInventoryItemId,
        })

        await refreshUser()
      }

      triggerHaptic("success")
    } catch (err) {
      triggerHaptic("error")
      console.error("SELL ITEM ERROR:", err)
      await refreshUser().catch(() => {})
    } finally {
      resetResultState()
    }
  }

  const openButtonText =
    phase === "preparing"
      ? "Загрузка…"
      : phase === "spinning"
        ? "Крутится…"
        : "Открыть кейс"

  const invitesRequired = Number(freeCaseState?.invitesRequired || caseData?.invitesRequired || 0)
  const invitesCount = Number(freeCaseState?.invitesCount || 0)
  const channelDone = Boolean(freeCaseState?.channelSubscribed)
  const invitesDone = invitesCount >= invitesRequired && invitesRequired > 0
  const showInviteOpenButton = !isFreeCaseLoading && canOpenInviteCase && !isPreparingOrSpinning

  if (!caseData) {
    return <div className="app">Case config missing</div>
  }

  return (
    <div className="app">
      <CaseHeader
        caseData={caseData}
        isSpinning={isSpinning}
        imgRef={imgRef}
        navigate={navigateWithHaptic}
        onOpenSettings={() => {
          triggerHaptic("light")
          setIsSettingsOpen((prev) => !prev)
        }}
      />

      {isSettingsOpen && !resultDrop && !isInviteCase && (
        <div className="case-settings-panel">
          <div className="case-settings-row">
            <div className="case-settings-copy">
              <div className="case-settings-title">Демо-режим</div>
              <div className="case-settings-text">
                Открытие кейсов без списания Stars
              </div>
            </div>

            <button
              type="button"
              className={`case-settings-toggle ${demoMode ? "active" : ""}`}
              onClick={() => {
                triggerHaptic("light")
                setDemoMode((prev) => !prev)
              }}
            >
              <span className="case-settings-toggle-thumb" />
            </button>
          </div>
        </div>
      )}

      {!resultDrop && (
        <div className="casepage-action-stack">
          {isInviteCase ? (
            isPreparingOrSpinning ? (
              <button type="button" className="casepage-open-btn" disabled>
                {openButtonText}
              </button>
            ) : showInviteOpenButton ? (
              <button
                type="button"
                className="casepage-open-btn"
                onClick={openCase}
              >
                Открыть кейс
              </button>
            ) : (
              <div className="case-invite-block">
                <div className="case-invite-title">
                  Выполните условия:
                </div>

                <div className={`case-invite-row ${invitesDone ? "done" : ""}`}>
                  <div className={`case-invite-check ${invitesDone ? "done" : ""}`}>
                    {invitesDone ? "✓" : ""}
                  </div>

                  <div className="case-invite-main">
                    <div className="case-invite-text">
                      Пригласить {invitesRequired} друзей
                    </div>
                    <div className="case-invite-progress">
                      {invitesCount}/{invitesRequired}
                    </div>
                  </div>
                </div>

                <div className={`case-invite-row ${channelDone ? "done" : ""}`}>
                  <button
                    type="button"
                    className={`case-invite-check ${channelDone ? "done" : ""}`}
                    onClick={handleCheckFreeCaseChannel}
                    disabled={isCheckingFreeCaseChannel}
                  >
                    {channelDone ? "✓" : ""}
                  </button>

                  <div className="case-invite-main">
                    <div className="case-invite-text">
                      Подписаться на{" "}
                      <button
                        type="button"
                        className="case-invite-link"
                        onClick={handleOpenChannel}
                      >
                        канал
                      </button>
                    </div>
                    <div className="case-invite-progress">
                      {channelDone ? "1/1" : "0/1"}
                    </div>
                  </div>
                </div>

                <div className="case-invite-right">
                  {caseInviteAnim && (
                    <Lottie
                      animationData={caseInviteAnim}
                      loop
                      autoplay
                      className="case-invite-lottie"
                    />
                  )}
                </div>
              </div>
            )
          ) : isPreparingOrSpinning ? (
            <button type="button" className="casepage-open-btn" disabled>
              {openButtonText}
            </button>
          ) : canOpenPaidCase ? (
            <button
              type="button"
              className="casepage-open-btn"
              onClick={openCase}
            >
              {openButtonText}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="casepage-balance-warning-btn"
                disabled
              >
                <span>Недостаточно</span>
                <img
                  src="/ui/star.PNG"
                  className="casepage-balance-warning-icon"
                  alt=""
                  draggable={false}
                />
                <span>{formatStars(missingStars)}</span>
              </button>

              <button
                type="button"
                className="casepage-topup-btn"
                onClick={() => {
                  triggerHaptic("light")
                  navigate("/profile")
                }}
              >
                Пополнить баланс
              </button>
            </>
          )}
        </div>
      )}

      <CaseRoulette
        isSpinning={isSpinning}
        wrapRef={wrapRef}
        lineRef={lineRef}
        reelRef={reelRef}
        reelItems={reelItems}
        dropMap={dropMap}
        pngSrcByDrop={pngSrcByDrop}
      />

      {!isInfoLayout && !isSpinning && (
        <div className="case-drops-heading">
          Возможный выигрыш
        </div>
      )}

      {!isSpinning &&
        (isInfoLayout ? (
          <CaseInfoBlock caseData={caseData} />
        ) : (
          <CaseDropsGrid
            drops={caseData.drops}
            activeDrop={activeDrop}
            animationsById={animationsById}
            handleClick={handleClick}
          />
        ))}

      <CaseResultModal
        resultDrop={resultDrop}
        pngSrcByDrop={pngSrcByDrop}
        sellItem={sellItem}
        openAgain={openAgain}
      />
    </div>
  )
}

export default CasePage
