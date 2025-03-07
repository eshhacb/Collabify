import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import CollaborationPage from "./pages/CollaborationPage";
import Login from "./pages/Login";
import DocumentPage from "./pages/document/DocumentPage";

function App() {
  return (
  
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/collaborate/:documentId" element={<CollaborationPage />} />
        <Route path="/documents" element={<DocumentPage />} />
      </Routes>
   
  );
}

export default App;
