import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import Session from './pages/Session'
import Join from './pages/Join'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session/:joinCode" element={<Session />} />
        <Route path="/join/:joinCode" element={<Join />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
