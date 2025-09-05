import React,{useEffect,useState} from "react";
import { createNewDocument,getAllDocuments } from "../../api/documentService";
import DocumentCard from "./DocumentCard";
import { useNavigate } from "react-router-dom";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";


const DocumentPage = () => {
    const [documents, setDocuments] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const navigate = useNavigate();
  
    useEffect(() => {
      loadDocuments();
    }, []);
  
    const loadDocuments = async () => {
      try {
        const response = await getAllDocuments();
        setDocuments(response.documents);
      } catch (error) {
        console.error("Error loading documents:", error);
      }
    };
  
    const handleAddDocument = async () => {
      if (!newTitle.trim()) {
        alert("Please enter a title!");
        return;
      }
      try {
        const newDoc = await createNewDocument(newTitle);
        setShowPopup(false);
        setNewTitle("");
        navigate(`/collaborate/${newDoc.id}`);
      } catch (error) {
        console.error("Error creating document:", error);
      }
    };

    const myDocs = documents.filter((d) => d.isOwner);
    const sharedDocs = documents.filter((d) => !d.isOwner);
  
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5">Documents</Typography>
          <Button variant="contained" color="success" onClick={() => setShowPopup(true)}>New</Button>
        </Stack>

        {/* My Documents */}
        <Typography variant="h6" sx={{ mb: 1 }}>My Documents</Typography>
        <Grid container spacing={2}>
          {myDocs.map((doc) => (
            <Grid key={doc.id} item xs={12} sm={6} md={4}>
              <DocumentCard document={doc} />
            </Grid>
          ))}
          {myDocs.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">No documents yet. Create one using the New button.</Typography>
            </Grid>
          )}
        </Grid>

        {/* Shared with me */}
        {sharedDocs.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>Shared with me</Typography>
            <Grid container spacing={2}>
              {sharedDocs.map((doc) => (
                <Grid key={doc.id} item xs={12} sm={6} md={4}>
                  <DocumentCard document={doc} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
  
        <Dialog open={showPopup} onClose={() => setShowPopup(false)} fullWidth maxWidth="sm">
          <DialogTitle>Create a New Document</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Document title"
              type="text"
              fullWidth
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPopup(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAddDocument}>Create</Button>
          </DialogActions>
        </Dialog>
      </Container>
    );
  };
  
  export default DocumentPage;