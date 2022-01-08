import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const socketRef = useRef<WebSocket>();
  const ref = useCallback((node: HTMLCanvasElement | null) => {
    const context = node?.getContext("2d");
    if (!context) return;
    setCtx(context);
  }, []);
  const [pressing, setPressing] = useState(false);

  useEffect(
    () => {
      if (!ctx) return;
      socketRef.current = new WebSocket(new URL("/random", import.meta.env.VITE_WS_API_ENDPOINT));
      socketRef.current.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "DRAWED") {
          ctx.beginPath();
          ctx.moveTo(data.payload[0][0], data.payload[0][1]);
          ctx.lineTo(data.payload[1][0], data.payload[1][1]);
          ctx.stroke();
        }
      });
      return () => {
        socketRef.current?.close();
      };
    },
    [ctx],
  );

  return (
    <div>
      <div className={clsx("relative", ["w-[640px]", "h-[480px]"])}>
        {ctx && (
          <div
            className={clsx("absolute", "inset-0", "z-[1]")}
            onMouseDown={(e) => {
              setPressing(true);
            }}
            onMouseUp={(e) => {
              setPressing(false);
            }}
            onMouseMove={(e) => {
              if (pressing) {
                socketRef.current?.send(
                  JSON.stringify({
                    type: "DRAW",
                    payload: [
                      [
                        e.nativeEvent.offsetX - e.nativeEvent.movementX,
                        e.nativeEvent.offsetY - e.nativeEvent.movementY,
                      ],
                      [
                        e.nativeEvent.offsetX,
                        e.nativeEvent.offsetY,
                      ],
                    ],
                  }),
                );
              }
            }}
          />
        )}
        <canvas
          className={clsx("absolute", "inset-0", "z-[0]")}
          ref={ref}
          width={640}
          height={480}
        >
        </canvas>
      </div>
    </div>
  );
};
