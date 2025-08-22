import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
// import './global.css';
import './index.css'; // Tailwind directives


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
