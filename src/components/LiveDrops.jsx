import { memo, useEffect, useState } from "react"
import { socket } from "../socket"

function LiveDrops() {
  const [drops, setDrops] = useState([])

  useEffect(() => {
    const handleDrops = (items) => {
      setDrops(Array.isArray(items) ? items : [])
    }

    socket.on("live:drops", handleDrops)

    socket.emit("live:drops:get")

    return () => {
      socket.off("live:drops", handleDrops)
    }
  }, [])

  return (
    <div className="live-items">
      {drops.map((drop, i) => (
        <div
          className="live-drop"
          key={`${drop.image || "drop"}-${drop.name || ""}-${drop.price || ""}-${i}`}
        >
          <img
            src={drop.image}
            alt=""
            loading="eager"
            decoding="async"
            draggable={false}
          />
        </div>
      ))}
    </div>
  )
}

export default memo(LiveDrops)
