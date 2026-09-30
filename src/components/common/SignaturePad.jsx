import { useRef, useState, useCallback, useEffect } from 'react';
import { Eraser } from 'lucide-react';

// Zone de signature (canvas) sans dependance externe. Expose la signature au
// parent via `onChange(dataUrl base64 | null)` — envoyee telle quelle en `signature`.
export default function SignaturePad({ onChange, label = 'Signez dans le cadre' }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Canvas net sur ecrans haute densite.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.getContext('2d').scale(ratio, ratio);
  }, []);

  const getContext = () => canvasRef.current?.getContext('2d');

  const pointerPos = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (event) => {
    event.preventDefault();
    drawing.current = true;
    const ctx = getContext();
    const { x, y } = pointerPos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (event) => {
    if (!drawing.current) return;
    event.preventDefault();
    const ctx = getContext();
    const { x, y } = pointerPos(event);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setIsEmpty(false);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange?.(canvasRef.current.toDataURL('image/png'));
  };

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    getContext().clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange?.(null);
  }, [onChange]);

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-dashed border-surface-300 bg-surface-50">
        <canvas
          ref={canvasRef}
          className="h-[150px] w-full touch-none"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
          aria-label="Zone de signature"
        />
        {isEmpty && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-surface-400">
            {label}
          </p>
        )}
        <div className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-surface-300" aria-hidden="true" />
      </div>
      {!isEmpty && (
        <button type="button" onClick={clear} className="mt-1.5 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-surface-600 hover:bg-surface-100">
          <Eraser size={14} /> Effacer la signature
        </button>
      )}
    </div>
  );
}
