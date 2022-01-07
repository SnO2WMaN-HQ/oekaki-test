import clsx from "clsx";
import React from "react";
import { Link, Outlet, Router } from "react-location";
import { location, routes } from "./Router";

export const App: React.VFC = () => {
  return (
    <Router routes={routes} location={location}>
      <div className={clsx("bg-gray-50")}>
        <div>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
          </ul>
        </div>
        <Outlet />
      </div>
    </Router>
  );
};
