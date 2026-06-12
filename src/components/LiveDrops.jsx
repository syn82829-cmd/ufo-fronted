import { useEffect, useState } from "react"
import { socket } from "../socket"

export default function LiveDrops() {
  const [drops, setDrops] = useState([])

  useEffect(() => {
    socket.on("live:drops", (live) => {
      setDrops(live)
    })

    return () => socket.off("live:drops")
  }, [])

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
