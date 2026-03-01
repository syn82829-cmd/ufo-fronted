export const cases = {
  darkmatter: {
    id: "darkmatter",
    name: "Dark Matter",
    image: "/cases/case3.png.PNG",
    drops: [
      { id: "darkhelmet", chance: 5,  png: "HeroicHelmet" },
      { id: "gift",       chance: 10, png: "LootBag" },
      { id: "westside",   chance: 15, png: "WestsideSign" },
      { id: "lowrider",   chance: 20, png: "Lowrider" },
      { id: "watch",      chance: 20, png: "SwissWatch" },
      { id: "skull",      chance: 25, png: "skull" },
      { id: "dyson",      chance: 30, png: "IonicDryer" },
      { id: "batman",     chance: 8,  png: "batman" },
      { id: "poizon",     chance: 18, png: "poison" },
      { id: "metla",      chance: 22, png: "metla" },
      { id: "ball",       chance: 35, png: "ball" },
      { id: "book",       chance: 40, png: "book" }
    ]
  },

  firstpepe: {
    id: "firstpepe",
    name: "First Pepe",
    image: "/cases/firstpepe.png",
    drops: Array.from({ length: 12 }, (_, i) => ({
      id: `firstpepe_drop_${i + 1}`,
      chance: 10,
      png: "placeholder"
    }))
  },

  crash: {
    id: "crash",
    name: "Crash",
    image: "/cases/crash.png",
    drops: Array.from({ length: 12 }, (_, i) => ({
      id: `crash_drop_${i + 1}`,
      chance: 10,
      png: "placeholder"
    }))
  },

  godparticle: {
    id: "godparticle",
    name: "God Particle",
    image: "/cases/godparticle.png",
    drops: Array.from({ length: 12 }, (_, i) => ({
      id: `godparticle_drop_${i + 1}`,
      chance: 10,
      png: "placeholder"
    }))
  },

  purplehole: {
    id: "purplehole",
    name: "Purple Hole",
    image: "/cases/purplehole.png",
    drops: Array.from({ length: 12 }, (_, i) => ({
      id: `purplehole_drop_${i + 1}`,
      chance: 10,
      png: "placeholder"
    }))
  },

  spacetrash: {
    id: "spacetrash",
    name: "Space Trash",
    image: "/cases/spacetrash.png",
    drops: Array.from({ length: 12 }, (_, i) => ({
      id: `spacetrash_drop_${i + 1}`,
      chance: 10,
      png: "placeholder"
    }))
  },

  starfall: {
    id: "starfall",
    name: "Starfall",
    image: "/cases/starfall.png",
    drops: Array.from({ length: 12 }, (_, i) => ({
      id: `starfall_drop_${i + 1}`,
      chance: 10,
      png: "placeholder"
    }))
  },

  randomcase: {
    id: "randomcase",
    name: "Random Case",
    image: "/cases/randomcase.png",
    drops: Array.from({ length: 12 }, (_, i) => ({
      id: `randomcase_drop_${i + 1}`,
      chance: 10,
      png: "placeholder"
    }))
  }
}
