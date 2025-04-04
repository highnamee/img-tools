import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ImageConverter from "./pages/ImageConverter";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<ImageConverter />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
