import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import ImageConverter from "./pages/ImageConverter";
import ImageMetadataRemover from "./pages/ImageMetadataRemover";
import Base64Converter from "./pages/Base64Converter";
import LandingPage from "./pages/LandingPage";
import {
  BASE_PATH,
  CONVERTER_PATH,
  METADATA_REMOVER_PATH,
  BASE64_CONVERTER_PATH,
  HOME_PATH,
} from "@/constants/routes";

function App() {
  return (
    <BrowserRouter basename={BASE_PATH}>
      <div className="bg-background flex min-h-screen flex-col">
        <Header />
        <main className="container mx-auto flex-grow px-4 py-8">
          <Routes>
            <Route path={HOME_PATH} element={<LandingPage />} />
            <Route path={CONVERTER_PATH} element={<ImageConverter />} />
            <Route path={METADATA_REMOVER_PATH} element={<ImageMetadataRemover />} />
            <Route path={BASE64_CONVERTER_PATH} element={<Base64Converter />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
