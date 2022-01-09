import clsx from "clsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMatch } from "react-location";
import { useMeasure } from "react-use";

export const createWebSocketURL = (roomId: string) => {
  const url = new URL("/rooms", import.meta.env.VITE_WS_API_ENDPOINT);
  url.searchParams.set("roomId", roomId);
  return url;
};

export const Canvas: React.VFC<{ className?: string; roomId: string; }> = (
  { className, roomId },
) => {
  const [rootRef, { width, height }] = useMeasure<HTMLDivElement>();

  const [renderCtx, setRenderCtx] = useState<CanvasRenderingContext2D | null>(null);
  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    const context = node?.getContext("2d");
    if (!context) return;
    setRenderCtx(context);
  }, []);

  const wsRef = useRef<WebSocket>();

  useEffect(
    () => {
      if (!renderCtx) return;
      wsRef.current = new WebSocket(createWebSocketURL(roomId));
      wsRef.current.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "INIT") {
          for (const line of data.payload["lines"]) {
            renderCtx.beginPath();
            renderCtx.moveTo(line.from[0], line.from[1]);
            renderCtx.lineTo(line.to[0], line.to[1]);
            renderCtx.stroke();
          }
        } else if (data.type === "DRAWED") {
          renderCtx.beginPath();
          renderCtx.moveTo(data.payload.from[0], data.payload.from[1]);
          renderCtx.lineTo(data.payload.to[0], data.payload.to[1]);
          renderCtx.stroke();
        }
      });
      return () => {
        wsRef.current?.close();
      };
    },
    [roomId, renderCtx],
  );

  return (
    <div ref={rootRef} className={clsx(className, "relative")}>
      <canvas
        className={clsx("absolute", "inset-0", "z-[0]")}
        ref={canvasRef}
        width={width}
        height={height}
      >
      </canvas>
      <div
        className={clsx("absolute", "inset-0", "z-[1]")}
        onMouseMove={(e) => {
          if (!wsRef.current) return;
          wsRef.current.send(JSON.stringify(
            {
              type: "CURSOR",
              payload: {
                point: [
                  e.nativeEvent.offsetX,
                  e.nativeEvent.offsetY,
                ],
              },
            },
          ));
          if (e.buttons != 0) {
            wsRef.current.send(
              JSON.stringify({
                type: "DRAW",
                payload: {
                  from: [
                    e.nativeEvent.offsetX - e.nativeEvent.movementX,
                    e.nativeEvent.offsetY - e.nativeEvent.movementY,
                  ],
                  to: [
                    e.nativeEvent.offsetX,
                    e.nativeEvent.offsetY,
                  ],
                },
              }),
            );
          }
        }}
      />
    </div>
  );
};

export const RoomPage: React.VFC = ({}) => {
  const { params } = useMatch();

  const roomId = useMemo(() => params["id"], []);

  return (
    <main>
      {roomId && (
        <>
          <h1>Room {roomId}</h1>
          <Canvas
            className={clsx("w-[640px]", "h-[480px]")}
            roomId={roomId}
          />
        </>
      )}
    </main>
  );
};
