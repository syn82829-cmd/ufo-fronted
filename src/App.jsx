import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import Profile from "./pages/Profile"
import Bonus from "./pages/Bonus"
import Giveaways from "./pages/Giveaways"
import CasePage from "./pages/CasePage"
import Crash from "./pages/Crash"

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/bonus" element={<Bonus />} />

        <Route path="/giveaways" element={<Giveaways />} />

        <Route path="/case/:id" element={<CasePage />} />

        <Route path="/crash" element={<Crash />} />

      </Routes>

    </BrowserRouter>

  )

}

export default App
