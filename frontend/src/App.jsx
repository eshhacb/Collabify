import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./shared/Navbar";
import Footer from "./shared/Footer";
import Box from "@mui/material/Box";
import Signup from "./pages/Signup";
import CollaborationPage from "./pages/CollaborationPage";
import Login from "./pages/Login";
import DocumentPage from "./pages/document/DocumentPage";
import InvitationAccept from "./pages/InvitationAccept";

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/collaborate/:documentId" element={<CollaborationPage />} />
          <Route path="/documents" element={<DocumentPage />} />
          <Route path="/invitation/accept/:token" element={<InvitationAccept />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
}

export default App;
