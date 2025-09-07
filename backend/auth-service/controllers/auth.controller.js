import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const user = await User.create({ name, email, passwordHash: password });
    res.status(201).json({ message: "User created successfully", user });
    console.log("User Created");
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error witnesssed");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.cookie("token", token, {
      httpOnly: true, // Prevents access from JavaScript
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "Strict" });
  res.json({ message: "Logged out successfully" });
};

// Batch user lookup by IDs (service use or internal admin)
export const getUsersByIds = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.length) return res.json({ users: [] });
    const users = await User.findAll({
      where: { id: ids },
      attributes: ["id", "name", "email"],
    });
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { invitationToken, userData } = req.body;

    if (!invitationToken) {
      return res.status(400).json({ message: "Invitation token is required" });
    }

    // Get invitation details from notification service
    const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5004';
    
    const invitationResponse = await fetch(`${notificationServiceUrl}/api/invitations/token/${invitationToken}`);
    const invitationData = await invitationResponse.json();

    if (!invitationResponse.ok) {
      return res.status(400).json({ message: invitationData.message || "Invalid invitation" });
    }

    const invitation = invitationData.invitation;

    // Check if user already exists
    let user = await User.findOne({ where: { email: invitation.email } });

    if (!user) {
      // Create new user if they don't exist
      if (!userData || !userData.name || !userData.password) {
        return res.status(400).json({ 
          message: "User account required", 
          requiresRegistration: true,
          email: invitation.email 
        });
      }

      // Check if email matches invitation
      if (userData.email !== invitation.email) {
        return res.status(400).json({ message: "Email must match invitation" });
      }

      // Create new user
      user = await User.create({ 
        name: userData.name, 
        email: userData.email, 
        passwordHash: userData.password 
      });
    }

    // Accept the invitation
    const acceptResponse = await fetch(`${notificationServiceUrl}/api/invitations/accept/${invitationToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: user.id })
    });

    if (!acceptResponse.ok) {
      return res.status(400).json({ message: "Failed to accept invitation" });
    }

    // Add user to document via Document Service internal endpoint
    try {
      const documentServiceUrl = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:5002';
      const serviceSecret = process.env.SERVICE_SECRET || '';
      await fetch(`${documentServiceUrl}/api/documents/internal/invitations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-secret': serviceSecret
        },
        body: JSON.stringify({ documentId: invitation.documentId, userId: user.id, role: invitation.role })
      });
    } catch (_) {
      // Non-fatal: if membership add fails here, the user can still access after manual add
    }

    const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000,
    });

    res.json({ 
      message: "Invitation accepted successfully", 
      token, 
      user,
      documentId: invitation.documentId,
      role: invitation.role
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: error.message });
  }
};
