import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, db } from "@/config/firebaseConfig";
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

const { width } = Dimensions.get("window");
const PRIMARY = '#b88a44';

const scale = (size) => (width / 375) * size; // 🔑 Responsive scaling

const RidesScreen = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [rides, setRides] = useState({ upcoming: [], past: [], cancelled: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        const unsubscribe = fetchRides();
        return () => unsubscribe && unsubscribe();
      } else {
        setRides({ upcoming: [], past: [], cancelled: [] });
        setLoading(false);
        setRefreshing(false);
      }
    });
    return unsubscribeAuth;
  }, []);

  const fetchRides = () => {
    if (!auth.currentUser) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    setRefreshing(true);
    const userId = auth.currentUser.uid;

    const ridesQuery = query(
      collection(db, 'rides'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const hourlyRidesQuery = query(
      collection(db, 'byHourRides'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    let ridesData = [];
    let hourlyData = [];

    const handleSnapshot = (snapshot, type) => {
      return snapshot.docs.map(doc => {
        const data = doc.data() || {};
        const finalDrop = data.dropLocation ?? data.dropoffLocation ?? null;
        return {
          id: doc.id,
          collectionType: type,
          ...data,
          dropLocation: finalDrop,
          dropoffLocation: finalDrop,
          _sortTimestamp: data.createdAt?.seconds || 0,
        };
      });
    };

    const unsubscribeRides = onSnapshot(ridesQuery, (snap) => {
      ridesData = handleSnapshot(snap, 'rides');
      mergeAndSet();
    });

    const unsubscribeHourly = onSnapshot(hourlyRidesQuery, (snap) => {
      hourlyData = handleSnapshot(snap, 'byHourRides');
      mergeAndSet();
    });

    const mergeAndSet = () => {
      const allRides = [...ridesData, ...hourlyData].sort(
        (a, b) => b._sortTimestamp - a._sortTimestamp
      );

      const categorized = {
        upcoming: allRides.filter(r => r.status === 0 || r.status === 3 || r.status === 4),
        past: allRides.filter(r => r.status === 1),
        cancelled: allRides.filter(r => r.status === 2),
      };

      setRides(categorized);
      setLoading(false);
      setRefreshing(false);
    };

    return () => {
      unsubscribeRides();
      unsubscribeHourly();
    };
  };

  const renderRideCard = ({ item }) => {
    const statusStyles = {
      0: { label: 'pending',   backgroundColor: PRIMARY },
      1: { label: 'completed', backgroundColor: '#3b82f6' },
      2: { label: 'cancelled', backgroundColor: '#ef4444' },
      3: { label: 'confirmed', backgroundColor: '#22c55e' },
      4: { label: 'ongoing',   backgroundColor: '#22c55e' },
    };
    const status = statusStyles[item.status] || { label: 'unknown', backgroundColor: 'gray' };

    const finalDrop = item.dropLocation ?? item.dropoffLocation ?? 'Unknown Dropoff';
    const isHourly =
      item.collectionType === 'byHourRides' ||
      (typeof item.tripType === 'string' && item.tripType.toLowerCase() === 'hourly');

    // 🔑 Normalize rideType
    let rideType = "Transfer";
    if (isHourly) rideType = "By Hour";
    else if (item.tripType && item.tripType.toLowerCase() === "round trip") rideType = "Round Trip";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('RideData', {
            ...item,
            dropLocation: finalDrop,
            dropoffLocation: finalDrop,
          })
        }
        
      >
        <Text style={styles.location}>📍 {item.pickupLocation || 'Unknown Pickup'}</Text>
        {isHourly ? (
          <Text style={styles.location}>
            ⏰ {item.hour ? `${item.hour} hour${Number(item.hour) > 1 ? 's' : ''}` : 'By Hour'}
          </Text>
        ) : (
          <Text style={styles.location}>🏁 {finalDrop}</Text>
        )}

        <View style={styles.row}>
          <Text style={styles.meta}>📅 {item.pickupDate || 'No date'}</Text>
          <Text style={styles.meta}>⏰ {item.pickUpTime || 'No time'}</Text>
        </View>

        {/* Status + Ride Type + Price */}
        <View style={[styles.row, { marginTop: scale(8) }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6) }}>
            <View style={[styles.status, { backgroundColor: status.backgroundColor }]}>
              <Text style={styles.statusText}>{status.label}</Text>
            </View>
            {/* Ride Type Badge */}
            <View style={styles.rideTypeBadge}>
              <Text style={styles.statusText}>{rideType}</Text>
            </View>
          </View>
          <Text style={styles.price}>€{Number(item.price || 0).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrapper}>
      <View style={styles.emptyIconCircle}>
        <MaterialIcons name="directions-car" size={scale(28)} color="#facc15" />
      </View>
      <Text style={styles.emptyHeadline}>
        {selectedTab === 'upcoming'
          ? 'No upcoming rides'
          : selectedTab === 'past'
          ? 'No past rides'
          : 'No canceled rides'}
      </Text>
      <Text style={styles.emptySubtext}>
        You don't have any {selectedTab} rides. We aim to provide reliable service every time.
      </Text>
      <TouchableOpacity
        style={styles.bookRideButton}
        onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
      >
        <Text style={styles.bookRideButtonText}>Book Your Ride</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Rides</Text>

      <View style={styles.tabs}>
        {['upcoming', 'past', 'cancelled'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.selectedTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={selectedTab === tab ? styles.selectedTabText : styles.tabText}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={rides[selectedTab]}
          renderItem={renderRideCard}
          keyExtractor={item => `${item.collectionType}-${item.id}-${item._sortTimestamp}`}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchRides} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', paddingTop: scale(40) },
  header: {
    fontSize: scale(22),
    fontWeight: 'bold',
    color: PRIMARY,
    textAlign: 'center',
    marginBottom: scale(16),
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(12),
    marginBottom: scale(16),
  },
  tab: {
    paddingHorizontal: scale(18),
    paddingVertical: scale(8),
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
  },
  selectedTab: { backgroundColor: PRIMARY },
  tabText: { color: 'white', fontWeight: '600', fontSize: scale(13) },
  selectedTabText: { color: '#fff', fontWeight: '700', fontSize: scale(13) },
  card: {
    backgroundColor: '#1f1f1f',
    marginHorizontal: scale(12),
    marginVertical: scale(6),
    padding: scale(12),
    borderRadius: 16,
  },
  location: { fontSize: scale(13), color: 'white', marginBottom: scale(4) },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { color: '#d1d5db', fontSize: scale(12) },
  status: { paddingVertical: scale(4), paddingHorizontal: scale(10), borderRadius: 16 },
  statusText: { fontSize: scale(11), fontWeight: 'bold', color: 'white', textTransform: 'lowercase' },
  rideTypeBadge: {
    paddingVertical: scale(4),
    paddingHorizontal: scale(10),
    borderRadius: 16,
    backgroundColor: '#6b7280',
  },
  price: {
    backgroundColor: 'black',
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: 16,
    color: "yellow",
    fontWeight: 'bold',
    fontSize: scale(14),
    overflow: 'hidden',
  },
  listContent: { paddingBottom: scale(80) },
  loader: { marginTop: scale(40) },
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(24),
    paddingTop: scale(40),
  },
  emptyIconCircle: {
    backgroundColor: '#1f1f1f',
    borderRadius: 100,
    padding: scale(20),
    marginBottom: scale(20),
  },
  emptyHeadline: { fontSize: scale(16), fontWeight: 'bold', color: PRIMARY, marginBottom: scale(8) },
  emptySubtext: { fontSize: scale(12), color: '#d1d5db', textAlign: 'center', marginBottom: scale(16) },
  bookRideButton: { backgroundColor: PRIMARY, paddingVertical: scale(10), paddingHorizontal: scale(24), borderRadius: 24 },
  bookRideButtonText: { color: 'black', fontWeight: 'bold', fontSize: scale(14) },
});

export default RidesScreen;
