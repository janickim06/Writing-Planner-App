// Make sure to import library styles first so your styles take priority!
import "@adamjanicki/ui/style.css";
// All your styles go here!
import "src/css/style.css";
import "src/css/media.css";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "src/App";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
