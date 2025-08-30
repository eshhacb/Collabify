import React, { useState } from "react";
import { addCollaborator, updateCollaboratorRole, removeCollaborator } from "../../api/documentService";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import MoreVertIcon from "@mui/icons-material/MoreVert";

// Admin-only menu for collaborator management
const DocumentMenu = ({ documentId, currentUserRole }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [addUserId, setAddUserId] = useState("");
  const [changeUserId, setChangeUserId] = useState("");
  const [removeUserId, setRemoveUserId] = useState("");
  const open = Boolean(anchorEl);

  const isAdmin = currentUserRole === "admin";
  if (!isAdmin) return null;

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleChangeRole = async (targetUserId, newRole) => {
    try {
      await updateCollaboratorRole(documentId, targetUserId, newRole);
      setChangeUserId("");
      handleClose();
    } catch (e) {
      console.error("Failed to update role:", e);
      alert(e?.response?.data?.message || "Failed to update role");
    }
  };

  const handleAddCollaborator = async (targetUserId, role) => {
    try {
      await addCollaborator(documentId, { userId: targetUserId, role });
      setAddUserId("");
      handleClose();
    } catch (e) {
      console.error("Failed to add collaborator:", e);
      alert(e?.response?.data?.message || "Failed to add collaborator");
    }
  };

  const handleRemove = async (targetUserId) => {
    try {
      await removeCollaborator(documentId, targetUserId);
      setRemoveUserId("");
      handleClose();
    } catch (e) {
      console.error("Failed to remove collaborator:", e);
      alert(e?.response?.data?.message || "Failed to remove collaborator");
    }
  };

  return (
    <>
      <Tooltip title="Manage collaborators">
        <IconButton size="small" onClick={handleOpen} aria-label="open document menu">
          <MoreVertIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} keepMounted>
        <Stack spacing={1} sx={{ p: 2, pt: 1.5, width: 300 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField size="small" label="User ID" value={addUserId} onChange={(e) => setAddUserId(e.target.value)} fullWidth />
            <Button size="small" variant="contained" onClick={() => handleAddCollaborator(addUserId, "viewer")}>
              Add Viewer
            </Button>
          </Stack>
          <Divider />
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField size="small" label="User ID" value={changeUserId} onChange={(e) => setChangeUserId(e.target.value)} fullWidth />
            <Button size="small" variant="outlined" onClick={() => handleChangeRole(changeUserId, "editor")}>Make Editor</Button>
            <Button size="small" variant="outlined" onClick={() => handleChangeRole(changeUserId, "admin")}>Make Admin</Button>
          </Stack>
          <Divider />
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField size="small" label="User ID" value={removeUserId} onChange={(e) => setRemoveUserId(e.target.value)} fullWidth />
            <Button size="small" color="error" variant="outlined" onClick={() => handleRemove(removeUserId)}>Remove</Button>
          </Stack>
        </Stack>
        <MenuItem onClick={handleClose} sx={{ display: "none" }}>close</MenuItem>
      </Menu>
    </>
  );
};

export default DocumentMenu;
