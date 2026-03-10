export function getPlayerRank(casesOpened = 0, crashGamesPlayed = 0) {
  if (crashGamesPlayed >= 10) {
    return {
      id: "big_bang_initiator",
      name: "Big Bang Initiator",
      image: "/ui/ranks/big-bang-initiator.PNG",
    }
  }

  if (casesOpened >= 75) {
    return {
      id: "cosmic_architect",
      name: "Cosmic Architect",
      image: "/ui/ranks/cosmic-architect.PNG",
    }
  }

  if (casesOpened >= 35) {
    return {
      id: "void_commander",
      name: "Void Commander",
      image: "/ui/ranks/void-commander.PNG",
    }
  }

  if (casesOpened >= 15) {
    return {
      id: "stellar_navigator",
      name: "Stellar Navigator",
      image: "/ui/ranks/stellar-navigator.PNG",
    }
  }

  if (casesOpened >= 5) {
    return {
      id: "orbital_explorer",
      name: "Orbital Explorer",
      image: "/ui/ranks/orbital-explorer.PNG",
    }
  }

  return {
    id: "space_cadet",
    name: "Space Cadet",
    image: "/ui/ranks/space-cadet.PNG",
  }
}
