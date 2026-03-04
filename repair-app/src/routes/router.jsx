import { createBrowserRouter } from "react-router-dom";

import RequireAuth from "../auth/RequireAuth";

import Login from "../pages/Login";
import Inventory from "../pages/Inventory";
import CatalogManager from "../pages/CatalogManager";
import Landing from "../pages/Landing";

import App from "../App";

export const router = createBrowserRouter([
  // Public
  { path: "/login", element: <Login /> },

  // Private
  {
    path: "/",
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Landing /> },
      { path: "inventory", element: <Inventory /> },
      { path: "catalog", element: <CatalogManager /> },
    ],
  },
]);