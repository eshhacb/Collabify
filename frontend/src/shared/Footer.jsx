import React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <Box component="footer" sx={{ py: 2, borderTop: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          © {year} Collabify
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href="#" underline="hover" color="inherit" variant="body2">Privacy</Link>
          <Link href="#" underline="hover" color="inherit" variant="body2">Terms</Link>
          <Link href="#" underline="hover" color="inherit" variant="body2">Support</Link>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;


