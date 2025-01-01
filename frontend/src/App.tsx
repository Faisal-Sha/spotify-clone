// src/App.tsx
import React, { useEffect, useState } from "react";
import { generateAuthUrl } from "./SpotifyAuth";
import axios from "axios";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;

interface Playlist {
  id: string;
  name: string;
  images: Array<{ url: string }>;
}

const App = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

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

  const fetchPlaylists = async () => {
    if (accessToken) {
      const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setPlaylists(response.data.items); // Get the playlists from the response
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchPlaylists(); // Fetch playlists after accessToken is set
    }
  }, [accessToken]);

  return (
    <div className="App">
      <h1>Spotify Authentication</h1>
      {accessToken ? (
        <>
          <p>Authenticated successfully!</p>
          <div>
            <h2>Your Playlists</h2>
            <div className="playlist-container">
              {playlists.map((playlist) => (
                <div key={playlist.id} className="playlist-item">
                  {playlist.images.length > 0 && (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="playlist-image"
                    />
                  )}
                  <h3>{playlist.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <button onClick={handleLoginClick}>Login with Spotify</button>
      )}
    </div>
  );
};

export default App;
