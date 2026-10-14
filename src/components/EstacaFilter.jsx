import React, { useEffect } from "react";
import { ButtonGroup, Button } from "react-bootstrap";

export default function EstacaFilter({ estacas, selectedEstaca, onSelect }) {
  // 🔹 Al montar o cuando cambie la lista de estacas,
  // selecciona automáticamente la primera si no hay ninguna seleccionada
  useEffect(() => {
    if (estacas.length > 0 && !selectedEstaca) {
      onSelect(estacas[0]);
    }
  }, [estacas, selectedEstaca, onSelect]);

  return (
    <div className="text-center mb-4">
      <ButtonGroup>
        {estacas.map((estaca, idx) => (
          <Button
            key={idx}
            variant={selectedEstaca === estaca ? "primary" : "outline-primary"}
            onClick={() => onSelect(estaca)}
            className="mx-1">
            {estaca}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  );
}
