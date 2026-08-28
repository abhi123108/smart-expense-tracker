import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function Profile() {
  const { user } = useAuth();

  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(
    user?.profilePicture
      ? user.profilePicture.startsWith('http')
        ? user.profilePicture
        : `${API_BASE_URL}${user.profilePicture}`
      : null
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const userName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    'User';

  const userEmail =
    user?.email || '';

  const initials =
    userName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase() || 'U';

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage('');
    setError('');

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        'Only JPG, PNG, WEBP and GIF images are allowed.'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        'Image size must be less than 5 MB.'
      );
      return;
    }

    setSelectedFile(file);

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();

      formData.append(
        'profilePicture',
        selectedFile
      );

      const { data } = await api.post(
        '/auth/profile/photo',
        formData
      );

      const profilePicture = data.profilePicture;

      const imageUrl = profilePicture.startsWith('http')
        ? profilePicture
        : `${API_BASE_URL}${profilePicture}`;

      setPreview(imageUrl);
      setSelectedFile(null);
      setMessage(
        'Profile photo updated successfully.'
      );

      // Update stored user information
      const storedUser =
        localStorage.getItem('userInfo');

      if (storedUser) {
        const userInfo = JSON.parse(storedUser);

        userInfo.profilePicture =
          profilePicture;

        localStorage.setItem(
          'userInfo',
          JSON.stringify(userInfo)
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to upload profile photo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '40px 24px',
      }}
    >
      <div
        style={{
          marginBottom: '30px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '28px',
          }}
        >
          Profile
        </h1>

        <p
          style={{
            marginTop: '8px',
            color: '#667085',
          }}
        >
          Manage your ExpenseAI profile.
        </p>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e6e9f0',
          borderRadius: '18px',
          padding: '32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: '#5557dd',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {preview ? (
              <img
                src={preview}
                alt={userName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              initials
            )}
          </div>

          <div>
            <h2
              style={{
                margin: '0 0 6px',
              }}
            >
              {userName}
            </h2>

            <p
              style={{
                margin: 0,
                color: '#667085',
              }}
            >
              {userEmail}
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #e6e9f0',
            paddingTop: '28px',
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Profile photo
          </h3>

          <p
            style={{
              color: '#667085',
              fontSize: '14px',
              lineHeight: 1.6,
            }}
          >
            Upload a custom profile photo. JPG, PNG,
            WEBP and GIF files up to 5 MB are supported.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            style={{
              display: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '20px',
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={loading}
            >
              Choose Photo
            </button>

            {selectedFile && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={loading}
              >
                {loading
                  ? 'Uploading...'
                  : 'Save Photo'}
              </button>
            )}
          </div>

          {selectedFile && (
            <p
              style={{
                marginTop: '14px',
                fontSize: '13px',
                color: '#667085',
              }}
            >
              Selected: {selectedFile.name}
            </p>
          )}

          {message && (
            <p
              style={{
                marginTop: '16px',
                color: 'green',
                fontSize: '14px',
              }}
            >
              {message}
            </p>
          )}

          {error && (
            <p
              style={{
                marginTop: '16px',
                color: '#d92d20',
                fontSize: '14px',
              }}
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}