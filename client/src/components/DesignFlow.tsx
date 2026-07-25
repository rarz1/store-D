import { useState } from "react";
import type { EstampadoRow, EstampadoSizeRow, EstampadoLocationRow } from "../lib/supabase";
import EstampadoSelector from "./EstampadoSelector";
import SizeSelector from "./SizeSelector";
import LocationSelector from "./LocationSelector";

interface PlacedEstampado {
  estampado: EstampadoRow;
  size: EstampadoSizeRow;
  locations: EstampadoLocationRow[];
}

interface Props {
  estampados: EstampadoRow[];
  stampSizes: EstampadoSizeRow[];
  stampLocations: EstampadoLocationRow[];
  onAdd: (item: PlacedEstampado) => void;
}

type Step = "closed" | "design" | "size" | "location";

export default function DesignFlow({ estampados, stampSizes, stampLocations, onAdd }: Props) {
  const [step, setStep] = useState<Step>("closed");
  const [selectedEstampadoId, setSelectedEstampadoId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);

  const selectedEstampado = estampados.find((e) => e.id === selectedEstampadoId) ?? null;
  const selectedSizeObj = stampSizes.find((s) => s.id === selectedSizeId) ?? null;
  const selectedLocations = stampLocations.filter((l) => selectedLocationIds.includes(l.id));

  const handleSelectDesign = (id: number) => {
    setSelectedEstampadoId(id);
    setSelectedSizeId(stampSizes[0]?.id ?? null);
    setSelectedLocationIds([]);
    setStep("size");
  };

  const handleSelectSize = (id: number) => {
    setSelectedSizeId(id);
    setSelectedLocationIds([]);
    setStep("location");
  };

  const handleToggleLocation = (id: number) => {
    setSelectedLocationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (!selectedEstampado || !selectedSizeObj) return;
    onAdd({ estampado: selectedEstampado, size: selectedSizeObj, locations: selectedLocations });
    setSelectedEstampadoId(null);
    setSelectedSizeId(null);
    setSelectedLocationIds([]);
    setStep("closed");
  };

  if (estampados.length === 0) return null;

  return (
    <div className="design-flow">
      <div className="control-group">
        <button
          className="choice-btn"
          onClick={() => setStep(step === "closed" ? "design" : "closed")}
        >
          <span className="choice-btn__label">Estampado</span>
          <span className="choice-btn__value">
            {step !== "closed"
              ? "Seleccionando..."
              : selectedEstampado
                ? `${selectedEstampado.name} (${selectedSizeObj?.name ?? ""})`
                : "Elegir estampado"}
          </span>
          <svg
            className={`choice-btn__arrow${step !== "closed" ? " choice-btn__arrow--open" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"
          >
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {step !== "closed" && (
        <div className="design-flow__body">
          {step === "design" && (
            <EstampadoSelector
              estampados={estampados}
              selectedId={selectedEstampadoId}
              onSelect={handleSelectDesign}
            />
          )}

          {(step === "size" || step === "location") && (
            <SizeSelector
              sizes={stampSizes}
              selectedId={selectedSizeId}
              onSelect={handleSelectSize}
            />
          )}

          {step === "location" && (
            <div className="design-flow__confirm">
              <LocationSelector
                locations={stampLocations}
                selectedIds={selectedLocationIds}
                onToggle={handleToggleLocation}
              />
              <button
                className="btn-primary"
                style={{ width: "100%", marginTop: "0.75rem" }}
                onClick={handleConfirm}
                disabled={selectedLocationIds.length === 0}
              >
                Confirmar estampado
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
