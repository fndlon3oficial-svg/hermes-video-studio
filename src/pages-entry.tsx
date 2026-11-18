import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createHashHistory } from "@tanstack/react-router";
import { getRouter } from "./router";
const element = document.getElementById("root");
if (!element) throw new Error("Não foi possível abrir o editor.");
const router = getRouter();
router.update({ history: createHashHistory(), context: router.options.context });
createRoot(element).render(<StrictMode><RouterProvider router={router} /></StrictMode>);
