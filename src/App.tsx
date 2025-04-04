import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Header } from "@/components/Header";
import ImageConverter from "./pages/ImageConverter";
import ImageMetadataRemover from "./pages/ImageMetadataRemover";

function App() {
  return (
    <BrowserRouter>
      <div className="bg-background min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/file-converter" replace />} />
            <Route path="/file-converter" element={<ImageConverter />} />
            <Route path="/file-converter/metadata" element={<ImageMetadataRemover />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
