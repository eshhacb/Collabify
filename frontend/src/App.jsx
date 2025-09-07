import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./shared/Navbar";
import Footer from "./shared/Footer";
import Box from "@mui/material/Box";
import Signup from "./pages/Signup";
import CollaborationPage from "./pages/CollaborationPage";
import Login from "./pages/Login";
import DocumentPage from "./pages/document/DocumentPage";
import InvitationAccept from "./pages/InvitationAccept";
import Invitations from "./pages/Invitations";
import RequireAuth from "./shared/RequireAuth";
import Profile from "./pages/Profile";
import CollaboratorsPage from "./pages/CollaboratorsPage";
import TasksPage from "./pages/TasksPage";

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/collaborate/:documentId" element={<CollaborationPage />} />
            <Route path="/documents" element={<DocumentPage />} />
            <Route path="/collaborators" element={<CollaboratorsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/invitations" element={<Invitations />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/invitation/accept/:token" element={<InvitationAccept />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
}

export default App;
