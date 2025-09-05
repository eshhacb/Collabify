import React, { useMemo } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { logoutUser } from "../api/authService";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Logout from "@mui/icons-material/Logout";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { useColorMode } from "../main";

const Navbar = () => {
  const navigate = useNavigate();
  const { toggleColorMode, mode } = useColorMode();

  // Read auth state and user email from localStorage
  const isAuthenticated = useMemo(
    () => Boolean(localStorage.getItem("token")),
    [localStorage.getItem("token")]
  );
  const userEmail = useMemo(
    () => localStorage.getItem("userEmail") || "",
    [localStorage.getItem("userEmail")]
  );
  const avatarLetter = (userEmail?.[0] || "?").toUpperCase();

  const handleLogout = async () => {
    try { 
      await logoutUser(); 
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Collabify
        </Typography>

        {/* Theme toggle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 1 }}>
          <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
            <IconButton color="inherit" onClick={toggleColorMode} aria-label="toggle theme">
              {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Right side actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {!isAuthenticated ? (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button color="inherit" component={RouterLink} to="/">Register</Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/documents">Documents</Button>
              <Button color="inherit" component={RouterLink} to="/invitations">Invitations</Button>

              {/* Email indicator */}
              <Typography variant="body2" sx={{ ml: 1, mr: 0.5 }}>
                {userEmail}
              </Typography>

              {/* Profile icon - navigate to profile page */}
              <Tooltip title="Profile">
                <IconButton
                  onClick={() => navigate('/profile')}
                  size="small"
                  sx={{ ml: 0.5 }}
                  color="inherit"
                >
                  {userEmail ? (
                    <Avatar sx={{ width: 28, height: 28 }}>{avatarLetter}</Avatar>
                  ) : (
                    <AccountCircle />
                  )}
                </IconButton>
              </Tooltip>

              {/* Logout button */}
              <Tooltip title="Logout">
                <IconButton
                  onClick={handleLogout}
                  size="small"
                  sx={{ ml: 0.5 }}
                  color="inherit"
                >
                  <Logout />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;