import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import CasePage from "./pages/CasePage"
import Crash from "./pages/Crash"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/case/:id" element={<CasePage />} />
        <Route path="/crash" element={<Crash />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
