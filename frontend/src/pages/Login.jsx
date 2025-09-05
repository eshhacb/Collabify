import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/authService";
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

  const handleLogin = async () => {
    try {
      const res = await loginUser({ email, password });
      if (res?.data?.token) {
        localStorage.setItem("token", res.data.token);
      }
      if (res?.data?.user?.email) {
        localStorage.setItem("userEmail", res.data.user.email);
      }
      navigate("/documents");
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
