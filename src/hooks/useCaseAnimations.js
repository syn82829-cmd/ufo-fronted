import { useEffect, useState } from "react"

function useCaseAnimations(drops, activeDropId) {
  const [animationsById, setAnimationsById] = useState({})

  useEffect(() => {
    let cancelled = false

    async function loadActiveAnimation() {
      if (!activeDropId) {
        setAnimationsById({})
        return
      }

      const activeDrop = (drops || []).find((drop) => drop?.id === activeDropId)

      if (!activeDrop?.lottie) {
        setAnimationsById({})
        return
      }

      try {
        const res = await fetch(activeDrop.lottie)
        if (!res.ok) {
          throw new Error(`Failed to load ${activeDrop.lottie}`)
        }

        const json = await res.json()

        if (!cancelled) {
          setAnimationsById({
            [activeDrop.id]: json,
          })
        }
      } catch (err) {
        console.error(`LOTTIE LOAD ERROR [${activeDrop.id}]`, err)

        if (!cancelled) {
          setAnimationsById({})
        }
      }
    }

    loadActiveAnimation()

    return () => {
      cancelled = true
    }
  }, [drops, activeDropId])

  return animationsById
}

export default useCaseAnimations
