import { useEffect, useState } from "react"
import { socket } from "../socket"

export default function LiveDrops() {
  const [drops, setDrops] = useState([])

  useEffect(() => {
    const handler = (data) => setDrops(data)

    socket.on("live:drops", handler)

    return () => socket.off("live:drops", handler)
  }, [])

  return (
    <div className="live-items">
      {drops.map((d, i) => (
        <div className="live-drop" key={`${d}-${i}`}>
          <img src={d} alt="" />
        </div>
      ))}
    </div>
  )
}
