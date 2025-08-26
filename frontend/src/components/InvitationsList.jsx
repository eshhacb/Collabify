import React, { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle, XCircle, Trash2, User } from 'lucide-react';
import { config } from '../config.js';

const InvitationsList = ({ documentId, userRole }) => {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchInvitations = async () => {
    if (!documentId || !['admin', 'editor'].includes(userRole)) return;

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/documents/${documentId}/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch invitations');
      }

      setInvitations(data.invitations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelInvitation = async (invitationId) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/documents/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel invitation');
      }

      // Refresh the list
      fetchInvitations();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      case 'accepted':
        return 'text-green-700 bg-green-100';
      case 'expired':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  useEffect(() => {
    fetchInvitations();
  }, [documentId, userRole]);

  if (!['admin', 'editor'].includes(userRole)) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Mail className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Pending Invitations</h3>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-gray-600">Loading invitations...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No pending invitations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {invitation.email}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {getStatusIcon(invitation.status)}
                        <span className="ml-1">{getStatusText(invitation.status)}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="capitalize">{invitation.role}</span>
                      <span>•</span>
                      <span>Invited by {invitation.invitedByName}</span>
                      <span>•</span>
                      <span>{formatDate(invitation.createdAt)}</span>
                      {invitation.status === 'pending' && (
                        <>
                          <span>•</span>
                          <span className={isExpired(invitation.expiresAt) ? 'text-red-600' : ''}>
                            Expires {formatDate(invitation.expiresAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {invitation.status === 'pending' && (
                  <button
                    onClick={() => cancelInvitation(invitation.id)}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Cancel invitation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationsList;
