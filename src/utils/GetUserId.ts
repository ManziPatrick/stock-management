import decodeToken from './decodeToken';

const getUserFromPersistedAuth = (): string | null => {
  const persistedAuth = localStorage.getItem('persist:auth');

  if (!persistedAuth) {
    console.error('No persisted auth found');
    return null;
  }

  try {
    // Parse the persisted auth string
    const authData = JSON.parse(persistedAuth);

    // Retrieve and sanitize the token
    const rawToken = authData?.token;
    const token = rawToken ? rawToken.replace(/"/g, '') : null;

    if (!token) {
      console.error('No valid token found in persisted auth');
      return null;
    }

    // Decode the token
    const user = decodeToken(token);
    if (user) {
      console.log('Decoded User:', user._id);
      return user._id; // Return the user ID
    } else {
      console.error('Failed to decode token');
      return null;
    }
  } catch (error) {
    console.error('Error parsing persisted auth or decoding token:', error);
    return null;
  }
};

export default getUserFromPersistedAuth;
