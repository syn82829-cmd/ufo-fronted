import { useEffect, useState } from "react"
import { socket } from "../socket"

export default function LiveDrops() {
  const [drops, setDrops] = useState([])

  useEffect(() => {
    const handleLiveDrops = (data) => {
      setDrops(data || [])
    }

    socket.on("live:drops", handleLiveDrops)

    return () => {
      socket.off("live:drops", handleLiveDrops)
    }
  }, [])

  return (
    <div className="live-items">
      {drops.map((drop, i) => (
        <div className="live-drop" key={`${drop}-${i}`}>
          <img
            src={drop}
            alt=""
            loading="lazy"
            draggable={false}
          />
        </div>
      ))}
    </div>
  )
}
