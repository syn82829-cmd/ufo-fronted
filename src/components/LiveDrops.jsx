import { useEffect, useState, useMemo } from "react"

export default function LiveDrops() {
  const LIVE_DROPS = useMemo(
    () => [
      "/drops/Baklajan.png",
      "/drops/Dog.png",
      "/drops/Fen.png",
      "/drops/HeroicHelmet.png",
      "/drops/IonicDryer.png",
      "/drops/Klever.png",
      "/drops/Kosak.png",
      "/drops/LootBag.png",

      // 👉 сюда вставишь остальные (20–50+ файлов без проблем)
    ],
    []
  )

  const createInitial = () =>
    Array.from({ length: 6 }, () =>
      LIVE_DROPS[Math.floor(Math.random() * LIVE_DROPS.length)]
    )

  const [drops, setDrops] = useState(createInitial)

  useEffect(() => {
    let timeout

    const tick = () => {
      const random =
        LIVE_DROPS[Math.floor(Math.random() * LIVE_DROPS.length)]

      setDrops((prev) => [random, ...prev.slice(0, 5)])

      timeout = setTimeout(
        tick,
        2500 + Math.random() * 7000
      )
    }

    timeout = setTimeout(tick, 4000)

    return () => clearTimeout(timeout)
  }, [LIVE_DROPS])

  return (
    <div className="live-items">
      {drops.map((drop, i) => (
        <div className="live-drop" key={`${drop}-${i}`}>
          <img src={drop} alt="" loading="lazy" />
        </div>
      ))}
    </div>
  )
}
