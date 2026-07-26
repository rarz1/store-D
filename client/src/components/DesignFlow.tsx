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
  onOpenHelp: () => void;
}

type Step = "closed" | "design" | "size" | "location";

export default function DesignFlow({ estampados, stampSizes, stampLocations, onAdd, onOpenHelp }: Props) {
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

  return (
    <div className="design-flow">
      <div className="control-group">
        <div className="control-group__header control-group__header--clickable" onClick={() => setStep(step === "closed" ? "design" : "closed")}>
          <span className="control-label">PERSONALIZÁ TU PRENDA</span>
          <button className="btn-small btn-small--help" onClick={(e) => { e.stopPropagation(); onOpenHelp(); }} title="¿Cómo funciona?">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {step !== "closed" && estampados.length === 0 && (
          <p className="text-muted" style={{ textAlign: "center", padding: "1rem" }}>No hay diseños disponibles</p>
        )}

        {step !== "closed" && estampados.length > 0 && (
          <>
            <button className="choice-btn" onClick={() => setStep("closed")} style={{ marginBottom: "0.5rem" }}>
              <span className="choice-btn__label">Estampado</span>
              <span className="choice-btn__value">
                {step === "design"
                  ? "Seleccionando..."
                  : selectedEstampado
                    ? `${selectedEstampado.name} (${selectedSizeObj?.name ?? ""})`
                    : "Elegir estampado"}
              </span>
              <svg className="choice-btn__arrow choice-btn__arrow--open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

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
          </>
        )}
      </div>
    </div>
  );
}
