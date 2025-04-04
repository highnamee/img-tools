import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import ImageConverter from "./pages/ImageConverter";
import ImageMetadataRemover from "./pages/ImageMetadataRemover";
import LandingPage from "./pages/LandingPage";
import { CONVERTER_PATH, METADATA_REMOVER_PATH, HOME_PATH } from "@/constants/routes";

function App() {
  return (
    <BrowserRouter>
      <div className="bg-background min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path={HOME_PATH} element={<LandingPage />} />
            <Route path={CONVERTER_PATH} element={<ImageConverter />} />
            <Route path={METADATA_REMOVER_PATH} element={<ImageMetadataRemover />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
