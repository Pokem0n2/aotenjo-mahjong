import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import AotenjoGame from './components/AotenjoGame';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/" element={<AotenjoGame />} />
          <Route path="/cheat" element={<AotenjoGame cheatMode={true} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
