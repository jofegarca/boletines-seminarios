// 1. Quita "BrowserRouter as Router" de la importación
import { Routes, Route } from "react-router-dom";

import AvanceSeminarios from "./pages/AvanceSeminarios";
import EstudianteDetalle from "./pages/EstudianteDetalle";

export default function App() {
  return (
    // 2. Elimina la etiqueta <Router> que envolvía las rutas
    <Routes>
      <Route path="/" element={<AvanceSeminarios />} />
      <Route path="/estudiante/:nombre" element={<EstudianteDetalle />} />
    </Routes>
    // 3. Elimina la etiqueta de cierre </Router>
  );
}
