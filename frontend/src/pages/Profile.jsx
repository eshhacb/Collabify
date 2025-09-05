import React, { useEffect, useMemo, useState } from "react";
import { getAllDocuments } from "../api/documentService";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";

const StatCard = ({ label, value, color = "primary" }) => (
  <Paper elevation={2} style={{ padding: 16 }}>
    <Typography variant="overline" color="text.secondary">{label}</Typography>
    <Typography variant="h5" color={color}>{value}</Typography>
  </Paper>
);

const Profile = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const userEmail = useMemo(() => localStorage.getItem("userEmail") || "", []);
  const userName = useMemo(() => localStorage.getItem("userName") || "", []);
  const avatarLetter = (userName || userEmail || "?").charAt(0).toUpperCase();

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllDocuments();
        setDocuments(res.documents || []);
      } catch (e) {
        console.error("Failed to load documents for profile:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const myDocs = useMemo(() => documents.filter(d => d.isOwner), [documents]);
  const sharedDocs = useMemo(() => documents.filter(d => !d.isOwner), [documents]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
          <Avatar sx={{ width: 56, height: 56 }}>{avatarLetter}</Avatar>
          <Box>
            <Typography variant="h6">{userName || 'Your Profile'}</Typography>
            <Typography variant="body2" color="text.secondary">{userEmail}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip size="small" label={`Role: User`} />
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <StatCard label="Total Documents" value={documents.length} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="My Documents" value={myDocs.length} color="success.main" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard label="Shared With Me" value={sharedDocs.length} color="info.main" />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Recent Documents</Typography>
        <Divider />
        <Box sx={{ mt: 2 }}>
          {loading ? (
            <Typography variant="body2" color="text.secondary">Loading…</Typography>
          ) : documents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No documents found.</Typography>
          ) : (
            <Grid container spacing={2}>
              {documents.slice(0, 6).map(doc => (
                <Grid key={doc.id} item xs={12} sm={6} md={4}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" noWrap>{doc.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {doc.isOwner ? 'Owner' : `Shared (${doc.userRole || 'viewer'})`}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;