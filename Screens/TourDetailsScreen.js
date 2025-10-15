// screens/TourDetailsScreen.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TourDetailsScreen({ route }) {
  const tour = route?.params?.tour ?? {};

  // Cover image: imageUrls[0] or imageUrl
  const cover =
    (Array.isArray(tour.imageUrls) && tour.imageUrls[0]) ||
    tour.imageUrl ||
    null;

  // Build route from locations: [{ first, second }, ...] => stops: [first, second, ...]
  const legs = Array.isArray(tour.locations) ? tour.locations.filter(l => l && (l.first || l.second)) : [];
  const stops = [];
  if (legs.length) {
    if (legs[0]?.first) stops.push(String(legs[0].first));
    legs.forEach(l => {
      if (l?.second) {
        const s = String(l.second);
        if (stops[stops.length - 1] !== s) stops.push(s);
      }
    });
  }

  const routeLine = stops.length ? stops.join(' → ') : '';

  const formattedCost =
    tour.cost != null ? `PKR ${Number(tour.cost).toLocaleString()}` : '';

  const handleEmailBooking = () => {
    const subject = encodeURIComponent(`Tour Booking Request: ${tour.title || 'Tour'}`);
    const body = encodeURIComponent(
      `Hello,\n\nI would like to request a booking for:\n\n` +
      `Tour: ${tour.title || 'Tour'}\n` +
      (routeLine ? `Route: ${routeLine}\n` : '') +
      (formattedCost ? `Cost: ${formattedCost}\n` : '') +
      `\nPlease confirm availability.\n\nThank you.`
    );
    Linking.openURL(`mailto:m.happyhaseeb@gmail.com?subject=${subject}&body=${body}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {cover ? <Image source={{ uri: cover }} style={styles.image} /> : null}

      <View style={styles.content}>
        <Text style={styles.title}>{tour.title || 'Tour'}</Text>

        {/* Route */}
        {!!routeLine && (
          <View style={styles.routeWrap}>
            <Ionicons name="navigate-outline" size={18} color="#66CCFF" style={{ marginRight: 6 }} />
            <Text style={styles.routeText}>{routeLine}</Text>
          </View>
        )}

        {!!formattedCost && <Text style={styles.cost}>{formattedCost}</Text>}

        {!!tour.description && (
          <Text style={styles.description}>{tour.description}</Text>
        )}

        {/* Optional: pretty timeline */}
        {stops.length > 1 && (
          <View style={styles.timeline}>
            {stops.map((s, i) => (
              <View key={`${s}-${i}`} style={styles.timelineRow}>
                <View style={styles.timelineColIcon}>
                  <View style={[styles.dot, i === 0 && styles.dotStart, i === stops.length - 1 && styles.dotEnd]} />
                  {i < stops.length - 1 && <View style={styles.connector} />}
                </View>
                <Text style={styles.timelineText}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleEmailBooking} activeOpacity={0.9}>
          <Text style={styles.buttonText}>Request for Booking</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, backgroundColor: '#0B0C10' },
  image: { width: '100%', height: 250, resizeMode: 'cover' },
  content: { padding: 20 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginBottom: 8 },

  routeWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  routeText: { color: '#A8D8FF', fontSize: 15, fontWeight: '600' },

  cost: { color: '#00C6FF', fontSize: 18, fontWeight: '600', marginBottom: 16, marginTop: 10 },
  description: { color: '#CCCCCC', fontSize: 16, lineHeight: 24, marginBottom: 24 },

  timeline: { marginBottom: 16, marginTop: 6 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineColIcon: { width: 18, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#66CCFF', marginTop: 2 },
  dotStart: { backgroundColor: '#4ADE80' },  // start = green
  dotEnd: { backgroundColor: '#F59E0B' },    // end = amber
  connector: { width: 2, flex: 1, backgroundColor: '#244657', marginTop: 2, marginBottom: 6 },
  timelineText: { color: '#D6E9FF', fontSize: 15, marginLeft: 8, marginBottom: 10 },

  // ⬇️ Button colors aligned with HomeScreen (gold)
  button: {
    backgroundColor: '#b88a44',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#b88a44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 7,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});
