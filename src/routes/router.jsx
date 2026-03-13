import { createBrowserRouter } from "react-router-dom";

import RequireAuth from "../auth/RequireAuth";
import Login from "../pages/Login";
import Inventory from "../pages/Inventory";
import CatalogManager from "../pages/CatalogManager";
import Landing from "../pages/Landing";
import App from "../App";
import Vendors from "../pages/Vendors";
import Purchases from "../pages/Purchases";
import PurchaseHistory from "../pages/PurchaseHistory";
import CustomerEdit from "../pages/CustomerEdit";
import Customers from "../pages/Customers";
import Invoices from "../pages/Invoices";
import InvoiceHistory from "../pages/InvoiceHistory";

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

      // business data
      { path: "vendors", element: <Vendors /> },
      { path: "customers", element: <Customers /> },
      { path: "customers/new", element: <CustomerEdit /> },
      { path: "customers/:id", element: <CustomerEdit /> },

      // purchasing
      { path: "purchases", element: <Purchases /> },
      { path: "purchase-history", element: <PurchaseHistory /> },

      { path: "invoices", element: <Invoices /> },
      { path: "invoice-history", element: <InvoiceHistory /> },
    ],
  },
]);
