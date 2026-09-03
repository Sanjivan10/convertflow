"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Produces a transparent PNG data URL of a signature via draw / type / upload. */
export function SignaturePad({
  onChange,
}: {
  onChange: (dataUrl: string | null) => void;
}) {
  const [mode, setMode] = useState<"draw" | "type" | "upload">("draw");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== "draw") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";

    const pos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * canvas.width,
        y: ((e.clientY - r.top) / r.height) * canvas.height,
      };
    };
    const down = (e: PointerEvent) => {
      drawing.current = true;
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };
    const moveTo = (e: PointerEvent) => {
      if (!drawing.current) return;
      const p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };
    const up = () => {
      if (!drawing.current) return;
      drawing.current = false;
      onChange(canvas.toDataURL("image/png"));
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", moveTo);
    window.addEventListener("pointerup", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", moveTo);
      window.removeEventListener("pointerup", up);
    };
  }, [mode, onChange]);

  const clearDraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  const renderTyped = (value: string) => {
    setTyped(value);
    if (!value.trim()) return onChange(null);
    const c = document.createElement("canvas");
    c.width = 600;
    c.height = 200;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#0f172a";
    ctx.font = "72px 'Segoe Script', 'Brush Script MT', cursive";
    ctx.textBaseline = "middle";
    ctx.fillText(value, 20, 100);
    onChange(c.toDataURL("image/png"));
  };

  const onUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <div className="mb-3 flex gap-1 text-sm">
        {(["draw", "type", "upload"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              onChange(null);
            }}
            className={`rounded px-3 py-1.5 font-medium capitalize ${
              mode === m
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "draw" && (
        <div>
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full touch-none rounded border border-dashed border-slate-300 bg-white dark:border-slate-600"
          />
          <Button variant="ghost" size="sm" className="mt-2" onClick={clearDraw}>
            Clear
          </Button>
        </div>
      )}

      {mode === "type" && (
        <Input
          value={typed}
          onChange={(e) => renderTyped(e.target.value)}
          placeholder="Type your name"
          className="text-lg"
          style={{ fontFamily: "'Segoe Script','Brush Script MT',cursive" }}
        />
      )}

      {mode === "upload" && (
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => onUpload(e.target.files?.[0])}
          className="text-sm"
        />
      )}
    </div>
  );
}
