import React from "react";
import { Table, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function BoletinList({ boletines }) {
  const navigate = useNavigate();

  // 🔹 Eliminar duplicados por nombre de estudiante
  const uniqueBoletines = Object.values(
    boletines.reduce((acc, current) => {
      const nombre = (current.estudiante || "").trim().toLowerCase();
      if (!acc[nombre]) acc[nombre] = current; // Solo guarda el primero
      return acc;
    }, {}),
  );

  // 🔹 Ordenar por barrio y luego por estudiante
  const sortedBoletines = [...uniqueBoletines].sort((a, b) => {
    const barrioA = (a.barrio || "").toLowerCase();
    const barrioB = (b.barrio || "").toLowerCase();
    const estudianteA = (a.estudiante || "").toLowerCase();
    const estudianteB = (b.estudiante || "").toLowerCase();
    if (barrioA < barrioB) return -1;
    if (barrioA > barrioB) return 1;
    if (estudianteA < estudianteB) return -1;
    if (estudianteA > estudianteB) return 1;
    return 0;
  });

  return (
    <Table striped bordered hover responsive>
      <thead className="table-dark text-center">
        <tr>
          <th>Estudiante</th>
          <th>Barrio</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody className="text-center">
        {sortedBoletines.length > 0 ? (
          sortedBoletines.map((b, idx) => (
            <tr key={idx}>
              <td>{b.estudiante}</td>
              <td>{b.barrio}</td>
              <td>
                <Button
                  size="sm"
                  variant="info"
                  onClick={() =>
                    navigate(`/estudiante/${encodeURIComponent(b.estudiante)}`)
                  }>
                  Ver más
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="3" className="text-muted">
              No se encontraron registros.
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );
}
