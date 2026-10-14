// 📄 src/utils/BoletinGraduacionExcel.js
import * as XLSX from "xlsx";
import { getGraduadosConHistorial } from "./graduacionHelper";

/**
 * Genera el reporte en Excel de graduación para la estaca seleccionada,
 * garantizando que todos los estudiantes del programa estén incluidos con su
 * historial completo de los 4 años (8 periodos) y sin duplicados ni omisiones.
 */
export async function generarBoletinGraduacionExcel(selectedEstaca) {
  if (!selectedEstaca) {
    alert("Por favor, selecciona una Estaca primero.");
    return;
  }

  try {
    console.log("Generando reporte de graduación para:", selectedEstaca);

    const { estudiantes } = await getGraduadosConHistorial(selectedEstaca);

    if (!estudiantes || estudiantes.length === 0) {
      alert(
        "No se encontraron estudiantes en el reporte de graduación para esta Estaca."
      );
      return;
    }

    const currentAnio = new Date().getFullYear();

    const periods = [
      { suffix: "actual_p2", anio: currentAnio, periodo: 2 },
      { suffix: "actual_p1", anio: currentAnio, periodo: 1 },
      { suffix: "prev1_p2", anio: currentAnio - 1, periodo: 2 },
      { suffix: "prev1_p1", anio: currentAnio - 1, periodo: 1 },
      { suffix: "prev2_p2", anio: currentAnio - 2, periodo: 2 },
      { suffix: "prev2_p1", anio: currentAnio - 2, periodo: 1 },
      { suffix: "prev3_p2", anio: currentAnio - 3, periodo: 2 },
      { suffix: "prev3_p1", anio: currentAnio - 3, periodo: 1 },
    ];

    const data = estudiantes.map((item) => {
      const bAlumno = item.historialCompleto;

      const row = {
        estudiante: item.estudiante,
        barrio: item.barrio,
        estaca: item.estaca,
      };

      let totalCreditosPast = 0;
      let hasFailedPast = false;

      for (const p of periods) {
        const matchingB = bAlumno.filter(
          (b) =>
            Number(b.anio) === Number(p.anio) &&
            Number(b.periodo) === Number(p.periodo)
        );
        const bPeriod =
          matchingB.find(
            (b) => (b.credito || "").toLowerCase() === "si"
          ) || matchingB[0];

        if (bPeriod) {
          row[`credito_${p.suffix}`] = bPeriod.credito || "No";
          row[`asistenciaprom_${p.suffix}`] =
            typeof bPeriod.asistenciaprom === "number"
              ? bPeriod.asistenciaprom
              : 0;
          row[`dpr_${p.suffix}`] =
            typeof bPeriod.dpr === "number" ? bPeriod.dpr : 0;
          row[`lectura_${p.suffix}`] = bPeriod.lectura || "No";
          row[`examen_${p.suffix}`] = bPeriod.examen || "No";

          if (p.suffix !== "actual_p2") {
            if ((bPeriod.credito || "").toLowerCase() === "si") {
              totalCreditosPast++;
            } else {
              hasFailedPast = true;
            }
          }
        } else {
          row[`credito_${p.suffix}`] = "NI";
          row[`asistenciaprom_${p.suffix}`] = 0;
          row[`dpr_${p.suffix}`] = 0;
          row[`lectura_${p.suffix}`] = "NI";
          row[`examen_${p.suffix}`] = "NI";
        }
      }

      const isTrabajar =
        !hasFailedPast ||
        totalCreditosPast >= 4 ||
        (totalCreditosPast >= 3 && row.credito_actual_p2 !== "NI");

      row.status =
        (totalCreditosPast >= 4 && !hasFailedPast) || isTrabajar
          ? "Trabajar en Graduación"
          : "No Certifica";

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);

    // Ajustar anchos de columna
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

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ReporteGraduacion");

    const anio = new Date().getFullYear();
    const nombreEstaca = selectedEstaca.replace(/\s+/g, "_");
    XLSX.writeFile(wb, `Reporte_Graduacion_${nombreEstaca}_${anio}.xlsx`);

    alert(
      `✅ Excel de graduación generado con éxito (${data.length} alumnos incluidos).`
    );
  } catch (error) {
    console.error("Error al generar el Excel de graduación:", error);
    alert("Error: " + error.message);
  }
}
