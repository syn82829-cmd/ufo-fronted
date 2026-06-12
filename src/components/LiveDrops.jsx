import { useEffect, useState } from "react"
import { socket } from "../socket"

export default function LiveDrops() {
  const [drops, setDrops] = useState([])

  useEffect(() => {
    const handleDrops = (items) => {
      setDrops(items)
    }

    socket.on("live:drops", handleDrops)

    return () => {
      socket.off("live:drops", handleDrops)
    }
  }, [])

  return (
    <div className="live-items">
      {drops.map((drop, i) => (
        <div
          className="live-drop"
          key={i}
        >
          <img
            src={drop.image}
            alt=""
            loading="lazy"
          />
        </div>
      ))}
    </div>
  )
}
