import { createRoot } from "react-dom/client";
import "../index.css";
import Admin from "./Admin";

if (localStorage.getItem("novatravel-theme") === "light") {
  document.documentElement.classList.add("light");
}

createRoot(document.getElementById("root")!).render(<Admin />);
