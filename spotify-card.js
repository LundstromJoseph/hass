class SpotifyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!config.devices || !Array.isArray(config.devices)) {
      throw new Error("Please define devices in the card configuration");
    }

    // Validate device configuration
    config.devices.forEach((device) => {
      if (!device.id || !device.name) {
        throw new Error("Each device must have an id and name");
      }
    });

    this.config = config;
    this.render();
  }

  async render() {
    if (!this.shadowRoot) return;

    // Get playlists from Spotify integration
    const playlists = await this.getPlaylists();

    this.shadowRoot.innerHTML = `
      <ha-card>
        <div class="card-content">
          <div class="device-selector">
            <h3>Select Device</h3>
            <select id="device-select">
              ${this.config.devices
                .map(
                  (device) => `
                <option value="${device.id}">${device.name}</option>
              `
                )
                .join("")}
            </select>
          </div>
          
          <div class="playlist-selector">
            <h3>Select Playlist</h3>
            <select id="playlist-select">
              ${playlists
                .map(
                  (playlist) => `
                <option value="${playlist.id}">${playlist.name}</option>
              `
                )
                .join("")}
            </select>
          </div>

          <div class="controls">
            <button id="play-button">Play</button>
          </div>
        </div>
      </ha-card>
    `;

    // Add event listeners
    this.shadowRoot
      .getElementById("play-button")
      .addEventListener("click", () => {
        this.playPlaylist();
      });
  }

  async getPlaylists() {
    try {
      const response = await fetch("/api/services/spotify/get_playlists");
      const data = await response.json();
      return data.playlists || [];
    } catch (error) {
      console.error("Error fetching playlists:", error);
      return [];
    }
  }

  async playPlaylist() {
    const deviceId = this.shadowRoot.getElementById("device-select").value;
    const playlistId = this.shadowRoot.getElementById("playlist-select").value;

    try {
      await fetch("/api/services/spotify/play_playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_id: deviceId,
          playlist_id: playlistId,
        }),
      });
    } catch (error) {
      console.error("Error playing playlist:", error);
    }
  }

  getCardSize() {
    return 3;
  }
}

customElements.define("spotify-card", SpotifyCard);
