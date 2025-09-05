import mongoose from 'mongoose';

// In-memory storage for development when MongoDB is not available
let inMemoryInvitations = [];
let invitationIdCounter = 1;

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  documentId: {
    type: String,
    required: true
  },
  documentTitle: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['viewer', 'editor'],
    required: true
  },
  invitedBy: {
    type: String, // userId of the person who sent the invitation
    required: true
  },
  invitedByName: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
invitationSchema.index({ email: 1, documentId: 1 });
invitationSchema.index({ token: 1 });
invitationSchema.index({ expiresAt: 1 });

// Method to check if invitation is expired
invitationSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to mark as expired
invitationSchema.methods.markAsExpired = function() {
  this.status = 'expired';
  return this.save();
};

// Method to accept invitation
invitationSchema.methods.accept = function() {
  this.status = 'accepted';
  return this.save();
};

// Create the mongoose model
const InvitationModel = mongoose.model('Invitation', invitationSchema);

// In-memory invitation class for development
class InMemoryInvitation {
  constructor(data) {
    this._id = invitationIdCounter++;
    this.email = data.email;
    this.documentId = data.documentId;
    this.documentTitle = data.documentTitle;
    this.role = data.role;
    this.invitedBy = data.invitedBy;
    this.invitedByName = data.invitedByName;
    this.token = data.token;
    this.status = data.status || 'pending';
    this.expiresAt = data.expiresAt;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  isExpired() {
    return new Date() > this.expiresAt;
  }

  async markAsExpired() {
    this.status = 'expired';
    this.updatedAt = new Date();
    return this;
  }

  async reject() {
    this.status = 'rejected';
    this.updatedAt = new Date();
    return this;
  }

  async accept() {
    this.status = 'accepted';
    this.updatedAt = new Date();
    return this;
  }

  async save() {
    this.updatedAt = new Date();
    return this;
  }

  toJSON() {
    return {
      _id: this._id,
      email: this.email,
      documentId: this.documentId,
      documentTitle: this.documentTitle,
      role: this.role,
      invitedBy: this.invitedBy,
      invitedByName: this.invitedByName,
      token: this.token,
      status: this.status,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Create a wrapper class that uses either MongoDB or in-memory storage
class Invitation {
  static async create(data) {
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected, use mongoose model
      return await InvitationModel.create(data);
    } else {
      // Use in-memory storage
      const invitation = new InMemoryInvitation(data);
      inMemoryInvitations.push(invitation);
      return invitation;
    }
  }

  static async findOne(query) {
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected, use mongoose model
      return await InvitationModel.findOne(query);
    } else {
      // Use in-memory storage
      return inMemoryInvitations.find(inv => {
        if (query.token) return inv.token === query.token;
        if (query.email && query.documentId) {
          return inv.email === query.email && inv.documentId === query.documentId;
        }
        return false;
      });
    }
  }

  static async find(query = {}) {
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected, use mongoose model
      return await InvitationModel.find(query);
    } else {
      // Use in-memory storage
      if (query.documentId) {
        return inMemoryInvitations.filter(inv => inv.documentId === query.documentId);
      }
      return inMemoryInvitations;
    }
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected, use mongoose model
      return await InvitationModel.findById(id);
    } else {
      // Use in-memory storage
      return inMemoryInvitations.find(inv => inv._id === parseInt(id));
    }
  }

  static async updateMany(query, update) {
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected, use mongoose model
      return await InvitationModel.updateMany(query, update);
    } else {
      // Use in-memory storage
      let count = 0;
      inMemoryInvitations.forEach(inv => {
        if (inv.status === 'pending' && inv.expiresAt < new Date()) {
          inv.status = 'expired';
          inv.updatedAt = new Date();
          count++;
        }
      });
      return { modifiedCount: count };
    }
  }
}

export default Invitation;
