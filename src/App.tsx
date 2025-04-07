import { RouterProvider, createBrowserRouter, RouteObject } from "react-router-dom";


import ErrorPage from "@/components/ErrorPage";
import Layout from "@/components/Layout";
import {
  BASE_PATH,
  CONVERTER_PATH,
  METADATA_REMOVER_PATH,
  BASE64_CONVERTER_PATH,
  BACKGROUND_REMOVER_PATH,
  HOME_PATH,
} from "@/constants/routes";

import BackgroundRemover from "./pages/BackgroundRemover";
import Base64Converter from "./pages/Base64Converter";
import ImageConverter from "./pages/ImageConverter";
import ImageMetadataRemover from "./pages/ImageMetadataRemover";
import LandingPage from "./pages/LandingPage";


const routes: RouteObject[] = [
  {
    path: BASE_PATH,
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: HOME_PATH,
        element: <LandingPage />,
      },
      {
        path: CONVERTER_PATH,
        element: <ImageConverter />,
      },
      {
        path: METADATA_REMOVER_PATH,
        element: <ImageMetadataRemover />,
      },
      {
        path: BASE64_CONVERTER_PATH,
        element: <Base64Converter />,
      },
      {
        path: BACKGROUND_REMOVER_PATH,
        element: <BackgroundRemover />,
      },
    ],
  },
];

function App() {
  const router = createBrowserRouter(routes);
  return <RouterProvider router={router} />;
}

export default App;
