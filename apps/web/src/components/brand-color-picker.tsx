"use client";

import { useState, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";
import { Check, RotateCcw } from "lucide-react";
import { getBrandColor } from "@/lib/brand-color";

const PRESET_COLORS = [
  { name: "Azul", hex: "#0052cc" },
  { name: "Verde", hex: "#00875a" },
  { name: "Morado", hex: "#6554c0" },
  { name: "Naranja", hex: "#ff8b00" },
  { name: "Rojo", hex: "#de350b" },
  { name: "Gris", hex: "#505f79" },
  { name: "Rosa", hex: "#e91e63" },
  { name: "Cyan", hex: "#00b8d9" },
];

interface BrandColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export function BrandColorPicker({
  value,
  onChange,
  disabled,
}: BrandColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const currentColor = getBrandColor(value);

  const handlePresetClick = useCallback(
    (hex: string) => {
      onChange(hex);
      setShowPicker(false);
    },
    [onChange],
  );

  const handleCustomColorChange = useCallback(
    (hex: string) => {
      onChange(hex);
    },
    [onChange],
  );

  return (
    <div className="space-y-4">
      {/* Color Preview */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowPicker(!showPicker)}
          disabled={disabled}
          className="h-12 w-12 rounded-lg border-2 border-border hover:border-foreground/50 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: currentColor }}
        />
        <div>
          <p className="text-sm font-medium text-foreground">Color actual</p>
          <p className="text-xs text-muted-foreground font-mono uppercase">
            {currentColor}
          </p>
        </div>
      </div>

      {/* Preset Colors */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Colores preset
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.hex}
              onClick={() => handlePresetClick(color.hex)}
              disabled={disabled}
              className={cn(
                "h-9 w-9 rounded-md transition-all active:scale-95",
                currentColor === color.hex
                  ? "ring-2 ring-offset-2 ring-foreground ring-offset-background"
                  : "hover:scale-110",
              )}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            >
              {currentColor === color.hex && (
                <Check className="w-4 h-4 text-white mx-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Picker */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Personalizado
        </p>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            showPicker ? "max-h-[300px]" : "max-h-0",
          )}
        >
          <div className="pt-2">
            <HexColorPicker
              color={currentColor}
              onChange={handleCustomColorChange}
              className="w-full"
            />
            <div className="mt-3 flex items-center gap-2">
              <div
                className="h-8 w-8 rounded border border-border shrink-0"
                style={{ backgroundColor: currentColor }}
              />
              <input
                type="text"
                value={currentColor}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    onChange(val);
                  }
                }}
                disabled={disabled}
                className="flex-1 h-8 px-3 rounded border border-border bg-background text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {!showPicker && (
          <button
            onClick={() => setShowPicker(true)}
            disabled={disabled}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 disabled:opacity-50"
          >
            Elegir color personalizado
          </button>
        )}
      </div>

      {/* Reset Button */}
      {value && (
        <button
          onClick={() => {
            onChange("");
            setShowPicker(false);
          }}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <RotateCcw className="w-3 h-3" />
          Restablecer color por defecto
        </button>
      )}
    </div>
  );
}
