// Screens/ToursScreen.js
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get("window");
const COLORS = {
  bg: '#0f1115',
  card: '#1c1e23',
  gold: '#b88a44',
  text: '#ffffff',
  muted: '#aaaaaa',
  divider: 'rgba(255,255,255,0.06)',
};

export default function ToursScreen() {
  const navigation = useNavigation();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'tours'));
        const firebaseData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTours(firebaseData);
      } catch (error) {
        console.error('Error fetching tours:', error);
        setTours([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  const Empty = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <Ionicons name="trail-sign-outline" size={26} color={COLORS.muted} />
        <Text style={styles.emptyText}>No tours available right now.</Text>
      </View>
    ),
    []
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  const renderItem = ({ item, index }) => {
    const cover =
      (Array.isArray(item.imageUrls) && item.imageUrls[0]) ||
      item.imageUrl ||
      null;

    // Compact route: first leg's "first" → last leg's "second"
    const legs = Array.isArray(item.locations) ? item.locations : [];
    const start = legs[0]?.first || '';
    const end =
      legs.length
        ? (legs[legs.length - 1]?.second || legs[legs.length - 1]?.first || '')
        : '';
    const routeSummary = start && end ? `${start} → ${end}` : (start || end || '');

    return (
      <Animated.View entering={FadeInUp.delay(80 + index * 60).duration(650)}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() =>
            navigation.navigate('TourDetailsScreen', {
              tour: { ...item, imageUrl: cover }, // normalize cover
            })
          }
        >
          {cover ? (
            <Image source={{ uri: cover }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.noImage]}>
              <Ionicons name="image-outline" size={22} color={COLORS.muted} />
              <Text style={styles.noImageText}>No image</Text>
            </View>
          )}

          <View style={styles.cardContent}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>

            {!!routeSummary && (
              <View style={styles.routeRow}>
                <Ionicons name="navigate-outline" size={16} color={COLORS.muted} style={{ marginRight: 6 }} />
                <Text style={styles.routeText} numberOfLines={1}>
                  {routeSummary}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            {/* Right-aligned “View” pill; price removed */}
            <View style={styles.actionsRow}>
              <View style={styles.viewPill}>
                <Text style={styles.viewPillText}>View</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={Empty}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  loader: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },

  // ✨ Card responsive
  card: {
    backgroundColor: COLORS.card,
    borderRadius: width * 0.045, // scale radius
    overflow: "hidden",
    marginBottom: height * 0.018, // relative spacing
    borderWidth: 1,
    borderColor: COLORS.divider,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    ...Platform.select({ android: { elevation: 3 } }),
  },

  image: {
    width: "100%",
    height: width * 0.55, // slightly taller for better look on wide screens
    resizeMode: "cover",
    backgroundColor: "#121212",
  },
  noImage: { alignItems: "center", justifyContent: "center" },
  noImageText: {
    color: COLORS.muted,
    marginTop: 6,
    fontSize: width * 0.03, // responsive font
  },

  cardContent: { padding: width * 0.035 },
  title: {
    color: COLORS.text,
    fontSize: width * 0.046, // was 18 → now scales
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  routeRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  routeText: {
    color: "#c7d2fe",
    fontSize: width * 0.035, // was 14
    flexShrink: 1,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: height * 0.015,
  },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },

  viewPill: {
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.008,
    borderRadius: 12,
    backgroundColor: "rgba(184,138,68,0.15)",
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  viewPillText: {
    color: COLORS.gold,
    fontSize: width * 0.032,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  emptyWrap: { paddingTop: height * 0.08, alignItems: "center" },
  emptyText: {
    color: COLORS.muted,
    marginTop: 8,
    fontSize: width * 0.035,
    textAlign: "center",
  },
});
