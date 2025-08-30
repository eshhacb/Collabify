import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";

const roleColor = (role) => {
  switch (role) {
    case "admin":
      return "secondary";
    case "editor":
      return "primary";
    case "viewer":
    default:
      return "default";
  }
};

const DocumentCard = ({ document }) => {
  const navigate = useNavigate();

  const openDoc = () => {
    if (!document?.id) return;
    navigate(`/collaborate/${document.id}`);
  };

  return (
    <Card variant="outlined" sx={{ height: 200 }}>
      <CardActionArea onClick={openDoc} sx={{ height: "100%" }}>
        <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Typography variant="h6" component="div" sx={{ pr: 1 }} noWrap>
              {document.title}
            </Typography>
            {document.userRole && (
              <Chip size="small" label={document.userRole} color={roleColor(document.userRole)} />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary" align="center">
            Click to open
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default DocumentCard;