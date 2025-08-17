import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { RecoilRoot } from "recoil";

import "./index.css";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import End from "./End.tsx";
import Start from "./Start.tsx";

const basename = import.meta.env.BASE_URL;

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
    },
    {
      path: "/start",
      element: <Start />,
    },
    {
      path: "/end",
      element: <End />,
    },
  ],
  {
    basename: basename,
  }
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RecoilRoot>
      <RouterProvider router={router} />
    </RecoilRoot>
  </React.StrictMode>
);
