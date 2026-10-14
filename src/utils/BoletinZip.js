// 📄 src/utils/BoletinZip.js
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generarBoletinPDF } from "./BoletinPDF";
import { supabase } from "../supabaseClient.js";
import { fetchAllRows } from "./graduacionHelper.js";

/**
 * 🔹 Genera boletines individuales (BoletinPDF.js)
 * y los comprime en carpetas por barrio dentro de un ZIP.
 * Filtra por estaca seleccionada, año y periodo actual.
 */
export const generarBoletinZip = async (estacaSeleccionada) => {
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

    // Consultar boletines filtrados por año, periodo y estaca
    let query = supabase
      .from("boletines")
      .select("*")
      .eq("anio", currentAnio)
      .eq("periodo", currentPeriodo);

    if (estacaSeleccionada && estacaSeleccionada !== "Todas") {
      query = query.eq("estaca", estacaSeleccionada);
    }

    query = query.order("estudiante", {
      ascending: true,
    });

    const boletines = await fetchAllRows(query);

    if (!boletines || boletines.length === 0) {
      alert(
        `⚠️ No se encontraron boletines para ${estacaSeleccionada || "la estaca"} en el periodo ${currentAnio}-${currentPeriodo}.`
      );
      return;
    }

    // Crear estructura de carpetas
    const zip = new JSZip();
    const carpetaPrincipal = zip.folder(
      `Boletines_${
        estacaSeleccionada?.replace(/\s+/g, "_") || "General"
      }_${currentAnio}-${currentPeriodo}`
    );

    // Agrupar boletines por barrio
    const barriosMap = {};
    boletines.forEach((b) => {
      const barrio = (b.barrio || "Sin_Barrio").replace(/\s+/g, "_");
      if (!barriosMap[barrio]) barriosMap[barrio] = [];
      barriosMap[barrio].push(b);
    });

    // Generar cada PDF y agregarlo a su carpeta correspondiente
    for (const barrio in barriosMap) {
      const folderBarrio = carpetaPrincipal.folder(barrio);
      const estudiantes = barriosMap[barrio];

      for (const b of estudiantes) {
        const pdfDoc = await generarBoletinPDF({
          ...b,
          fechaEvaluacion,
          returnDoc: true,
        });
        const pdfBlob = pdfDoc.output("blob");

        // Nombre de archivo sanitizado
        const estudianteSanitizado = (b.estudiante || "Alumno")
          .trim()
          .replace(/[/\\?%*:|"<>]/g, "")
          .replace(/\s+/g, "_");
        const fileName = `${estudianteSanitizado}.pdf`;

        folderBarrio.file(fileName, pdfBlob);
      }
    }

    // Generar el ZIP final
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const nombreZip = `Boletines_${
      estacaSeleccionada?.replace(/\s+/g, "_") || "General"
    }_${currentAnio}-${currentPeriodo}.zip`;

    saveAs(zipBlob, nombreZip);
    alert(
      `✅ ZIP generado correctamente (${boletines.length} boletines organizados en ${Object.keys(barriosMap).length} barrios).`
    );
  } catch (err) {
    console.error("❌ Error al generar ZIP de boletines:", err);
    alert("❌ Error generando ZIP. Revisa la consola para más detalles.");
  }
};
