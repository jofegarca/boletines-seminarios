import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import EstacaFilter from "../components/EstacaFilter";
import BoletinButtons from "../components/BoletinButtons";
import SearchBar from "../components/SearchBar";
import BoletinList from "../components/BoletinList";
import "bootstrap/dist/css/bootstrap.min.css";

// Tu función de normalizar (está bien aquí)
const normalizeString = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

export default function AvanceSeminarios() {
  const [estacas, setEstacas] = useState([]);
  const [selectedEstaca, setSelectedEstaca] = useState(null);
  const [boletines, setBoletines] = useState([]); // Inicia vacío
  const [searchTerm, setSearchTerm] = useState(""); // 🔹 Cargar estacas únicas (Sin cambios)

  useEffect(() => {
    const fetchEstacas = async () => {
      const { data, error } = await supabase
        .from("boletines")
        .select("estaca")
        .not("estaca", "is", null);

      if (error) {
        console.error("❌ Error al cargar estacas:", error.message);
      } else {
        const uniqueEstacas = [
          ...new Set(data.map((item) => item.estaca).filter(Boolean)),
        ];
        console.log("✅ Estacas cargadas:", uniqueEstacas);
        setEstacas(uniqueEstacas);
      }
    };
    fetchEstacas();
  }, []);

  // 🔹 Cargar boletines (filtrando por estaca)
  // 💡 --- ¡AQUÍ ESTÁ LA CORRECCIÓN! --- 💡
  useEffect(() => {
    const fetchBoletines = async () => {
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;

      // La consulta AHORA incluye el .eq() directamente
      let query = supabase
        .from("boletines")
        .select("*")
        .eq("estaca", selectedEstaca) // Filtra por la estaca seleccionada
        .in("anio", [currentYear, previousYear]);

      const { data, error } = await query;
      if (error) console.error(error);
      else setBoletines(data);
    };

    // Solo ejecutamos la función si 'selectedEstaca' NO es null
    if (selectedEstaca) {
      fetchBoletines();
    } else {
      // Si 'selectedEstaca' es null (al inicio o si se deselecciona),
      // nos aseguramos de que la lista esté vacía.
      setBoletines([]);
    }
  }, [selectedEstaca]); // Se sigue disparando cuando selectedEstaca cambia // 🔹 Filtrado por nombre (Sin cambios)

  const normalizedSearch = normalizeString(searchTerm);
  const filteredBoletines = boletines.filter((b) =>
    normalizeString(b.estudiante || "").includes(normalizedSearch),
  ); // 🔹 Return (Sin cambios)

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4 fw-bold">Avance de Seminarios</h2>

      <EstacaFilter
        estacas={estacas}
        selectedEstaca={selectedEstaca}
        onSelect={setSelectedEstaca}
      />

      <div className="my-4">
        <BoletinButtons selectedEstaca={selectedEstaca} />
      </div>

      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <BoletinList boletines={filteredBoletines} />
    </div>
  );
}
