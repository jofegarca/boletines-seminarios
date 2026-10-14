// 📄 src/utils/GraduacionZip.js
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { generarGraduacionPDF } from "./GraduacionPDF";
import { getGraduadosConHistorial } from "./graduacionHelper";

/**
 * Genera informes individuales de graduación en PDF para todos los alumnos de la estaca
 * y los empaqueta en carpetas organizadas por barrio dentro de un archivo ZIP.
 */
export const generarGraduacionZip = async (estacaSeleccionada) => {
  try {
    const { estudiantes, periodosem } = await getGraduadosConHistorial(
      estacaSeleccionada
    );

    if (!estudiantes || estudiantes.length === 0) {
      alert("⚠️ No hay alumnos de graduación que cumplan el filtro de estaca.");
      return;
    }

    const currentAnio = new Date().getFullYear();
    const zip = new JSZip();
    const tituloEstaca = (estacaSeleccionada || "General").replace(/\s+/g, "_");
    const carpetaRaiz = zip.folder(`Graduacion_${tituloEstaca}_${currentAnio}`);

    // Agrupar por barrio
    const agrupadoPorBarrio = {};
    estudiantes.forEach((item) => {
      const key = (item.barrio || "Sin_Barrio").replace(/\s+/g, "_");
      if (!agrupadoPorBarrio[key]) agrupadoPorBarrio[key] = [];
      agrupadoPorBarrio[key].push(item);
    });

    for (const barrio in agrupadoPorBarrio) {
      const folderBarrio = carpetaRaiz.folder(barrio);
      const alumnos = agrupadoPorBarrio[barrio];

      for (const item of alumnos) {
        const pdfDoc = await generarGraduacionPDF(
          { ...item.graduado, returnDoc: true },
          item.historialCompleto,
          periodosem
        );

        const blob = pdfDoc.output("blob");
        const fileName = `${(item.estudiante || "Alumno").replace(
          /\s+/g,
          "_"
        )}_graduacion.pdf`;
        folderBarrio.file(fileName, blob);
      }
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const nombreZip = `Graduacion_${tituloEstaca}_${currentAnio}.zip`;
    saveAs(zipBlob, nombreZip);

    alert(
      `✅ ZIP de Graduación generado correctamente (${estudiantes.length} alumnos organizados en ${Object.keys(agrupadoPorBarrio).length} barrios).`
    );
  } catch (err) {
    console.error("❌ Error al generar ZIP de Graduación:", err);
    alert("❌ Error generando ZIP de Graduación. Revisa la consola.");
  }
};
