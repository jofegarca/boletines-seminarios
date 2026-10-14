// 📄 src/components/BoletinButtons.jsx
import React, { useState } from "react";
import { Dropdown, Button, Spinner } from "react-bootstrap";
import { generarBoletinConsolidado } from "../utils/BoletinConsolidado";
import { generarBoletinZip } from "../utils/BoletinZip";
import { generarGraduacionConsolidado } from "../utils/GraduacionConsolidado";
import { generarGraduacionZip } from "../utils/GraduacionZip";
import { generarBoletinGraduacionExcel } from "../utils/BoletinGraduacionExcel";
import { generarBoletinMensualExcel } from "../utils/BoletinMensualExcel";

export default function BoletinButtons({ selectedEstaca }) {
  const [showMensual, setShowMensual] = useState(false);
  const [showGraduacion, setShowGraduacion] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");

  const handleDownload = async (tipo, formato) => {
    if (!selectedEstaca) {
      alert("Por favor selecciona una estaca primero.");
      return;
    }

    setIsProcessing(true);
    setProcessingMsg(`Generando ${tipo} en ${formato}...`);

    try {
      if (tipo === "Mensual" && formato === "Excel") {
        await generarBoletinMensualExcel(selectedEstaca);
      } else if (tipo === "Mensual" && formato === "PDF") {
        await generarBoletinConsolidado(selectedEstaca);
      } else if (tipo === "Mensual" && formato === "PDF comprimido") {
        await generarBoletinZip(selectedEstaca);
      } else if (tipo === "Graduación" && formato === "Excel") {
        await generarBoletinGraduacionExcel(selectedEstaca);
      } else if (tipo === "Graduación" && formato === "PDF") {
        await generarGraduacionConsolidado(selectedEstaca);
      } else if (tipo === "Graduación" && formato === "PDF comprimido") {
        await generarGraduacionZip(selectedEstaca);
      } else {
        alert(`Descargando ${tipo} en formato ${formato}...`);
      }
    } catch (err) {
      console.error("Error al descargar:", err);
      alert("Ocurrió un error al generar el archivo. Revisa la consola.");
    } finally {
      setIsProcessing(false);
      setProcessingMsg("");
    }
  };

  return (
    <div className="text-center">
      {/* 🔹 Botones de Boletines */}
      <div className="d-flex justify-content-center gap-3">
        <Button
          variant="success"
          disabled={isProcessing}
          onClick={() => {
            setShowMensual(!showMensual);
            setShowGraduacion(false);
          }}>
          Boletín Mensual
        </Button>

        <Button
          variant="warning"
          disabled={isProcessing}
          onClick={() => {
            setShowGraduacion(!showGraduacion);
            setShowMensual(false);
          }}>
          Boletín Graduación
        </Button>
      </div>

      {/* 🔹 Estado de procesamiento */}
      {isProcessing && (
        <div className="mt-3 text-primary d-flex align-items-center justify-content-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>{processingMsg}</span>
        </div>
      )}

      {/* 🔹 Menú de descargas Mensual */}
      {!isProcessing && showMensual && (
        <div className="mt-3">
          <Dropdown>
            <Dropdown.Toggle variant="secondary">
              Descargar como...
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => handleDownload("Mensual", "Excel")}>
                Excel
              </Dropdown.Item>
              <Dropdown.Item onClick={() => handleDownload("Mensual", "PDF")}>
                PDF
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => handleDownload("Mensual", "PDF comprimido")}>
                PDF Comprimido
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      )}

      {/* 🔹 Menú de descargas Graduación */}
      {!isProcessing && showGraduacion && (
        <div className="mt-3">
          <Dropdown>
            <Dropdown.Toggle variant="secondary">
              Descargar como...
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item
                onClick={() => handleDownload("Graduación", "Excel")}>
                Excel
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => handleDownload("Graduación", "PDF")}>
                PDF
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => handleDownload("Graduación", "PDF comprimido")}>
                PDF Comprimido
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      )}
    </div>
  );
}
