import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, logoutUser } from "../api/authService";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // If user is already logged in and visits login page, warn and log out on confirm
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const shouldLogout = window.confirm("You are already logged in. Do you want to log out?");
      if (shouldLogout) {
        (async () => {
          try { await logoutUser(); } catch {}
          localStorage.removeItem("token");
          localStorage.removeItem("userEmail");
        })();
      } else {
        navigate("/documents", { replace: true });
      }
    }
  }, [navigate]);

  const handleLogin = async () => {
    try {
      const res = await loginUser({ email, password });
      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
      }
      if (res?.data?.user?.email) {
        localStorage.setItem("userEmail", res.data.user.email);
      }
      if (res?.data?.user?.name) {
        localStorage.setItem("userName", res.data.user.name);
      }
      navigate("/profile");
    } catch (error) {
      console.error("Login failed:", error.response?.data?.message || error.message);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display: "flex", alignItems: "center", minHeight: "100vh" }}>
      <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
        <Typography variant="h5" align="center" gutterBottom>
          Login
        </Typography>
        <Stack spacing={2}>
          <TextField
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
          <TextField
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={handleLogin} fullWidth>
            Login
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Login;
