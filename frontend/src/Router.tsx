import { ReactLocation, Route } from "react-location";
import { HomePage } from "./pages/Home";
import { RoomPage } from "./pages/Room";

export const location = new ReactLocation();

export const routes: Route[] = [
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "rooms",
    children: [
      {
        path: ":id",
        element: <RoomPage />,
      },
    ],
  },
];
