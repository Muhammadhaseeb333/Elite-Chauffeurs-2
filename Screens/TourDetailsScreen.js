// screens/TourDetailsScreen.js
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Linking, 
  ScrollView, 
  Alert,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enhanced simulator detection
const isSimulator = Platform.OS === 'ios' && !Linking.canOpenURL('tel:123');

export default function TourDetailsScreen({ route, navigation }) {
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

  // Optimized email function
  const handleEmailBooking = () => {
    const subject = `Tour Booking Request: ${tour.title || 'Tour'}`;
    const body =
      `Hello,\n\nI would like to request a booking for:\n\n` +
      `Tour: ${tour.title || 'Tour'}\n` +
      (routeLine ? `Route: ${routeLine}\n` : '') +
      (formattedCost ? `Cost: ${formattedCost}\n` : '') +
      `\nPlease confirm availability.\n\nThank you.`;

    // For simulator, show booking details immediately
    if (isSimulator) {
      showBookingDetails(subject, body);
      return;
    }

    const emailUrl = `mailto:info@elitechauffeurs.ie?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // For real devices, try to open email app
    Linking.openURL(emailUrl).catch((error) => {
      console.log('Email opening failed, showing booking details');
      showBookingDetails(subject, body);
    });
  };

  // Show booking details (used for simulator and fallback)
  const showBookingDetails = (subject, body) => {
    Alert.alert(
      '📧 Booking Request',
      'To book this tour, please contact us with the following details:',
      [
        {
          text: 'View Details',
          style: 'default',
          onPress: () => {
            Alert.alert(
              'Booking Information',
              `📋 Tour: ${tour.title || 'Tour'}\n\n📍 Route: ${routeLine || 'Not specified'}\n\n💰 Cost: ${formattedCost || 'Not specified'}\n\n📧 Email: m.happyhaseeb@gmail.com\n\nPlease include the tour name in your email.`,
              [{ text: 'Got it!', style: 'default' }]
            );
          }
        },
        {
          text: 'OK',
          style: 'cancel'
        }
      ]
    );
  };

  return (
    <View style={styles.mainContainer}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#b88a44" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container}>
        {cover ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: cover }} style={styles.image} />
          </View>
        ) : null}

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

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleEmailBooking} 
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Request for Booking</Text>
          </TouchableOpacity>

          {/* Simulator notice - only show in development */}
          {__DEV__ && isSimulator && (
            <View style={styles.simulatorNotice}>
              <Ionicons name="information-circle" size={16} color="#FFA500" />
              <Text style={styles.simulatorNoticeText}>
                Simulator detected - email will work on real device
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0B0C10',
  },
  container: { 
    paddingBottom: 30, 
    backgroundColor: '#0B0C10' 
  },
  // Back Button Styles
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(11, 12, 16, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imageContainer: {
    backgroundColor: '#0B0C10',
  },
  image: { 
    width: '100%', 
    height: 250, 
    resizeMode: 'cover' 
  },
  content: { 
    padding: 20,
    backgroundColor: '#0B0C10',
  },
  title: { 
    color: '#FFFFFF', 
    fontSize: 22, 
    fontWeight: '700', 
    marginBottom: 8 
  },
  routeWrap: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 2 
  },
  routeText: { 
    color: '#A8D8FF', 
    fontSize: 15, 
    fontWeight: '600' 
  },
  cost: { 
    color: '#00C6FF', 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 16, 
    marginTop: 10 
  },
  description: { 
    color: '#CCCCCC', 
    fontSize: 16, 
    lineHeight: 24, 
    marginBottom: 24 
  },
  timeline: { 
    marginBottom: 16, 
    marginTop: 6 
  },
  timelineRow: { 
    flexDirection: 'row', 
    alignItems: 'flex-start' 
  },
  timelineColIcon: { 
    width: 18, 
    alignItems: 'center',
    backgroundColor: '#0B0C10',
  },
  dot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: '#66CCFF', 
    marginTop: 2 
  },
  dotStart: { 
    backgroundColor: '#4ADE80' 
  },
  dotEnd: { 
    backgroundColor: '#F59E0B' 
  },
  connector: { 
    width: 2, 
    flex: 1, 
    backgroundColor: '#244657', 
    marginTop: 2, 
    marginBottom: 6 
  },
  timelineText: { 
    color: '#D6E9FF', 
    fontSize: 15, 
    marginLeft: 8, 
    marginBottom: 10,
    backgroundColor: '#0B0C10',
  },
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
    marginBottom: 10,
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold', 
    letterSpacing: 1 
  },
  simulatorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFA500',
    marginTop: 10,
  },
  simulatorNoticeText: {
    color: '#FFA500',
    fontSize: 12,
    marginLeft: 6,
    fontStyle: 'italic',
  },
});