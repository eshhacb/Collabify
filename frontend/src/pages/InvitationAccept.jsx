import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, Clock, User, FileText, Shield } from 'lucide-react';
import { config } from '../config.js';

const InvitationAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`${config.API_URL}/api/invitations/token/${token}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch invitation');
      }

      setInvitation(data.invitation);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    setIsAccepting(true);
    setError('');

    try {
      const response = await fetch(`${config.API_URL}/api/auth/accept-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          invitationToken: token,
          userData: null // Will be null if user is already logged in
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresRegistration) {
          // Handle user registration flow
          setError('Please create an account to accept this invitation');
          // You could redirect to registration page or show registration form
          return;
        }
        throw new Error(data.message || 'Failed to accept invitation');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userEmail', data.user.email);

      setSuccess('Invitation accepted successfully!');
      
      // Redirect to document after 2 seconds
      setTimeout(() => {
        navigate(`/collaborate/${invitation.documentId}`);
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'expired':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation Not Found</h1>
            <p className="text-gray-600 mb-6">This invitation could not be found or has been removed.</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-8 text-center">
            <Mail className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Document Invitation</h1>
            <p className="text-indigo-100">You've been invited to collaborate</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {success ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h2>
                <p className="text-gray-600 mb-6">You're being redirected to the document...</p>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : (
              <>
                {/* Document Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">{invitation.documentTitle}</h2>
                  </div>
                  
                  <div className="flex items-center space-x-3 mb-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">Invited by {invitation.invitedByName}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-600">Role: <span className="font-medium capitalize">{invitation.role}</span></span>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-6">
                  <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(invitation.status)}`}>
                    {getStatusIcon(invitation.status)}
                    <span className="ml-2">{getStatusText(invitation.status)}</span>
                  </div>
                  
                  {invitation.status === 'pending' && (
                    <p className="text-sm text-gray-500 mt-2">
                      Expires on {formatDate(invitation.expiresAt)}
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {invitation.status === 'pending' && (
                    <button
                      onClick={handleAcceptInvitation}
                      disabled={isAccepting}
                      className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {isAccepting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Accepting...
                        </>
                      ) : (
                        'Accept Invitation'
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate('/')}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Go to Home
                  </button>
                </div>

                {/* Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> If you don't have an account, you'll be able to create one when you accept the invitation.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationAccept;
