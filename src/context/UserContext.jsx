import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { createUser } from "../api"

const UserContext = createContext(null)

function getTelegramUser() {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user

  if (tgUser) {
    return {
      id: tgUser.id,
      username: tgUser.username || "",
      photoUrl: tgUser.photo_url || "",
    }
  }

  return {
    id: 999999999,
    username: "test_user",
    photoUrl: "",
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState({
    id: "—",
    username: "Гость",
    balance: 0,
    photoUrl: "",
    casesOpened: 0,
    crashGamesPlayed: 0,
    crashWins: 0,
  })

  const [isUserLoading, setIsUserLoading] = useState(true)

  const refreshUser = async () => {
    const tgUser = getTelegramUser()

    try {
      const dbUser = await createUser({
        id: tgUser.id,
        username: tgUser.username,
      })

      setUser({
        id: dbUser.telegram_id,
        username: dbUser.username || tgUser.username || "Гость",
        balance: dbUser.balance ?? 0,
        photoUrl: tgUser.photoUrl || tgUser.photo_url || "",
        casesOpened: Number(dbUser.casesOpened || 0),
        crashGamesPlayed: Number(dbUser.crashGamesPlayed || 0),
        crashWins: Number(dbUser.crashWins || 0),
      })
    } catch (err) {
      console.error("USER CONTEXT ERROR:", err)

      setUser({
        id: tgUser.id || "—",
        username: tgUser.username || "Гость",
        balance: 0,
        photoUrl: tgUser.photoUrl || "",
        casesOpened: 0,
        crashGamesPlayed: 0,
        crashWins: 0,
      })
    } finally {
      setIsUserLoading(false)
    }
  }

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
    }

    refreshUser()
  }, [])

  const value = useMemo(() => {
    return {
      user,
      setUser,
      refreshUser,
      isUserLoading,
    }
  }, [user, isUserLoading])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error("useUser must be used inside UserProvider")
  }

  return context
}
