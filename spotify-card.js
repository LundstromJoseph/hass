import { renderCard } from "./spotify-card-renderer";

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

    // Get playlists from Spotify integration
    const playlists = await this.getPlaylists(hass);

    this.shadowRoot.innerHTML = renderCard({
      devices: this.config.devices,
      playlists: playlists,
    });

    // Add event listeners
    this.shadowRoot
      .getElementById("play-button")
      .addEventListener("click", () => {
        this.playPlaylist();
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

  async playPlaylist() {
    const deviceId = this.shadowRoot.getElementById("device-select").value;
    const playlistId = this.shadowRoot.getElementById("playlist-select").value;

    try {
      await this.hass.callService("spotifyplus", "play_playlist", {
        entity_id: this.config.player,
        device_id: deviceId,
        playlist_id: playlistId,
      });
    } catch (error) {
      console.error("Error playing playlist:", error);
    }
  }

  set hass(hass) {
    this.render(hass);
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
