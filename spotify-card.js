class SpotifyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!config.devices || !Array.isArray(config.devices)) {
      throw new Error("Please define devices in the card configuration");
    }

    if (!config.player || typeof config.player !== "string") {
      throw new Error(
        "Please define a player (usually mediaplayer.spotifyplus_<username> or similar) in the card configuration"
      );
    }

    if (!config.user || typeof config.user !== "string") {
      throw new Error("Please define a user in the card configuration");
    }

    // Validate device configuration
    config.devices.forEach((device) => {
      if (!device.id || !device.name) {
        throw new Error("Each device must have an id and name");
      }
    });

    this.config = config;
  }

  async render(hass) {
    if (!hass) return;

    if (!this.shadowRoot) return;

    let selectedPlaylistUri = null;
    let selectedDeviceId = null;

    // Get playlists from Spotify integration
    const playlists = await this.getPlaylists(hass);

    const render = () => {
      this.shadowRoot.innerHTML = renderCard({
        devices: this.config.devices,
        playlists: playlists,
        selectedPlaylistUri: selectedPlaylistUri,
        selectedDeviceId: selectedDeviceId,
      });
    };

    render();

    // Add event listeners
    this.shadowRoot
      .getElementById("play-button")
      .addEventListener("click", () => {
        const deviceId = this.shadowRoot.getElementById("device-select").value;
        const playlistUri = this.shadowRoot.querySelector(
          'input[name="playlist"]:checked'
        ).value;

        if (deviceId && playlistUri) {
          this.playPlaylist(
            hass,
            deviceId.split("-")[1],
            playlistUri.split("-")[1]
          );
        }
      });
  }

  async getPlaylists(hass) {
    if (!this.playlists) {
      try {
        const response = await CallServiceWithResponse(hass, {
          domain: "spotifyplus",
          service: "get_playlists_for_user",
          serviceData: {
            entity_id: this.config.player,
            user_id: this.config.user,
            limit_total: 75,
          },
        });
        this.playlists = response.result.items || [];
      } catch (error) {
        console.error("Error fetching playlists:", error);
        return [];
      }
    }

    return this.playlists;
  }

  async playPlaylist(hass, deviceId, playlistUri) {
    try {
      await hass.callService("spotifyplus", "player_media_play_context", {
        entity_id: this.config.player,
        device_id: deviceId,
        context_uri: playlistUri,
      });
    } catch (error) {
      console.error("Error playing playlist:", error);
    }
  }

  set hass(hass) {
    if (!this._hass) {
      this._hass = hass;
      this.render(hass);
    }
  }

  getCardSize() {
    return 3;
  }
}

/**
 *
 * @param {*} hass
 * @param {{domain: string, service: string, serviceData: object}} serviceRequest - Service request object
 * @returns {Promise<object>} Service response object
 */
async function CallServiceWithResponse(hass, serviceRequest) {
  try {
    const serviceResponse = await hass.connection.sendMessagePromise({
      type: "execute_script",
      sequence: [
        {
          service: serviceRequest.domain + "." + serviceRequest.service,
          data: serviceRequest.serviceData,
          response_variable: "service_result",
        },
        {
          stop: "done",
          response_variable: "service_result",
        },
      ],
    });

    return serviceResponse.response;
  } catch (error) {
    console.error("Error calling service:", error);
    return null;
  }
}

customElements.define("spotify-card", SpotifyCard);

/**
 * @typedef {Object} Device
 * @property {string} id - The Spotify device ID
 * @property {string} name - The display name of the device
 */

/**
 * @typedef {Object} Playlist
 * @property {string} image_url - The URL of the playlist image
 * @property {string} uri - The Spotify playlist uri
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
  <style>
    .card-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .item {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
    }

    .image {
      border-radius: 10px;
      width: 100px;
      aspect-ratio: 1/1;
      object-fit: cover;
      filter: grayscale(1);
      opacity: 0.7;
    }

    .label {
      color: #333;
    }

    fieldset.hidden-radio input[type="radio"] {
      display: none;
    }

    fieldset.hidden-radio input[type="radio"]:checked + .item .image {
      filter: grayscale(0);
      opacity: 1;
    }

    fieldset.hidden-radio input[type="radio"]:checked + .item .label {
      color: #fff;
    }

    .selector {
      display: flex;
      gap: 10px;
      align-items: center;
      border: 0;
    }

    .controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 5px;
    }

    .control-button {
      flex-grow: 1;
      padding: 10px;
      border: 0;
      outline: 0;
    }
      
    .play {
      background-color:rgb(0, 73, 26);
    }

    .pause {
      background-color:rgb(102, 0, 0);
    }

    .device-select {
      padding: 10px;
      border-radius: 10px;
    }
  </style>
    <ha-card>
        <div class="card-content">
    
          
          <fieldset class="selector hidden-radio" id="playlist-select">
            ${playlists.map((playlist) => renderPlaylist(playlist)).join("")}
          </fieldset>

          <select type="select" class="device-select" id="device-select">
            ${devices.map((device) => renderDeviceSelector(device)).join("")}
          </select>

          <div class="controls">
            <button class="control-button pause" id="pause-button">Pause</button>
            <button class="control-button play" id="play-button">Play</button>
          </div>
        </div>
      </ha-card>
    `;
}

function renderPlaylist(playlist) {
  return `
  <label for="playlist-${playlist.uri}">
    <input type="radio" name="playlist" id="playlist-${playlist.uri}" value="playlist-${playlist.uri}" />
    <span class="item">
      <img class="image" src="${playlist.image_url}" alt="${playlist.name}" />
      <span class="label">${playlist.name}</span>
    </span>
  </label>
  `;
}

function renderDeviceSelector(device) {
  return `
    <option value="device-${device.id}">${device.name}</option>
  `;
}
