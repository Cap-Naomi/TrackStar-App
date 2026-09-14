import {
  findControllableSpotifyDevice,
  getSpotifyDevices,
  startSpotifyTrack,
  SpotifyPlaybackError,
} from '@/services/spotifyPlayback';
import { hasSpotifyPlaybackScopes } from '@/providers/spotify/spotifyScopes';

describe('Spotify playback control', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it('requires both Spotify Connect permissions', () => {
    expect(hasSpotifyPlaybackScopes('user-read-private user-read-playback-state')).toBe(false);
    expect(hasSpotifyPlaybackScopes('user-modify-playback-state user-read-playback-state')).toBe(true);
  });

  it('prefers the active controllable Spotify device', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        devices: [
          { id: 'speaker', is_active: false, is_restricted: false, name: 'Speaker', type: 'speaker' },
          { id: 'computer', is_active: true, is_restricted: false, name: 'Computer', type: 'computer' },
        ],
      }),
    });

    await expect(findControllableSpotifyDevice('token')).resolves.toMatchObject({ id: 'computer' });
  });

  it('explains how to make a Spotify device available', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ devices: [] }) });

    await expect(findControllableSpotifyDevice('token')).rejects.toEqual(expect.objectContaining({
      message: expect.stringContaining('Open Spotify on a device'),
    }));
  });

  it('starts the selected track on the chosen device', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204 });

    await startSpotifyTrack('token', 'spotify:track:abc', 'device id');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/me/player/play?device_id=device%20id',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ uris: ['spotify:track:abc'], position_ms: 0 }),
      }),
    );
  });

  it('returns a useful Premium error for forbidden playback', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: 'Forbidden' } }),
    });

    await expect(getSpotifyDevices('token')).rejects.toEqual(expect.any(SpotifyPlaybackError));
    await expect(getSpotifyDevices('token')).rejects.toThrow('Premium');
  });
});
