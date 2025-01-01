// src/SpotifyAuth.ts
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const SCOPES = "user-library-read user-read-private"; // Adjust scopes based on your needs

const generateAuthUrl = () => {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=${SCOPES}`;
  return authUrl;
};

export { generateAuthUrl };
