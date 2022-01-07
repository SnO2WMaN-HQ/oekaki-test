import { ReactLocation, Route } from "react-location";
import { Home } from "./pages/Home";

export const location = new ReactLocation();

export const routes: Route[] = [
  {
    path: "/",
    element: <Home />,
  },
];
