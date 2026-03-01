export const cases = {
  darkmatter: {
    id: "darkmatter",
    name: "Dark Matter",
    image: "/cases/case3.png.PNG",
    drops: [
      { id: "darkhelmet", chance: 5, png: "HeroicHelmet" },
      { id: "gift", chance: 10, png: "LootBag" },
      { id: "westside", chance: 15, png: "WestsideSign" },
      { id: "lowrider", chance: 20, png: "Lowrider" },
      { id: "watch", chance: 20, png: "SwissWatch" },
      { id: "skull", chance: 25, png: "skull" },
      { id: "dyson", chance: 30, png: "IonicDryer" },
      { id: "batman", chance: 8, png: "batman" },
      { id: "poizon", chance: 18, png: "poison" },
      { id: "metla", chance: 22, png: "metla" },
      { id: "ball", chance: 35, png: "ball" },
      { id: "book", chance: 40, png: "book" },
    ],
  },

  firstpepe: {
    id: "firstpepe",
    name: "First Pepe",
    image: "/cases/case1.png.PNG",
    drops: Array.from({ length: 12 }, (_, i) => ({
      id: `firstpepe_drop_${i + 1}`,
      chance: 10,
      png: "placeholder",
    })),
  },

  crash: {
    id: "crash",
    name: "Crash",
    image: "/cases/case2.png.PNG",
    drops: Array.from({ length: 12 }, (_, i) => ({
      id: `crash_drop_${i + 1}`,
      chance: 10,
      png: "placeholder",
    })),
  },

  godparticle: {
    id: "godparticle",
    name: "God Particle",
    image: "/cases/case4.png.PNG",
    drops: Array.from({ length: 12 }, (_, i) => ({
      id: `godparticle_drop_${i + 1}`,
      chance: 10,
      png: "placeholder",
    })),
  },

  // ✅ Purple Hole — реальные id под lottie + 2 заглушки до 12 карточек
  purplehole: {
    id: "purplehole",
    name: "Purple Hole",
    image: "/cases/case5.png.PNG",
    drops: [
      { id: "Kosak", chance: 10, png: "placeholder" },
      { id: "Fen", chance: 10, png: "placeholder" },
      { id: "Runa", chance: 10, png: "placeholder" },
      { id: "Baklajan", chance: 10, png: "placeholder" },
      { id: "Dog", chance: 10, png: "placeholder" },
      { id: "kalendar", chance: 10, png: "placeholder" },
      { id: "Mokey", chance: 10, png: "placeholder" },
      { id: "Klever", chance: 10, png: "placeholder" },
      { id: "Poo", chance: 10, png: "placeholder" },
      { id: "Moon", chance: 10, png: "placeholder" },

      // 2 пустых слота, чтобы сетка была как у Dark Matter (12 ячеек)
      { id: "purplehole_placeholder_1", chance: 0, png: "placeholder" },
      { id: "purplehole_placeholder_2", chance: 0, png: "placeholder" },
    ],
  },

  spacetrash: {
    id: "spacetrash",
    name: "Space Trash",
    image: "/cases/case6.png.PNG",
    drops: Array.from({ length: 12 }, (_, i) => ({
      id: `spacetrash_drop_${i + 1}`,
      chance: 10,
      png: "placeholder",
    })),
  },

  starfall: {
    id: "starfall",
    name: "Starfall",
    image: "/cases/case7.png.PNG",
    drops: Array.from({ length: 12 }, (_, i) => ({
      id: `starfall_drop_${i + 1}`,
      chance: 10,
      png: "placeholder",
    })),
  },

  randomcase: {
    id: "randomcase",
    name: "Random Case",
    image: "/cases/case8.png.PNG",
    drops: Array.from({ length: 12 }, (_, i) => ({
      id: `randomcase_drop_${i + 1}`,
      chance: 10,
      png: "placeholder",
    })),
  },
}
