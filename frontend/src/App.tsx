// src/App.tsx
import React, { useEffect, useState } from "react";
import { generateAuthUrl } from "./SpotifyAuth";
import axios from "axios";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

const App = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if the URL has a code parameter (after user logs in)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      // Exchange the code for an access token
      exchangeCodeForToken(code);
    }
  }, []);

  const exchangeCodeForToken = async (code: string) => {
    const response = await axios.post(
      `https://accounts.spotify.com/api/token`,
      new URLSearchParams({
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        },
      }
    );

    const { access_token } = response.data;
    setAccessToken(access_token);
  };

  const handleLoginClick = () => {
    // Redirect to Spotify login page
    window.location.href = generateAuthUrl();
  };

  const fetchUserProfile = async () => {
    if (accessToken) {
      const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log("User profile:", response.data);
    }
  };

  return (
    <div className="App">
      <h1>Spotify Authentication</h1>
      {accessToken ? (
        <>
          <p>Authenticated successfully!</p>
          <button onClick={fetchUserProfile}>Fetch User Profile</button>
        </>
      ) : (
        <button onClick={handleLoginClick}>Login with Spotify</button>
      )}
    </div>
  );
};

export default App;
