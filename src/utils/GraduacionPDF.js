import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../assets/logo_seminarios.png";

/**
 * Genera el PDF individual del informe de créditos de graduación.
 *
 * @param {Object} graduado       // fila de 'graduacion' (estudiante, fechagraduacion (texto), etc.)
 * @param {Array}  boletines      // filas de 'boletines' SOLO del estudiante
 * @param {Array}  periodos       // filas de 'periodosem' (anio, periodo) para construir el rango esperado
 * @param {Object} doc            // (opcional) doc existente para consolidado
 * @param {number} startY         // (opcional) top inicial
 */
export const generarGraduacionPDF = async (
  graduado,
  boletines = [],
  periodos = [],
  doc = null,
  startY = 5
) => {
  const localDoc = doc || new jsPDF();
  try {
    let y = startY;
    const currentYear = new Date().getFullYear();
    const now = new Date();
    const currentAnio = now.getFullYear();
    // === Periodo actual coherente con el resto del sistema (Semestre 2 a partir de Julio)
    const currentPeriodo = now.getMonth() + 1 >= 7 ? 2 : 1;

    // === Logo
    localDoc.addImage(logo, "PNG", 80, y, 50, 18);
    y += 25;

    // === Título
    localDoc.setFont("helvetica", "bold");
    localDoc.setFontSize(20);
    localDoc.setTextColor(0, 0, 0);
    localDoc.text(`Informe de Créditos de Seminarios ${currentYear}`, 105, y, {
      align: "center",
    });
    y += 10;

    // === Nombre
    localDoc.setFontSize(17);
    localDoc.text(graduado.estudiante || "-", 105, y, { align: "center" });
    y += 6;

    // === Tomar Estaca/Barrio del último boletín disponible
    const boletinesValidos = [...boletines].filter(
      (b) =>
        Number(b.anio) < currentAnio ||
        (Number(b.anio) === currentAnio && Number(b.periodo) <= currentPeriodo)
    );

    const boletinMasReciente =
      boletinesValidos.sort((a, b) =>
        a.anio === b.anio ? b.periodo - a.periodo : b.anio - a.anio
      )[0] || boletines[0] || null;

    const estaca = boletinMasReciente?.estaca || "No inscrito";
    const barrio = boletinMasReciente?.barrio || "No inscrito";

    autoTable(localDoc, {
      startY: y,
      head: [["Estaca/Distrito", "Barrio/Rama"]],
      body: [[estaca, barrio]],
      theme: "grid",
      styles: { halign: "center", valign: "middle", fontSize: 10 },
      headStyles: { fillColor: [150, 0, 0], textColor: 255, fontStyle: "bold" },
    });
    y = localDoc.lastAutoTable.finalY + 10;

    // === Párrafo (fechagraduacion es texto literal)
    const fechaGrad =
      typeof graduado.fechagraduacion === "string" &&
      graduado.fechagraduacion.trim()
        ? graduado.fechagraduacion
        : "sábado 06 de diciembre de 2025";

    localDoc.setFontSize(11);

    const x = 15;
    let yPos = y;
    const maxWidth = 180; // ancho máximo del texto dentro de la caja
    const lineHeight = 6;

    // === Texto dividido con formato ===
    const partes = [
      { texto: "Apreciado padre de familia: ", bold: true },
      {
        texto:
          "Deseamos presentar una actualización del progreso de su hijo(a) hacia la graduación de seminarios, siendo que está dentro del potencial para graduarse este año. Para ello debe tener 4 créditos acumulados. En este informe podrá ver el",
        bold: false,
      },
      { texto: "historial de períodos anteriores", bold: true },
      {
        texto:
          ', en la columna "Curso acreditado" apreciará los cursos que ha recibido crédito. Si tiene cursos anteriores que no ha completado, podrá observar lo que tiene pendiente por presentar a su maestro(a) antes del ',
        bold: false,
      },
      { texto: fechaGrad, bold: true },
      {
        texto:
          ". Les recordamos que para completar los requisitos de graduación debe certificar el semestre en curso y tener una entrevista con el Obispo o presidente de Rama antes de la graduación. Deseamos que pueda ayudar a su hijo(a) a prepararse para la graduación.",
        bold: false,
      },
    ];

    // === Convertir el texto total en palabras con formato ===
    let palabrasFormateadas = [];
    partes.forEach((parte) => {
      parte.texto.split(" ").forEach((p) => {
        palabrasFormateadas.push({ palabra: p, bold: parte.bold });
      });
    });

    // === Renderizar palabra por palabra (alineado justificado) ===
    let linea = [];
    let anchoActual = 0;
    let yInicialCaja = yPos; // inicio del bloque

    for (let i = 0; i < palabrasFormateadas.length; i++) {
      const { palabra, bold } = palabrasFormateadas[i];
      localDoc.setFont("helvetica", bold ? "bold" : "normal");
      const palabraWidth = localDoc.getTextWidth(palabra + " ");

      if (anchoActual + palabraWidth > maxWidth) {
        const totalAncho = anchoActual;
        const espacioExtra = (maxWidth - totalAncho) / (linea.length - 1 || 1);
        let cursorX = x;

        for (let j = 0; j < linea.length; j++) {
          localDoc.setFont("helvetica", linea[j].bold ? "bold" : "normal");
          localDoc.text(linea[j].palabra, cursorX, yPos);
          cursorX +=
            localDoc.getTextWidth(linea[j].palabra + " ") + espacioExtra;
        }

        yPos += lineHeight;
        linea = [{ palabra, bold }];
        anchoActual = palabraWidth;
      } else {
        linea.push({ palabra, bold });
        anchoActual += palabraWidth;
      }
    }

    // Última línea (sin justificar)
    let cursorX = x;
    for (const item of linea) {
      localDoc.setFont("helvetica", item.bold ? "bold" : "normal");
      localDoc.text(item.palabra + " ", cursorX, yPos);
      cursorX += localDoc.getTextWidth(item.palabra + " ");
    }

    // === Dibujar recuadro con bordes redondeados ===
    const margenHorizontal = 5;
    const margenVertical = 5; // <-- añade espacio superior e inferior
    const altoCaja = yPos - yInicialCaja + lineHeight + margenVertical; // más espacio visual
    const anchoCaja = maxWidth + margenHorizontal * 2; // se ajusta bien al texto
    const xCaja = x - margenHorizontal;
    const yCaja = yInicialCaja - margenVertical - 2; // pequeño ajuste para simetría
    const radio = 3;

    localDoc.setDrawColor(200, 0, 0); // rojo suave
    localDoc.setLineWidth(0.5);
    localDoc.roundedRect(xCaja, yCaja, anchoCaja, altoCaja, radio, radio);

    y += 50;

    // === Construir el rango esperado de periodos HASTA el actual (misma lógica de EstudianteDetalle)
    // periodos proviene de 'periodosem' y puede traer muchos años;
    // filtramos hasta el año/periodo actual y ordenamos DESC (más reciente primero).
    const periodosHastaActual = [...periodos]
      .filter(
        (p) =>
          Number(p.anio) < currentAnio ||
          (Number(p.anio) === currentAnio && Number(p.periodo) <= currentPeriodo)
      )
      .sort((a, b) =>
        a.anio === b.anio ? b.periodo - a.periodo : b.anio - a.anio
      );

    // === Para cada periodo esperado, buscar registro de boletines o rellenar "No inscrito"
    const filasHistorial = periodosHastaActual.map((p) => {
      const regs = boletines.filter(
        (b) =>
          Number(b.anio) === Number(p.anio) &&
          Number(b.periodo) === Number(p.periodo)
      );

      // Si hay varios registros del mismo periodo, priorizar el acreditado ('Si')
      const reg =
        regs.find((b) => (b.credito || "").toLowerCase() === "si") || regs[0];

      return {
        anio: p.anio,
        periodo: p.periodo,
        curso: reg?.curso || "No inscrito",
        asistenciaprom: reg
          ? typeof reg.asistenciaprom === "number"
            ? `${reg.asistenciaprom}%`
            : `${reg.asistenciaprom || 0}%`
          : "No inscrito",
        dpr: reg ? (reg.dpr ?? 0) : "-",
        lectura: reg?.lectura || "No inscrito",
        examen: reg?.examen || "No inscrito", // Evaluación = examen
        credito: reg?.credito || "No inscrito", // Curso acreditado = crédito
      };
    });

    // 💡 NOTA: Lógica de colores comentada temporalmente a petición del usuario.
    // Dejada como referencia para activarla o ajustarla en el futuro.
    /*
    const softColors = [
      [255, 255, 255], // Blanco
      [255, 255, 224], // Amarillo suave
      [230, 240, 255], // Azul suave
      [230, 255, 230], // Verde suave
      [230, 242, 255], // Azul claro
    ];

    const courseColorMap = {};
    let colorIndex = 0;
    */

    // === Tabla sin colores de fondo en celdas ===
    autoTable(localDoc, {
      startY: y,
      head: [
        [
          "Año y período",
          "Curso",
          "Asistencia",
          "Días por recuperar",
          "Lectura",
          "Evaluación",
          "Curso acreditado",
        ],
      ],
      body: filasHistorial.map((r) => [
        `${r.anio}-${r.periodo}`,
        r.curso,
        r.asistenciaprom,
        r.dpr,
        r.lectura,
        r.examen,
        r.credito,
      ]),
      theme: "grid",
      styles: { halign: "center", fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [150, 0, 0], textColor: 255, fontStyle: "bold" },

      /*
      // Comentado para salir sin colores de fondo:
      didParseCell: (data) => {
        if (data.row.section === "body") {
          const curso = data.row.cells[1]?.text?.[0] || "";

          if (curso === "No inscrito") {
            data.cell.styles.fillColor = [255, 255, 255];
            data.cell.styles.textColor = [130, 130, 130];
          } else {
            if (!courseColorMap[curso]) {
              courseColorMap[curso] = softColors[colorIndex % softColors.length];
              colorIndex++;
            }
            data.cell.styles.fillColor = courseColorMap[curso];
            data.cell.styles.textColor = [0, 0, 0];
          }
        }
      },
      */
    });

    y = localDoc.lastAutoTable.finalY + 8;

    // === Cita y firma
    localDoc.setFont("helvetica", "italic");
    localDoc.setFontSize(10);
    localDoc.text(
      "“Graduarse de Seminarios… aumentará su capacidad para sobresalir en las cosas más importantes que harán en la vida. ¡Sentirán verdadero gozo!” – Presidente Russell M. Nelson",
      105,
      y,
      { align: "center", maxWidth: 180 }
    );

    y += 15;
    localDoc.setFont("helvetica", "bold");
    localDoc.setTextColor(0, 0, 0);
    localDoc.text("Cordialmente,", 105, y, { align: "center" });
    localDoc.text("Raúl Enrique León Elías", 105, y + 5, { align: "center" });
    localDoc.text("Coordinador Seminarios e Institutos", 105, y + 10, {
      align: "center",
    });
    localDoc.text("Teléfono: 969 337 257", 105, y + 15, { align: "center" });

    // === Guardar o retornar
    if (graduado.returnDoc) return localDoc;

    const fileBarrio = (barrio || "Barrio").replace(/\s+/g, "_");
    const fileAlumno = (graduado.estudiante || "Alumno").replace(/\s+/g, "_");
    localDoc.save(`${fileBarrio}-${fileAlumno}_graduacion.pdf`);
    return localDoc;
  } catch (err) {
    console.error("❌ Error al generar PDF de graduación:", err);
    return localDoc;
  }
};
