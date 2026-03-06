import { useParams, useNavigate } from "react-router-dom"
import { useLayoutEffect, useMemo, useRef, useState, useEffect } from "react"

import { cases } from "../data/cases"
import useCaseAnimations from "../hooks/useCaseAnimations"
import CaseHeader from "../components/case/CaseHeader"
import CaseRoulette from "../components/case/CaseRoulette"
import CaseDropsGrid from "../components/case/CaseDropsGrid"
import CaseResultModal from "../components/case/CaseResultModal"

const pngSrcByDrop = (drop) => `/drops/${drop?.png}.png`

function CasePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)
  const [phase, setPhase] = useState("idle") // idle | preparing | spinning | result
  const [resultId, setResultId] = useState(null)
  const [reelItems, setReelItems] = useState([])

  const wrapRef = useRef(null)
  const reelRef = useRef(null)
  const imgRef = useRef(null)
  const lineRef = useRef(null)

  const reelItemsRef = useRef([])
  const pendingRef = useRef(null)
  const spinStartedRef = useRef(false)
  const tailFixTriesRef = useRef(0)
  const openLockRef = useRef(false)
  const preloadPromiseRef = useRef(null)
  const preloadKeyRef = useRef("")

  useEffect(() => {
    reelItemsRef.current = reelItems
  }, [reelItems])

  if (!caseData) return <div className="app">Case config missing</div>

  const animationsById = useCaseAnimations(caseData.drops)

  const dropMap = useMemo(() => {
    return Object.fromEntries((caseData.drops || []).map((drop) => [drop.id, drop]))
  }, [caseData.drops])

  const safeDrops = useMemo(() => {
    return (caseData.drops || []).filter((drop) => {
      if (!drop) return false
      if (!drop.chance || drop.chance <= 0) return false
      if (!drop.png || drop.png === "placeholder") return false
      return true
    })
  }, [caseData.drops])

  const resultDrop = useMemo(() => {
    return resultId ? dropMap[resultId] || null : null
  }, [dropMap, resultId])

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

  const handleClick = (dropId) => {
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

  const openCase = async () => {
    if (openLockRef.current) return
    if (phase === "preparing" || phase === "spinning") return
    if (!safeDrops.length) return

    openLockRef.current = true

    try {
      setResultId(null)
      setReelItems([])
      pendingRef.current = null
      spinStartedRef.current = false
      tailFixTriesRef.current = 0
      setPhase("preparing")

      if (preloadPromiseRef.current) {
        await preloadPromiseRef.current
      } else {
        await preloadAllPng()
      }

      const winner = pickWeighted()
      if (!winner) {
        openLockRef.current = false
        setPhase("idle")
        return
      }

      const containerWidth =
        wrapRef.current?.getBoundingClientRect().width ||
        imgRef.current?.getBoundingClientRect().width ||
        320

      const approxStep = 160
      const visible = Math.ceil(containerWidth / approxStep)

      const winIndex = 85 + Math.floor(Math.random() * 12)
      const totalItems = winIndex + visible + 260

      const items = new Array(totalItems)
      for (let i = 0; i < totalItems; i++) {
        if (i === winIndex) {
          items[i] = winner
        } else {
          items[i] = randDropId()
        }
      }

      if (items[winIndex - 1] === winner) items[winIndex - 1] = randDropId()
      if (items[winIndex + 1] === winner) items[winIndex + 1] = randDropId()

      pendingRef.current = {
        winner,
        winIndex,
        durationMs: 7200,
      }

      setReelItems(items)
      setPhase("spinning")
    } catch (err) {
      console.error("OPEN CASE ERROR:", err)
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
    const line = lineRef.current
    const { winIndex, durationMs } = pendingRef.current

    const clamp = (v, a, b) => Math.min(Math.max(v, a), b)

    const getLineCenterX = () => {
      const lr = line.getBoundingClientRect()
      return lr.left + lr.width / 2
    }

    const getPickY = () => {
      const wr = wrap.getBoundingClientRect()
      return wr.top + wr.height / 2
    }

    const start = () => {
      const itemsEls = reel.querySelectorAll(".roulette-item")
      if (!itemsEls || itemsEls.length < 2) return

      const r1 = itemsEls[0].getBoundingClientRect()
      const r2 = itemsEls[1].getBoundingClientRect()
      const step = r2.left - r1.left
      if (!step || step < 50) return

      const containerWidth = wrap.getBoundingClientRect().width || 320
      const itemW = r1.width
      const base = containerWidth / 2 - itemW / 2
      const maxOffset = Math.max(0, reel.scrollWidth - containerWidth)
      const wantedOffset = winIndex * step - base

      if (wantedOffset > maxOffset - step * 3 && tailFixTriesRef.current < 2) {
        tailFixTriesRef.current += 1
        setReelItems((prev) => prev.concat(new Array(260).fill(null).map(() => randDropId())))
        return
      }

      let finalOffset = clamp(wantedOffset, 0, maxOffset)

      reel.style.transition = "none"
      reel.style.transform = "translate3d(0px,0,0)"
      void reel.offsetHeight

      spinStartedRef.current = true

      reel.style.transition = `transform ${durationMs}ms cubic-bezier(0.12,0.75,0.15,1)`
      reel.style.transform = `translate3d(-${finalOffset}px,0,0)`

      const onEnd = () => {
        reel.removeEventListener("transitionend", onEnd)

        const lineX = getLineCenterX()
        const approxIdx = Math.round((finalOffset + base) / step)

        let bestIdx = clamp(approxIdx, 0, reelItemsRef.current.length - 1)
        let bestDist = Infinity

        for (let i = bestIdx - 10; i <= bestIdx + 10; i++) {
          const idx = clamp(i, 0, reelItemsRef.current.length - 1)
          const el = itemsEls[idx]
          if (!el) continue
          const r = el.getBoundingClientRect()
          const c = r.left + r.width / 2
          const dist = Math.abs(c - lineX)
          if (dist < bestDist) {
            bestDist = dist
            bestIdx = idx
          }
        }

        let snappedOffset = bestIdx * step - base
        snappedOffset = clamp(snappedOffset, 0, maxOffset)

        const dpr = window.devicePixelRatio || 1
        snappedOffset = Math.round(snappedOffset * dpr) / dpr

        reel.style.transition = "none"
        reel.style.transform = `translate3d(-${snappedOffset}px,0,0)`

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const x = getLineCenterX()
            const y = getPickY()

            let el = document.elementFromPoint(x, y)
            if (!el) {
              setResultId(reelItemsRef.current[bestIdx])
              setPhase("result")
              return
            }

            const itemEl = el.closest ? el.closest(".roulette-item") : null
            if (!itemEl) {
              el = document.elementFromPoint(x, y + 8)
              const itemEl2 = el?.closest ? el.closest(".roulette-item") : null
              if (!itemEl2) {
                setResultId(reelItemsRef.current[bestIdx])
                setPhase("result")
                return
              }

              const idx = Number(itemEl2.getAttribute("data-index"))
              setResultId(reelItemsRef.current[idx])
              setPhase("result")
              return
            }

            const idx = Number(itemEl.getAttribute("data-index"))
            setResultId(reelItemsRef.current[idx])
            setPhase("result")
          })
        })
      }

      reel.addEventListener("transitionend", onEnd)
    }

    requestAnimationFrame(() => requestAnimationFrame(start))
  }, [phase, reelItems])

  useEffect(() => {
    const forceFinishSpin = () => {
      if (phase !== "spinning") return
      if (!pendingRef.current) return

      if (reelRef.current) {
        reelRef.current.style.transition = "none"
      }

      spinStartedRef.current = false
      setResultId(pendingRef.current.winner)
      setPhase("result")
    }

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        forceFinishSpin()
      }
    }

    const handlePageHide = () => {
      forceFinishSpin()
    }

    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("pagehide", handlePageHide)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("pagehide", handlePageHide)
    }
  }, [phase])

  useEffect(() => {
    if (phase === "idle" || phase === "result") {
      openLockRef.current = false
    }
  }, [phase])

  const sellItem = () => {
    setResultId(null)
    setReelItems([])
    pendingRef.current = null
    spinStartedRef.current = false
    tailFixTriesRef.current = 0
    setPhase("idle")
    openLockRef.current = false

    if (reelRef.current) {
      reelRef.current.style.transition = "none"
      reelRef.current.style.transform = "translate3d(0px,0,0)"
    }
  }

  const openAgain = () => {
    if (openLockRef.current) return
    sellItem()
    openCase()
  }

  const isSpinning = phase === "preparing" || phase === "spinning"

  return (
    <div className="app">
      <CaseHeader
        caseData={caseData}
        isSpinning={isSpinning}
        resultDrop={resultDrop}
        imgRef={imgRef}
        navigate={navigate}
        openCase={openCase}
        phase={phase}
      />

      <CaseRoulette
        isSpinning={isSpinning}
        wrapRef={wrapRef}
        lineRef={lineRef}
        reelRef={reelRef}
        reelItems={reelItems}
        dropMap={dropMap}
        pngSrcByDrop={pngSrcByDrop}
      />

      {!isSpinning && (
        <CaseDropsGrid
          drops={caseData.drops}
          activeDrop={activeDrop}
          animationsById={animationsById}
          handleClick={handleClick}
        />
      )}

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
