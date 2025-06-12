/**
 * @typedef {Object} Device
 * @property {string} id - The Spotify device ID
 * @property {string} name - The display name of the device
 */

/**
 * @typedef {Object} Playlist
 * @property {string} image_url - The URL of the playlist image
 * @property {string} id - The Spotify playlist ID
 * @property {string} name - The display name of the playlist
 */

/**
 * @typedef {Object} CardConfig
 * @property {Device[]} devices - Array of available Spotify devices
 * @property {Playlist[]} playlists - Array of user's Spotify playlists
 */

/**
 *
 * @param {CardConfig} config - Card configuration
 * @returns {string} HTML string containing the card
 */
function renderCard({ devices, playlists }) {
  return `
    <ha-card>
        <div class="card-content">
          <div class="device-selector">
            <h3>Select Device</h3>
            <select id="device-select">
              ${devices
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
}
