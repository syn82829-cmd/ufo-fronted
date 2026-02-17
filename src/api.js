const API_URL = "https://ufo-backend-1.onrender.com";

export async function createUser() {

  const tg = window.Telegram.WebApp;
  const user = tg.initDataUnsafe.user;

  const res = await fetch(`${API_URL}/user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id: user.id,
      username: user.username
    })
  });

  return await res.json();
}


export async function getBalance(userId) {

  const res = await fetch(`${API_URL}/balance/${userId}`);

  return await res.json();
}
