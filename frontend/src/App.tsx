import { useEffect, useState } from "react";
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
  const [player, setPlayer] = useState<any>(null); // Spotify Player instance
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically load the Spotify Web Playback SDK script
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onload = () => {
      console.log("Spotify Web Playback SDK loaded");
      initializePlayer();  // Initialize player once the SDK is loaded
    };
    script.onerror = (error) => {
      console.error("Error loading Spotify Web Playback SDK", error);
    };
    document.body.appendChild(script);

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
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
    window.location.href = generateAuthUrl();
  };

  const fetchPlaylists = async () => {
    if (accessToken) {
      const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setPlaylists(response.data.items);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchPlaylists();
    }
  }, [accessToken]);

  const initializePlayer = () => {
    if (typeof window.Spotify === "undefined") {
      console.error("Spotify Web Playback SDK is not loaded properly");
      return;
    }

    const newPlayer = new window.Spotify.Player({
      name: "Web Playback SDK",
      getOAuthToken: (cb: Function) => {
        cb(accessToken);
      },
      volume: 0.5,
    });

    newPlayer.on("initialization_error", (e: any) => {
      console.error(e);
    });

    newPlayer.on("authentication_error", (e: any) => {
      console.error(e);
    });

    newPlayer.on("player_state_changed", (state: any) => {
      console.log(state);
    });

    newPlayer.on("ready", (data: any) => {
      console.log("The Web Playback SDK is ready");
      setPlayer(newPlayer);
      setDeviceId(data.device_id);  // Store the device_id for later use
    });

    newPlayer.connect();
  };

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    if (player) {
      player.resume();
      player.play({
        uris: [`spotify:playlist:${playlist.id}`],
      });
    }
  };

  const togglePlayPause = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const transferPlayback = async () => {
    if (deviceId && accessToken) {
      try {
        await axios.put(
          `https://api.spotify.com/v1/me/player`,
          {
            device_ids: [deviceId],
            play: true,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        console.log("Playback transferred to the Web Playback SDK device.");
      } catch (error) {
        console.error("Error transferring playback:", error);
      }
    }
  };

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
                <div
                  key={playlist.id}
                  className="playlist-item"
                  onClick={() => handlePlaylistSelect(playlist)}
                >
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
            {selectedPlaylist && (
              <div>
                <h3>Now Playing: {selectedPlaylist.name}</h3>
                <button onClick={togglePlayPause}>Play/Pause</button>
              </div>
            )}
            <button onClick={transferPlayback}>Transfer Playback to Web Player</button>
          </div>
        </>
      ) : (
        <button onClick={handleLoginClick}>Login with Spotify</button>
      )}
    </div>
  );
};

export default App;
