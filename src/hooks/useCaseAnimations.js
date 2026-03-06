import { useEffect, useState } from "react"

function useCaseAnimations(drops) {
  const [animationsById, setAnimationsById] = useState({})

  useEffect(() => {
    let cancelled = false

    async function loadAnimations() {
      const dropsWithLottie = (drops || []).filter((drop) => Boolean(drop.lottie))

      if (!dropsWithLottie.length) {
        setAnimationsById({})
        return
      }

      const entries = await Promise.all(
        dropsWithLottie.map(async (drop) => {
          try {
            const res = await fetch(drop.lottie)
            if (!res.ok) {
              throw new Error(`Failed to load ${drop.lottie}`)
            }

            const json = await res.json()
            return [drop.id, json]
          } catch (err) {
            console.error(`LOTTIE LOAD ERROR [${drop.id}]`, err)
            return [drop.id, null]
          }
        })
      )

      if (!cancelled) {
        setAnimationsById(Object.fromEntries(entries))
      }
    }

    loadAnimations()

    return () => {
      cancelled = true
    }
  }, [drops])

  return animationsById
}

export default useCaseAnimations
