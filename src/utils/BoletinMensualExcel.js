// 📄 src/utils/BoletinMensualExcel.js
import { supabase } from "../supabaseClient.js";
import { fetchAllRows } from "./graduacionHelper.js";
import * as XLSX from "xlsx";

/**
 * Genera el reporte de Boletín Mensual en Excel manteniendo exactamente
 * las 10 columnas básicas iniciales:
 * estudiante, barrio, estaca, credito, asistenciaprom, dpr, lectura, examen, anio, periodo.
 */
export async function generarBoletinMensualExcel(selectedEstaca) {
  if (!selectedEstaca) {
    alert("Por favor, selecciona una Estaca primero.");
    return;
  }

  try {
    console.log("Generando reporte mensual para:", selectedEstaca);

    const now = new Date();
    const currentAnio = now.getFullYear();
    const currentPeriodo = now.getMonth() + 1 >= 7 ? 2 : 1;

    let query = supabase
      .from("boletines")
      .select("*")
      .eq("anio", currentAnio)
      .eq("periodo", currentPeriodo);

    if (selectedEstaca && selectedEstaca !== "Todas") {
      query = query.eq("estaca", selectedEstaca);
    }

    const boletines = await fetchAllRows(query);

    if (!boletines || boletines.length === 0) {
      alert(
        `No se encontraron estudiantes en el boletín mensual para ${selectedEstaca} (${currentAnio}-${currentPeriodo}).`
      );
      return;
    }

    // Ordenar por barrio y luego por estudiante
    const ordenados = [...boletines].sort((a, b) => {
      const barrioA = (a.barrio || "").toLowerCase();
      const barrioB = (b.barrio || "").toLowerCase();
      return (
        barrioA.localeCompare(barrioB) ||
        (a.estudiante || "").localeCompare(b.estudiante || "")
      );
    });

    // Mantener exactamente las 10 columnas básicas iniciales
    const data = ordenados.map((b) => ({
      estudiante: b.estudiante || "-",
      barrio: b.barrio || "-",
      estaca: b.estaca || "-",
      credito: b.credito || "No",
      asistenciaprom:
        typeof b.asistenciaprom === "number" ? b.asistenciaprom : 0,
      dpr: b.dpr ?? 0,
      lectura: b.lectura || "No",
      examen: b.examen || "No",
      anio: b.anio,
      periodo: b.periodo,
    }));

    // Convertir a hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(data);

    // Ajustar anchos de columna automáticos
    const objectMaxLength = data.reduce((acc, cur) => {
      Object.keys(cur).forEach((key, i) => {
        const len = cur[key] ? cur[key].toString().length : 0;
        acc[i] = Math.max(acc[i] || 0, len);
      });
      return acc;
    }, []);
    Object.keys(data[0]).forEach((key, i) => {
      objectMaxLength[i] = Math.max(objectMaxLength[i], key.length);
    });
    ws["!cols"] = objectMaxLength.map((w) => ({ wch: w + 2 }));

    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BoletinMensual");

    const nombreEstaca = selectedEstaca.replace(/\s+/g, "_");
    XLSX.writeFile(
      wb,
      `Boletin_Mensual_${nombreEstaca}_${currentAnio}_P${currentPeriodo}.xlsx`
    );

    alert(
      `✅ Excel mensual generado con éxito (${data.length} alumnos, 10 columnas básicas).`
    );
  } catch (error) {
    console.error("Error al generar el Excel mensual:", error);
    alert("Error: " + error.message);
  }
}
