// 📄 src/utils/GraduacionConsolidado.js
import jsPDF from "jspdf";
import { generarGraduacionPDF } from "./GraduacionPDF";
import { getGraduadosConHistorial } from "./graduacionHelper";

/**
 * Genera un único PDF consolidado con los informes de graduación de todos los alumnos
 * correspondientes a la estaca seleccionada, asegurando que ningún alumno se pierda
 * por diferencias tipográficas o de mayúsculas/minúsculas.
 */
export const generarGraduacionConsolidado = async (estacaSeleccionada) => {
  try {
    const { estudiantes, periodosem } = await getGraduadosConHistorial(
      estacaSeleccionada
    );

    if (!estudiantes || estudiantes.length === 0) {
      alert(
        "⚠️ No se encontraron alumnos de graduación para la estaca seleccionada."
      );
      return;
    }

    const currentAnio = new Date().getFullYear();
    const doc = new jsPDF();

    for (let i = 0; i < estudiantes.length; i++) {
      const item = estudiantes[i];

      if (i > 0) doc.addPage();

      await generarGraduacionPDF(
        { ...item.graduado, returnDoc: true },
        item.historialCompleto,
        periodosem,
        doc,
        25
      );
    }

    const nombreEstaca =
      estacaSeleccionada?.replace(/\s+/g, "_") || "General";
    const nombreArchivo = `Graduacion_${nombreEstaca}_${currentAnio}.pdf`;
    doc.save(nombreArchivo);

    alert(
      `✅ PDF consolidado de graduación generado con éxito (${estudiantes.length} alumnos ordenados por barrio).`
    );
  } catch (err) {
    console.error("❌ Error al generar consolidado de graduación:", err);
    alert(
      "❌ Error generando PDF consolidado de graduación. Revisa la consola."
    );
  }
};
