import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // 1. Importa el Router
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* 2. Envuelve <App /> y añade el 'basename' */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>
);
