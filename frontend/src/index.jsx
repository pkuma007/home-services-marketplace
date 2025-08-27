import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { CartProvider } from "./context/CartContext";
import { UIProvider } from "./context/UIContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UIProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </UIProvider>
  </React.StrictMode>
);
