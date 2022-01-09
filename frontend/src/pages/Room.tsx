import clsx from "clsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMatch } from "react-location";
import { useIdle, useLocalStorage, useMeasure } from "react-use";
import { v4 as uuidv4 } from "uuid";

export const createWebSocketURL = (roomId: string, userId: string) => {
  const url = new URL("/rooms", import.meta.env.VITE_WS_API_ENDPOINT);
  url.searchParams.set("roomId", roomId);
  url.searchParams.set("userId", userId);
  return url;
};

export const useUserId = (): [
  string,
] => {
  const [id] = useLocalStorage<string>("userId", uuidv4());
  return [id as string];
};

export const useUserName = (): [
  string | undefined,
  (name: string) => void,
] => {
  const [name, setName] = useLocalStorage<string | undefined>("name", undefined);
  return [name, (newName) => setName(newName)];
};

export const Canvas: React.VFC<{ roomId: string; }> = (
  { roomId },
) => {
  const [rootRef, { width, height }] = useMeasure<HTMLDivElement>();
  const [renderCtx, setRenderCtx] = useState<CanvasRenderingContext2D | null>(null);
  const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
    const context = node?.getContext("2d");
    if (!context) return;
    setRenderCtx(context);
  }, []);
  const [userId] = useUserId();
  const [_, rename] = useUserName();
  const [participants, setParticipants] = useState<{ id: string; name: string; }[]>([]);
  const wsRef = useRef<WebSocket>();
  const [cursors, setCursor] = useState<{ uid: string; point: [number, number]; }[]>([]);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => {
      if (!renderCtx) return;
      wsRef.current = new WebSocket(createWebSocketURL(roomId, userId));
      wsRef.current.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "INIT_SYNC") {
          setParticipants(data.payload["participants"]);
          const storedName = participants.find(({ id }) => id === userId)?.name;
          if (storedName) rename(storedName);

          for (const line of data.payload["lines"]) {
            renderCtx.beginPath();
            renderCtx.moveTo(line.from[0], line.from[1]);
            renderCtx.lineTo(line.to[0], line.to[1]);
            renderCtx.stroke();
          }
        } else if (data.type === "SYNC_DRAWING") {
          renderCtx.beginPath();
          renderCtx.moveTo(data.payload.from[0], data.payload.from[1]);
          renderCtx.lineTo(data.payload.to[0], data.payload.to[1]);
          renderCtx.stroke();
        } else if (data.type === "SYNC_CURSORS") {
          const now = Date.now();
          setCursor(data.payload.filter(({ updatedAt }: any) => now < updatedAt + 1000));
        } else if (data.type === "SYNC_PARTICIPANTS") {
          setParticipants(data.payload.participants);
        }
      });
      return () => {
        wsRef.current?.close();
      };
    },
    [renderCtx, roomId, userId],
  );

  return (
    <div className={clsx(["flex"])}>
      <div ref={rootRef} className={clsx("relative", "w-[640px]", "h-[480px]", "cursor-none")}>
        <canvas
          className={clsx("absolute", "inset-0", "z-[0]")}
          ref={canvasRef}
          width={width}
          height={height}
        >
        </canvas>
        <div className={clsx("absolute", "inset-0", "z-[1]", "select-none", "overflow-hidden")}>
          {cursors.map(({ uid, point }) => (
            <div
              key={uid}
              className={clsx(["absolute", "to-0", "left-0"], ["opacity-50"])}
              style={{ transform: `translateX(${point[0]}px) translateY(${point[1]}px)` }}
            >
              <div
                className={clsx(
                  ["absolute", "top-[-2px]", "left-[-2px]"],
                  ["w-[5px]", "h-[5px]"],
                  "bg-black",
                  ["rounded-full"],
                )}
              >
              </div>
              <span className={clsx(["text-sm"])}>{participants.find(({ id }) => id === uid)?.name}</span>
            </div>
          ))}
        </div>
        <div
          className={clsx("absolute", "inset-0", "z-[2]")}
          onMouseMove={(e) => {
            if (!wsRef.current) return;
            wsRef.current.send(JSON.stringify(
              {
                type: "CURSOR",
                payload: {
                  uid: userId,
                  point: [e.nativeEvent.offsetX, e.nativeEvent.offsetY],
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
      <div>
        <input ref={renameRef}></input>
        <button
          onClick={() => {
            if (!renameRef.current || !wsRef.current) return;
            wsRef.current.send(JSON.stringify(
              {
                type: "RENAME",
                payload: { id: userId, name: renameRef.current.value },
              },
            ));
          }}
        >
          Rename
        </button>
        {participants.map(({ id, name }) => (
          <div key={id}>
            {id !== userId && (
              <>
                <span>{name}</span>
              </>
            )}
            {id === userId && (
              <>
                <span>{name}</span>
                <span className={clsx("ml-2")}>(you)</span>
              </>
            )}
          </div>
        ))}
      </div>
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
          <Canvas roomId={roomId} />
        </>
      )}
    </main>
  );
};
