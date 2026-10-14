// 📄 src/pages/EstudianteDetalle.js
// (Copia y pega todo este código)

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Button, Card, Table, Container } from "react-bootstrap";
import { generarBoletinPDF } from "../utils/BoletinPDF";
import { generarGraduacionPDF } from "../utils/GraduacionPDF";
import { areSameStudents } from "../utils/graduacionHelper";

export default function EstudianteDetalle() {
  const { nombre } = useParams();
  const navigate = useNavigate();
  const [boletines, setBoletines] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [graduado, setGraduado] = useState(null); // Iniciar como null para saber si ya cargó

  useEffect(() => {
    const fetchData = async () => {
      const { data: boletinData, error: boletinError } = await supabase
        .from("boletines")
        .select("*")
        .ilike("estudiante", nombre.trim())
        .order("numaniostatus", { ascending: false }); // <-- Ordena por el más reciente

      if (boletinError) console.error(boletinError);
      else setBoletines(boletinData || []);

      const { data: periodosData, error: periodosError } = await supabase
        .from("periodosem")
        .select("*")
        .order("anio", { ascending: false })
        .order("periodo", { ascending: false });

      if (periodosError) console.error(periodosError);
      else setPeriodos(periodosData || []);

      // 💡 AJUSTE: Usar .maybeSingle() para obtener un objeto o null
      const { data: grad, error: gradErr } = await supabase
        .from("graduacion")
        .select("*")
        .ilike("estudiante", nombre.trim())
        .maybeSingle(); // <-- Devuelve un objeto o null, no un array

      if (gradErr) console.error(gradErr);
      if (grad) {
        setGraduado(grad);
      } else {
        const { data: allGrads } = await supabase.from("graduacion").select("*");
        const match = (allGrads || []).find((g) => areSameStudents(g.estudiante, nombre));
        setGraduado(match || null);
      }
    };

    fetchData();
  }, [nombre]);

  if (boletines.length === 0)
    return (
      <Container className="py-5 text-center">
        <p>No se encontraron datos para {nombre}</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Regresar
        </Button>
      </Container>
    );

  // 'alumno' sigue siendo el registro más reciente para los datos generales
  const alumno = boletines[0];

  const totalCreditos = boletines.reduce(
    (sum, b) => sum + (b.valorcredito || 0),
    0
  );

  const now = new Date();
  const currentAnio = now.getFullYear();
  // === 💡 CORRECCIÓN 1: Lógica de Período ===
  // "Mes 7 (Julio) o mayor" es Período 2.
  const currentPeriodo = now.getMonth() + 1 >= 7 ? 2 : 1;

  const numAñosStatus = alumno.numaniostatus || 4;
  const oldestYearToEvaluate = currentAnio - numAñosStatus + 1;

  // ... (toda tu lógica de 'semestresSinCredito' y 'boletinesOrdenados'
  // ...  es correcta y no necesita cambios)
  const semestresSinCredito = periodos
    .filter(
      (p) =>
        (p.anio < currentAnio ||
          (p.anio === currentAnio && p.periodo <= currentPeriodo)) &&
        p.anio >= oldestYearToEvaluate
    )
    .map((p) => {
      const registro = boletines.find(
        (b) => b.anio === p.anio && b.periodo === p.periodo
      );

      if (!registro) {
        return {
          anio: p.anio,
          periodo: p.periodo,
          credito: "No Inscrito",
          asistenciaprom: "No Inscrito",
          lectura: "No Inscrito",
          examen: "No Inscrito",
        };
      }

      const asistencia = registro.asistenciaprom || 0;
      const lectura = (registro.lectura || "").toLowerCase();
      const examen = (registro.examen || "").toLowerCase();
      const credito = (registro.credito || "").toLowerCase();

      const sinCredito =
        asistencia < 75 ||
        lectura === "no" ||
        examen === "no" ||
        credito === "no";

      if (sinCredito) {
        return {
          anio: registro.anio,
          periodo: registro.periodo,
          credito: registro.credito,
          asistenciaprom: registro.asistenciaprom,
          lectura: registro.lectura,
          examen: registro.examen,
        };
      }

      return null;
    })
    .filter(Boolean)
    .sort((a, b) =>
      a.anio === b.anio ? b.periodo - a.periodo : b.anio - a.anio
    );

  const boletinesOrdenados = [...boletines].sort((a, b) =>
    a.anio === b.anio ? b.periodo - a.periodo : b.anio - a.anio
  );
  // ... (fin de la lógica sin cambios)

  return (
    <Container className="py-4">
      <Button variant="secondary" onClick={() => navigate(-1)}>
        ← Regresar
      </Button>

      <h3 className="text-center mt-4 fw-bold">{alumno.estudiante}</h3>
      <p className="text-center text-muted">
        {alumno.barrio} · {alumno.estaca}
        <br />
        {alumno.aniostatus}
      </p>

      {/* Resumen de Graduación */}
      <Card className="my-4 shadow-sm">
        {/* ... (todo el JSX de la tarjeta es igual) ... */}
        <Card.Header className="fw-bold bg-dark text-white">
          Resumen de Graduación
        </Card.Header>
        <Card.Body>
          <div className="row mb-4">
            <div className="col-md-6 mx-auto">
              <h6 className="fw-bold mb-2 text-center">Créditos</h6>
              <Table bordered size="sm" className="text-center">
                <thead>
                  <tr>
                    <th>Obtenido</th>
                    <th>Obligatorio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{totalCreditos.toFixed(2)}</td>
                    <td>4</td>
                  </tr>
                </tbody>
              </Table>
            </div>
          </div>

          <div className="row">
            <div className="col-md-10 mx-auto">
              <h6 className="fw-bold mb-2 text-center">
                Semestres sin Crédito
              </h6>
              <Table bordered hover size="sm" className="text-center">
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Crédito</th>
                    <th>Asistencia</th>
                    <th>Lectura</th>
                    <th>Evaluación</th>
                  </tr>
                </thead>
                <tbody>
                  {semestresSinCredito.length > 0 ? (
                    semestresSinCredito.map((s, idx) => (
                      <tr key={idx}>
                        <td>{`${s.anio}-${s.periodo}`}</td>
                        <td>{s.credito}</td>
                        <td>
                          {s.asistenciaprom === "No Inscrito"
                            ? "No Inscrito"
                            : `${s.asistenciaprom}%`}
                        </td>
                        <td>{s.lectura}</td>
                        <td>{s.examen}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-muted">
                        (Dentro del rango de {numAñosStatus} años, no hay
                        semestres sin crédito)
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Resumen de Seminarios */}
      <Card className="shadow-sm">
        {/* ... (todo el JSX de la tarjeta es igual) ... */}
        <Card.Header className="fw-bold bg-dark text-white">
          Resumen de Seminarios
        </Card.Header>
        <Card.Body>
          <Table bordered hover responsive className="text-center">
            <thead>
              <tr>
                <th>Periodo</th>
                <th>Curso</th>
                <th>Maestro</th>
                <th>Crédito</th>
                <th>% Asistencia</th>
                <th>Lectura</th>
                <th>Evaluación</th>
              </tr>
            </thead>
            <tbody>
              {boletinesOrdenados.map((b, idx) => (
                <tr key={idx}>
                  <td>{`${b.anio}-${b.periodo}`}</td>
                  <td>{b.curso}</td>
                  <td>{b.maestro}</td>
                  <td>{b.credito}</td>
                  <td>{b.asistenciaprom}%</td>
                  <td>{b.lectura}</td>
                  <td>{b.examen}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <div className="text-center mt-4">
        {/* === 💡 CORRECCIÓN 2: Lógica del Botón === */}
        <Button
          variant="success"
          className="mx-2"
          onClick={async () => {
            // Buscar el boletín que coincide con el año y periodo actual
            const boletinActual = boletines.find(
              (b) => b.anio === currentAnio && b.periodo === currentPeriodo
            );

            if (boletinActual) {
              // Si se encuentra, generar el PDF con ese boletín
              generarBoletinPDF(boletinActual);
            } else {
              // Si no, informar al usuario
              alert(
                `No se encontró un boletín para el período actual (${currentAnio}-${currentPeriodo}).`
              );
            }
          }}
        >
          Boletín Mensual
        </Button>

        {/* 💡 AJUSTE: 'graduado' ahora es un objeto, no un booleano */}
        {graduado && (
          <Button
            variant="warning"
            className="mx-2"
            onClick={async () =>
              // Pasamos el objeto 'graduado' que obtuvimos de la DB
              generarGraduacionPDF(graduado, boletines, periodos)
            }
          >
            Boletín Graduación
          </Button>
        )}
      </div>
    </Container>
  );
}
