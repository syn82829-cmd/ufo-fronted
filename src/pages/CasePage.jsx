import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef } from "react"
import Lottie from "lottie-react"

import { cases } from "../data/cases"
import { darkMatterAnimations } from "../data/animations"

function CasePage() {

  const { id } = useParams()
  const navigate = useNavigate()

  const caseData = cases[id]

  const [activeDrop, setActiveDrop] = useState(null)
  const [isRolling, setIsRolling] = useState(false)
  const [winner, setWinner] = useState(null)

  const rouletteRef = useRef(null)

  if (!caseData) {
    return <div className="app">Case config missing</div>
  }

  // запуск анимации NFT при клике
  const handleClick = (dropId) => {

    if (activeDrop === dropId) {
      setActiveDrop(null)
      setTimeout(() => setActiveDrop(dropId), 10)
    } else {
      setActiveDrop(dropId)
    }

  }

  // выбор победителя
  const pickWinner = () => {

    const total = caseData.drops.reduce((sum, d) => sum + d.chance, 0)
    let rand = Math.random() * total

    for (const drop of caseData.drops) {

      if (rand < drop.chance)
        return drop.id

      rand -= drop.chance

    }

    return caseData.drops[0].id

  }

  // создание длинной ленты рулетки
  const buildRoulette = () => {

    const items = []

    for (let i = 0; i < 60; i++) {

      const random =
        caseData.drops[
          Math.floor(Math.random() * caseData.drops.length)
        ]

      items.push(random.id)

    }

    return items

  }

  const [rouletteItems, setRouletteItems] = useState([])

  // запуск рулетки
  const startRoll = () => {

    if (isRolling) return

    setWinner(null)

    const winnerId = pickWinner()
    const items = buildRoulette()

    const winnerIndex = 45
    items[winnerIndex] = winnerId

    setRouletteItems(items)
    setIsRolling(true)

    setTimeout(() => {

      const itemWidth = 160
      const offset = winnerIndex * itemWidth

      rouletteRef.current.style.transform =
        `translateX(-${offset}px)`

    }, 100)

    setTimeout(() => {

      setIsRolling(false)
      setWinner(winnerId)

    }, 4500)

  }

  return (

    <div className="app">

      {/* HEADER */}

      <div className="casepage-header">

        <div className="casepage-title-row">

          <button
            className="casepage-header-btn casepage-back-btn"
            onClick={() => navigate(-1)}
          >
            ←
          </button>

          <div className="casepage-title">
            {caseData.name}
          </div>

          <button className="casepage-header-btn casepage-settings-btn">
            ⚙
          </button>

        </div>

        {/* показываем кейс только если не крутим */}
        {!isRolling && !winner && (

          <img
            src={caseData.image}
            className="casepage-case-image"
            alt={caseData.name}
          />

        )}

        {!isRolling && !winner && (

          <button
            className="casepage-open-btn"
            onClick={startRoll}
          >
            Открыть кейс
          </button>

        )}

      </div>


      {/* РУЛЕТКА — отдельный блок */}

      {isRolling && (

        <div className="roulette-wrapper">

          <div className="roulette-pointer" />

          <div
            className="roulette-track"
            ref={rouletteRef}
          >

            {rouletteItems.map((dropId, index) => (

              <div
                className="roulette-item"
                key={index}
              >

                <Lottie
                  animationData={
                    darkMatterAnimations[dropId]
                  }
                  autoplay
                  loop
                />

              </div>

            ))}

          </div>

        </div>

      )}


      {/* ПОБЕДИТЕЛЬ */}

      {winner && (

        <div className="winner-screen">

          <div className="winner-title">
            Поздравляем!
          </div>

          <div className="winner-card">

            <Lottie
              animationData={
                darkMatterAnimations[winner]
              }
              autoplay
              loop
            />

            <div className="drop-name">
              {winner}
            </div>

          </div>

          <div className="winner-buttons">

            <button className="btn-sell">
              Продать
            </button>

            <button
              className="btn-open"
              onClick={startRoll}
            >
              Открыть ещё
            </button>

          </div>

        </div>

      )}


      {/* DROPS */}

      {!isRolling && !winner && (

        <div className="casepage-drops">

          {caseData.drops.map((drop) => {

            const isActive =
              activeDrop === drop.id

            return (

              <div
                key={drop.id}
                className="drop-card"
                onClick={() =>
                  handleClick(drop.id)
                }
              >

                <Lottie
                  key={
                    isActive
                      ? drop.id + "-a"
                      : drop.id + "-i"
                  }
                  animationData={
                    darkMatterAnimations[drop.id]
                  }
                  autoplay={isActive}
                  loop={false}
                />

                <div className="drop-name">
                  {drop.name || drop.id}
                </div>

              </div>

            )

          })}

        </div>

      )}

    </div>

  )

}

export default CasePage
