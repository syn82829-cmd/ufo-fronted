/* =============================
   ANIMATION PATHS FROM /public
   Теперь Lottie лежат в:
   public/animations/...
============================= */

export const darkMatterAnimationPaths = {
  darkhelmet: "/animations/darkmatter/darkhelmet.json",
  gift: "/animations/darkmatter/gift.json",
  westside: "/animations/darkmatter/westside.json",
  lowrider: "/animations/darkmatter/lowrider.json",
  watch: "/animations/darkmatter/watch.json",
  skull: "/animations/darkmatter/skull.json",
  dyson: "/animations/darkmatter/dyson.json",
  batman: "/animations/darkmatter/batman.json",
  poizon: "/animations/darkmatter/poizon.json",
  metla: "/animations/darkmatter/metla.json",
  ball: "/animations/darkmatter/ball.json",
  book: "/animations/darkmatter/book.json",
}

/* =============================
   PURPLE HOLE
   ключи должны совпадать с drop.id в cases.js
   cat — перед Kosak
   ily — в самом конце
============================= */
export const purpleHoleAnimationPaths = {
  cat: "/animations/purplehole/cat.json",
  Kosak: "/animations/purplehole/Kosak.json",
  Fen: "/animations/purplehole/Fen.json",
  Runa: "/animations/purplehole/Runa.json",
  Baklajan: "/animations/purplehole/Baklajan.json",
  Dog: "/animations/purplehole/Dog.json",
  kalendar: "/animations/purplehole/kalendar.json",
  Mokey: "/animations/purplehole/Mokey.json",
  Klever: "/animations/purplehole/Klever.json",
  Poo: "/animations/purplehole/Poo.json",
  Moon: "/animations/purplehole/Moon.json",
  ily: "/animations/purplehole/ily.json",
}

/* =============================
   HELPERS
============================= */

export async function loadAnimationJson(path) {
  const res = await fetch(path)
  if (!res.ok) {
    throw new Error(`Failed to load animation: ${path}`)
  }
  return res.json()
}

export async function loadAnimationMap(pathMap) {
  const entries = await Promise.all(
    Object.entries(pathMap).map(async ([key, path]) => {
      try {
        const json = await loadAnimationJson(path)
        return [key, json]
      } catch (err) {
        console.error(`ANIMATION LOAD ERROR [${key}]`, err)
        return [key, null]
      }
    })
  )

  return Object.fromEntries(entries)
}

/* =============================
   CASE ANIMATION LOADERS
============================= */

export async function loadDarkMatterAnimations() {
  return loadAnimationMap(darkMatterAnimationPaths)
}

export async function loadPurpleHoleAnimations() {
  return loadAnimationMap(purpleHoleAnimationPaths)
}

export async function loadCaseAnimations(caseId) {
  switch (caseId) {
    case "darkmatter":
      return loadDarkMatterAnimations()

    case "purplehole":
      return loadPurpleHoleAnimations()

    default:
      return {}
  }
}
