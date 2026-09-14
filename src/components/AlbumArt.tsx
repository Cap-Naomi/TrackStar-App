import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import type { Track } from '@/types';
import { colors } from '@/constants/colors';

export function AlbumArt({ track, size = 72 }: { track: Track; size?: number }) {
  if (track.artworkUrl) {
    return <Image accessibilityLabel={`${track.album ?? track.title} cover`} resizeMode="contain" source={{ uri: track.artworkUrl }} style={{ width: size, height: size }} />;
  }
  return (
    <LinearGradient colors={track.artworkColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.art, { width: size, height: size, borderRadius: size * 0.25 }]}>
      <View style={[styles.disc, { width: size * 0.52, height: size * 0.52, borderRadius: size * 0.26 }]}>
        <Ionicons name="pulse" size={size * 0.25} color={colors.textPrimary} />
      </View>
      {track.spotifyUrl ? <FontAwesome style={styles.spotify} name="spotify" size={size * 0.17} color="rgba(255,255,255,0.88)" /> : <Text style={[styles.star, { fontSize: size * 0.14 }]}>TS</Text>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  art: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  disc: { backgroundColor: 'rgba(0,0,0,0.32)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' },
  star: { position: 'absolute', bottom: 5, right: 7, color: 'rgba(255,255,255,0.75)', fontWeight: '900', letterSpacing: 1 },
  spotify: { position: 'absolute', bottom: 6, right: 6 },
});
