import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

const DocumentList = () => {
  const [docId, setDocId] = useState("");
  const navigate = useNavigate();

  const openDocument = () => {
    if (!docId.trim()) {
      alert("Please enter a valid Document ID");
      return;
    }
    navigate(`/collaborate/${docId}`);
  };

  return (
    <Stack direction="row" spacing={2}>
      <TextField
        label="Document ID"
        placeholder="Enter Document ID"
        value={docId}
        onChange={(e) => setDocId(e.target.value)}
        size="small"
      />
      <Button variant="contained" onClick={openDocument}>Open</Button>
    </Stack>
  );
};

export default DocumentList;
