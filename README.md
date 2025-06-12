# Spotify Card for Home Assistant

A custom card for Home Assistant that allows you to control Spotify playback on specific devices.

## Features

- Configure your Spotify devices directly in the card
- Browse and select from your Spotify playlists
- Play selected playlists on chosen devices

## Installation

### Using HACS (Recommended)

1. Make sure you have [HACS](https://hacs.xyz/) installed
2. Add this as a local custom repository in HACS:
   - Click on "Custom Repositories" in HACS
   - Add the local path to this repository
   - Select "Lovelace" as the category
3. Click "Download" in HACS
4. Add the card to your dashboard using the following configuration:

```yaml
type: "custom:simple-spotify-card"
devices:
  - id: "your_device_id_1"
    name: "Living Room Speaker"
  - id: "your_device_id_2"
    name: "Kitchen Speaker"
  - id: "your_device_id_3"
    name: "Bedroom Speaker"
```

## Finding Your Device IDs

To find your Spotify device IDs:

1. Open Home Assistant
2. Go to Developer Tools → Services
3. Select `spotify.get_devices` from the service dropdown
4. Click "Call Service"
5. Look for the `id` field in the response for each device

## Requirements

- Home Assistant with the official Spotify integration installed and configured
- Spotify Premium account
- HACS (for installation)

## Notes

- Make sure your Spotify integration is properly configured in Home Assistant before using this card.
- Each device in the configuration must have both an `id` and a `name`.
- The device IDs must match your actual Spotify device IDs.
