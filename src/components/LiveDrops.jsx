import { useEffect, useState } from "react"
import { socket } from "../socket"

export default function LiveDrops() {
  const [drops, setDrops] = useState([])

  useEffect(() => {
    const handleAddDrop = (newDrop) => {
      setDrops((prev) => [newDrop, ...prev.slice(0, 5)])
    }

    socket.on("live:drops:add", handleAddDrop)

    return () => socket.off("live:drops:add", handleAddDrop)
  }, [])

  return (
    <div className="live-items">
      {drops.map((drop, i) => (
        <div className="live-drop" key={`${drop}-${i}`}>
          <img src={drop} alt="" loading="lazy" draggable={false} />
        </div>
      ))}
    </div>
  )
}
