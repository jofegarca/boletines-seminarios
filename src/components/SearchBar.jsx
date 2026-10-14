import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";

export default function SearchBar({ searchTerm, setSearchTerm }) {
  const [localValue, setLocalValue] = useState(searchTerm);

  // 🔹 Delay de 300 ms para evitar renders continuos
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(localValue), 300);
    return () => clearTimeout(timer);
  }, [localValue, setSearchTerm]);

  return (
    <Form className="my-4 text-center">
      <Form.Group>
        <Form.Label className="fw-bold">Nombre de Estudiante:</Form.Label>
        <Form.Control
          type="text"
          placeholder="Escribe un nombre..."
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          style={{ maxWidth: "400px", margin: "auto" }}
        />
      </Form.Group>
    </Form>
  );
}
