import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ImageConverter from "./pages/ImageConverter";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/file-converter" replace />} />
        <Route path="/file-converter" element={<ImageConverter />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
