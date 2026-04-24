import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Itens from "./pages/Itens";
import Movimentacoes from "./pages/Movimentacoes";
import Emprestimos from "./pages/Emprestimos";
import Membros from "./pages/Membros";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/itens" element={<Itens />} />
        <Route path="/movimentacoes" element={<Movimentacoes />} />
        <Route path="/emprestimos" element={<Emprestimos />} />
        <Route path="/membros" element={<Membros />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;