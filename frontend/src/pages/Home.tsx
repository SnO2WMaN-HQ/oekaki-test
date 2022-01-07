import clsx from "clsx";
import { useCallback, useMemo, useRef, useState } from "react";
import { useMeasure } from "react-use";

export const useCanvasContext = (
  setup?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
) => {
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const ref = useCallback((node: HTMLCanvasElement | null) => {
    if (!node) return;

    const context = node.getContext("2d");
    if (!context) return;

    setCtx(context);
    if (setup) setup(context, node.width, node.height);
  }, []);

  return [ref, ctx] as const;
};

export const Canvas: React.VFC<{ className?: string; }> = ({ className }) => {
  const [ref, { width, height }] = useMeasure<HTMLDivElement>();
  const [canvasRef, canvasCtx] = useCanvasContext((ctx, w, h) => {
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, w, h);
  });

  const [pressing, setPressing] = useState(false);

  return (
    <div ref={ref} className={clsx(className, "relative")}>
      {canvasCtx && (
        <div
          className={clsx("absolute", "inset-0", "z-[1]")}
          onMouseDown={(e) => {
            setPressing(true);
            canvasCtx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
          }}
          onMouseLeave={(e) => {
            setPressing(false);
          }}
          onMouseUp={() => {
            setPressing(false);
          }}
          onMouseMove={(e) => {
            if (pressing && e.buttons != 0) {
              canvasCtx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
              canvasCtx.stroke();
            }
          }}
        />
      )}
      {(width != 0 && height != 0) && (
        <canvas
          className={clsx("absolute", "inset-0", "z-[0]")}
          ref={canvasRef}
          width={width}
          height={height}
        >
        </canvas>
      )}
    </div>
  );
};

export const Home: React.VFC = ({}) => {
  return (
    <div>
      <h1 className={clsx("text-lg")}>
        Home
      </h1>
      <Canvas className={clsx("w-[640px]", "h-[480px]")}></Canvas>
    </div>
  );
};
