// 📄 src/utils/BoletinPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo_seminarios.png";

export const generarBoletinPDF = (boletin, doc = null, startY = 20) => {
  // ✅ localDoc se define ANTES del try, así siempre existe
  const localDoc = doc || new jsPDF();

  try {
    let y = startY;

    // === 🔹 Logo
    localDoc.addImage(logo, "PNG", 80, y, 50, 18);
    y += 25;

    // === 🔹 Fecha
    const fechaActual = new Date();
    const mesAnterior = new Date(fechaActual);
    mesAnterior.setMonth(fechaActual.getMonth() - 1);
    const opcionesFecha = { month: "long", year: "numeric" };
    const fechaFormateada = mesAnterior.toLocaleDateString(
      "es-PE",
      opcionesFecha
    );
    const fechaFinal =
      fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

    // === 🔹 Encabezado principal
    localDoc.setFont("helvetica", "bold");
    localDoc.setFontSize(20);
    localDoc.text("BOLETÍN DE CALIFICACIONES MENSUAL", 105, y, {
      align: "center",
    });
    localDoc.setFontSize(11);
    localDoc.text(`Reporte al cierre de ${fechaFinal}`, 195, y + 6, {
      align: "right",
    });
    y += 18;

    // === 🔹 Nombre del estudiante
    localDoc.setFont("helvetica", "bold");
    localDoc.setTextColor(0, 80, 0); // === 💡 CAMBIO 1: Verde oscuro ===
    localDoc.setFontSize(17);
    localDoc.text(boletin.estudiante || "-", 105, y, { align: "center" });
    y += 6;

    // === 🔹 Tabla principal
    autoTable(localDoc, {
      startY: y,
      head: [["AÑO EN SEMINARIO", "ESTACA", "BARRIO", "MAESTRO"]],
      body: [
        [
          boletin.aniostatus || "-",
          boletin.estaca || "-",
          boletin.barrio || "-",
          boletin.maestro || "-",
        ],
      ],
      theme: "grid",
      styles: { halign: "center", valign: "middle", fontSize: 10 },
      headStyles: {
        fillColor: [0, 80, 0], // === 💡 CAMBIO 2: Verde oscuro ===
        textColor: 255,
        fontStyle: "bold",
      },
    });

    let yAfter = localDoc.lastAutoTable.finalY + 8;

    // === 🔹 Sección de curso
    localDoc.setFillColor(0, 80, 0); // === 💡 CAMBIO 3: Verde oscuro ===
    localDoc.rect(14, yAfter, 181, 9, "F");
    localDoc.setTextColor(255, 255, 255);
    localDoc.setFontSize(11);
    localDoc.text(
      `${boletin.curso} ${boletin.anio} - Semestre ${boletin.periodo}`,
      105,
      yAfter + 6,
      { align: "center" }
    );
    yAfter += 14;

    // === 🔹 Tabla de asistencia
    localDoc.setTextColor(0, 0, 0);
    autoTable(localDoc, {
      startY: yAfter,
      head: [
        ["# Asistencias", "Faltas", "% Asistencia", "Tareas por recuperar"],
      ],
      body: [
        [
          boletin.asistencias || 0,
          boletin.faltas || 0,
          `${
            typeof boletin.asistenciaprom === "number" &&
            !isNaN(boletin.asistenciaprom)
              ? boletin.asistenciaprom
              : 0
          }%`,
          boletin.dpr || 0,
        ],
      ],
      theme: "grid",
      styles: { halign: "center", valign: "middle", fontSize: 10 },
      headStyles: {
        fillColor: [0, 80, 0], // === 💡 CAMBIO 4: Verde oscuro ===
        textColor: 255,
        fontStyle: "bold",
      },
    });
    yAfter = localDoc.lastAutoTable.finalY + 10;

    // === 🔹 Cuadro resumen (bloque de texto completo)
    localDoc.setDrawColor(0, 80, 0); // === 💡 CAMBIO 5: Verde oscuro ===
    localDoc.setFillColor(230, 255, 230); // === 💡 CAMBIO 6: Verde claro ===

    // Dimensiones base del recuadro
    const xInicio = 15;
    const anchoCaja = 180;
    const margenInterno = 8;
    const lineHeight = 6;

    // 🔹 Punto inicial del texto
    let yTexto = yAfter + 10;

    // 🔹 Dibuja el recuadro con relleno verde claro
    localDoc.roundedRect(xInicio, yAfter, anchoCaja, 70, 3, 3, "F");
    localDoc.setLineWidth(0.5);
    localDoc.rect(xInicio, yAfter, anchoCaja, 70);

    // === 🔹 Párrafo 1 (encabezado)
    localDoc.setFont("helvetica", "bold");
    localDoc.setTextColor(0, 0, 0);
    localDoc.setFontSize(11);
    localDoc.text(
      "Apreciado padre de familia, a continuación, encontrará un resumen del desempeño de su hijo/a de este período " +
        boletin.periodo +
        " de clases en Seminarios:",
      105,
      yTexto,
      { maxWidth: anchoCaja - 2 * margenInterno, align: "center" }
    );
    yTexto += lineHeight * 2;

    // === 🔹 Párrafo 2 (Asistencia)
    localDoc.setFont("helvetica", "bold");
    localDoc.text("Asistencia:", xInicio + margenInterno, yTexto, {
      underline: true,
    });

    const asistenciaValor =
      typeof boletin.asistenciaprom === "number" &&
      !isNaN(boletin.asistenciaprom)
        ? `${boletin.asistenciaprom}%`
        : "0%";

    localDoc.setFont("helvetica", "normal");
    const textoAsistencia = `Tienes un ${asistenciaValor} de asistencia, te invitamos a contactar tu maestro(a) para recuperar las clases pendientes.`;
    localDoc.text(textoAsistencia, xInicio + 35, yTexto, {
      maxWidth: anchoCaja - 45,
      align: "justify",
    });
    yTexto += lineHeight * 2;

    // === 🔹 Párrafo 3 (Lectura)
    localDoc.setFont("helvetica", "bold");
    localDoc.text("Lectura:", xInicio + margenInterno, yTexto, {
      underline: true,
    });

    localDoc.setFont("helvetica", "normal");
    const textoLectura = `Ahora los alumnos deben leer pasajes seleccionados de ${
      boletin.curso || "Doctrina y Convenios"
    } como requisito para certificar el curso. Una vez que el alumno lea todos los pasajes debe reportar al maestro y automáticamente tendrá el 100% de lectura.`;
    localDoc.text(textoLectura, xInicio + 35, yTexto, {
      maxWidth: anchoCaja - 45,
      align: "justify",
    });
    yTexto += lineHeight * 3;

    // === 🔹 Párrafo 4 (Evaluación)
    localDoc.setFont("helvetica", "bold");
    localDoc.text("Evaluación:", xInicio + margenInterno, yTexto, {
      underline: true,
    });

    localDoc.setFont("helvetica", "normal");
    const fechaEvaluacion =
      boletin.fechaEvaluacion || `27 de noviembre de ${boletin.anio || "2026"}`;

    localDoc.text(
      `Prepararse para presentar la evaluación de aprendizaje que se realizará el ${fechaEvaluacion}.`,
      xInicio + 35,
      yTexto,
      { maxWidth: anchoCaja - 45, align: "justify" }
    );

    // === 🔹 Firma
    const firmaY = yAfter + 80;
    localDoc.setFont("helvetica", "bold");
    localDoc.setTextColor(0, 80, 0); // === 💡 CAMBIO 7: Verde oscuro ===
    localDoc.text("Cordialmente,", 105, firmaY, { align: "center" });
    localDoc.text("Raúl Enrique León Elías", 105, firmaY + 8, {
      align: "center",
    });
    localDoc.text("Coordinador Seminarios e Institutos", 105, firmaY + 14, {
      align: "center",
    });
    localDoc.text(
      "Programa Piura Central | Celular: 969 337 257",
      105,
      firmaY + 20,
      {
        align: "center",
      }
    );

    // === 🔹 Guardar o retornar según el uso
    const barrio = (boletin.barrio || "Barrio")
      .trim()
      .replace(/[/\\?%*:|"<>]/g, "")
      .replace(/\s+/g, "_");
    const estudiante = (boletin.estudiante || "Alumno")
      .trim()
      .replace(/[/\\?%*:|"<>]/g, "")
      .replace(/\s+/g, "_");
    const fileName = `${barrio}-${estudiante}.pdf`;

    // ⚙️ Modo ZIP (no descargar, solo devolver)
    if (boletin.returnDoc) {
      return localDoc;
    }

    // ⚙️ Modo individual (descargar directamente)
    localDoc.save(fileName);

    // ✅ Retornar el documento (para ambos casos)
    return localDoc;
  } catch (err) {
    console.error("❌ Error al generar PDF individual:", err);
    // ✅ Retorna el documento aunque haya fallado para evitar undefined
    return localDoc;
  }
};
