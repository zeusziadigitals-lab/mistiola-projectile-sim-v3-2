import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalClickSounds } from "./lib/sounds";

installGlobalClickSounds();

createRoot(document.getElementById("root")!).render(<App />);
