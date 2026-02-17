const API_URL = "https://ufo-backend-1.onrender.com";


// СОЗДАНИЕ / ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЯ
export async function createUser(userData) {

  if (!userData || !userData.id) {
    throw new Error("Invalid user data")
  }

  const res = await fetch(`${API_URL}/user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id: userData.id,
      username: userData.username || ""
    })
  });

  if (!res.ok) {
    throw new Error("Failed to create user")
  }

  return await res.json();
}


// ПОЛУЧЕНИЕ БАЛАНСА
export async function getBalance(userId) {

  if (!userId) {
    throw new Error("User ID required")
  }

  const res = await fetch(`${API_URL}/balance/${userId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch balance")
  }

  return await res.json();
}
