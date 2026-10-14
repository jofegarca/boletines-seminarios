// 📄 src/utils/BoletinConsolidado.js
import jsPDF from "jspdf";
import { supabase } from "../supabaseClient.js";
import { generarBoletinPDF } from "./BoletinPDF";
import { fetchAllRows } from "./graduacionHelper.js";

/**
 * 🔹 Genera un único PDF consolidado con los boletines mensuales de todos los alumnos
 * del año y periodo actual, filtrando por estaca seleccionada.
 * Cada boletín ocupa una página del mismo PDF, ordenado por barrio y estudiante.
 */
export const generarBoletinConsolidado = async (estacaSeleccionada) => {
  try {
    const now = new Date();
    const currentAnio = now.getFullYear();
    const currentPeriodo = now.getMonth() + 1 >= 7 ? 2 : 1;

    // Obtener fecha de evaluación del catálogo periodosem
    let fechaEvaluacion = null;
    const { data: periodData } = await supabase
      .from("periodosem")
      .select("fechaevaluacion")
      .eq("anio", currentAnio)
      .eq("periodo", currentPeriodo)
      .maybeSingle();

    if (periodData?.fechaevaluacion) {
      fechaEvaluacion = periodData.fechaevaluacion;
    }

    // Consultar boletines filtrados con paginación completa
    let query = supabase
      .from("boletines")
      .select("*")
      .eq("anio", currentAnio)
      .eq("periodo", currentPeriodo);

    if (estacaSeleccionada && estacaSeleccionada !== "Todas") {
      query = query.eq("estaca", estacaSeleccionada);
    }

    const boletines = await fetchAllRows(query);

    if (!boletines || boletines.length === 0) {
      alert(
        `⚠️ No se encontraron boletines para ${estacaSeleccionada || "la estaca"} en el periodo ${currentAnio}-${currentPeriodo}.`
      );
      return;
    }

    // Ordenar por barrio y luego por estudiante
    const boletinesOrdenados = [...boletines].sort((a, b) => {
      const barrioA = (a.barrio || "").toLowerCase();
      const barrioB = (b.barrio || "").toLowerCase();
      if (barrioA < barrioB) return -1;
      if (barrioA > barrioB) return 1;
      return (a.estudiante || "").localeCompare(b.estudiante || "");
    });

    const doc = new jsPDF();

    // Generar boletines en el documento
    boletinesOrdenados.forEach((b, idx) => {
      if (idx > 0) {
        doc.addPage();
      }

      generarBoletinPDF(
        { ...b, fechaEvaluacion, returnDoc: true },
        doc,
        25
      );
    });

    const nombreEstaca =
      estacaSeleccionada?.replace(/\s+/g, "_") || "General";
    const nombreArchivo = `Consolidado_${nombreEstaca}_${currentAnio}-${currentPeriodo}.pdf`;
    doc.save(nombreArchivo);

    alert(
      `✅ PDF consolidado generado correctamente (${boletinesOrdenados.length} alumnos ordenados por barrio).`
    );
  } catch (err) {
    console.error("❌ Error al generar PDF consolidado:", err);
    alert("❌ Error generando PDF consolidado. Revisa la consola.");
  }
};
