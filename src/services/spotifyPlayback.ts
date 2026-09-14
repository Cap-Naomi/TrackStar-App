const API_ROOT = 'https://api.spotify.com/v1';

export interface SpotifyDevice {
  id: string | null;
  is_active: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
}

interface SpotifyDevicesResponse {
  devices: SpotifyDevice[];
}

interface SpotifyErrorResponse {
  error?: {
    message?: string;
  };
}

export class SpotifyPlaybackError extends Error {
  constructor(public readonly status: number | null, message: string) {
    super(message);
    this.name = 'SpotifyPlaybackError';
  }
}

async function spotifyPlayerRequest<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let apiMessage: string | undefined;
    try {
      const body = await response.json() as SpotifyErrorResponse;
      apiMessage = body.error?.message;
    } catch {
      // Use the friendly status message below when Spotify returns no JSON body.
    }
    const message = response.status === 401
      ? 'Spotify authorization expired. Reconnect Spotify and try again.'
      : response.status === 403
        ? 'Spotify playback control requires Premium and playback permission. Reconnect Spotify and try again.'
        : response.status === 404
          ? 'No Spotify player is available. Open Spotify on a device, start any song once, then press play here.'
          : response.status === 429
            ? 'Spotify is rate-limiting playback. Wait a moment and try again.'
            : apiMessage ?? `Spotify playback failed (${response.status}).`;
    throw new SpotifyPlaybackError(response.status, message);
  }
  if (response.status === 204) return null;
  return response.json() as Promise<T>;
}

export async function getSpotifyDevices(accessToken: string): Promise<SpotifyDevice[]> {
  const response = await spotifyPlayerRequest<SpotifyDevicesResponse>(accessToken, '/me/player/devices');
  return response?.devices ?? [];
}

export async function findControllableSpotifyDevice(accessToken: string): Promise<SpotifyDevice> {
  const devices = await getSpotifyDevices(accessToken);
  const device = devices.find((candidate) => candidate.is_active && !candidate.is_restricted && candidate.id)
    ?? devices.find((candidate) => !candidate.is_restricted && candidate.id);
  if (!device) {
    throw new SpotifyPlaybackError(
      null,
      'No Spotify player is available. Open Spotify on a device, start any song once, then press play here.',
    );
  }
  return device;
}

export async function startSpotifyTrack(
  accessToken: string,
  spotifyUri: string,
  deviceId?: string,
): Promise<void> {
  const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
  await spotifyPlayerRequest(accessToken, `/me/player/play${query}`, {
    method: 'PUT',
    body: JSON.stringify({ uris: [spotifyUri], position_ms: 0 }),
  });
}

export async function resumeSpotifyPlayback(accessToken: string, deviceId?: string): Promise<void> {
  const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
  await spotifyPlayerRequest(accessToken, `/me/player/play${query}`, { method: 'PUT' });
}

export async function pauseSpotifyPlayback(accessToken: string, deviceId?: string): Promise<void> {
  const query = deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '';
  await spotifyPlayerRequest(accessToken, `/me/player/pause${query}`, { method: 'PUT' });
}
