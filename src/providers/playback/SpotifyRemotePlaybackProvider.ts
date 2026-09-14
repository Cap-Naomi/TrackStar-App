import type { Track } from '@/types';
import { readSpotifyToken } from '@/services/spotifyTokenStorage';
import {
  findControllableSpotifyDevice,
  pauseSpotifyPlayback,
  resumeSpotifyPlayback,
  startSpotifyTrack,
  SpotifyPlaybackError,
} from '@/services/spotifyPlayback';
import type { PlaybackProvider } from './PlaybackProvider';

export class SpotifyRemotePlaybackProvider implements PlaybackProvider {
  private spotifyUri: string | null = null;
  private startedUri: string | null = null;
  private deviceId: string | null = null;

  async load(track: Track): Promise<void> {
    if (!track.spotifyUri) {
      throw new SpotifyPlaybackError(null, 'This track cannot be played through Spotify Connect.');
    }
    this.spotifyUri = track.spotifyUri;
  }

  async play(): Promise<void> {
    const accessToken = await this.getAccessToken();
    if (!this.spotifyUri) throw new SpotifyPlaybackError(null, 'No Spotify track is selected.');
    if (!this.deviceId) {
      const device = await findControllableSpotifyDevice(accessToken);
      this.deviceId = device.id;
    }
    if (!this.deviceId) {
      throw new SpotifyPlaybackError(null, 'No controllable Spotify device is available.');
    }
    if (this.startedUri !== this.spotifyUri) {
      await startSpotifyTrack(accessToken, this.spotifyUri, this.deviceId);
      this.startedUri = this.spotifyUri;
      return;
    }
    await resumeSpotifyPlayback(accessToken, this.deviceId);
  }

  async pause(): Promise<void> {
    if (!this.deviceId || !this.startedUri) return;
    await pauseSpotifyPlayback(await this.getAccessToken(), this.deviceId);
  }

  async stop(): Promise<void> {
    await this.pause();
  }

  async seekToStart(): Promise<void> {
    if (!this.spotifyUri || !this.deviceId) return;
    await startSpotifyTrack(await this.getAccessToken(), this.spotifyUri, this.deviceId);
    this.startedUri = this.spotifyUri;
  }

  async getPositionMs(): Promise<number> {
    return 0;
  }

  async release(): Promise<void> {
    this.spotifyUri = null;
    this.startedUri = null;
    this.deviceId = null;
  }

  private async getAccessToken(): Promise<string> {
    const token = await readSpotifyToken();
    if (!token?.accessToken) {
      throw new SpotifyPlaybackError(null, 'Reconnect Spotify to enable playback control.');
    }
    return token.accessToken;
  }
}
