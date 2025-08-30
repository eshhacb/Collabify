import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { logoutUser } from "../api/authService";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useColorMode } from "../main";

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = document.cookie.includes("token=");
  const { toggleColorMode, mode } = useColorMode();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Collabify
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 1 }}>
          <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
            <IconButton color="inherit" onClick={toggleColorMode} aria-label="toggle theme">
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {!isAuthenticated ? (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/">
                Register
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/dashboard">
                Dashboard
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
