import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { HashRouter } from "react-router-dom"; // <-- HashRouter here
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  </HashRouter>
);
