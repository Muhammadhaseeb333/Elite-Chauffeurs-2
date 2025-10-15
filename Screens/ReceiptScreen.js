import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, ScrollView,
  BackHandler, Alert, Linking, ImageBackground, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { db } from '@/config/firebaseConfig';
import { doc, serverTimestamp, getDoc, writeBatch } from 'firebase/firestore';
import CancellationBottomSheet from './CancellationBottomSheet';
import Toast from 'react-native-toast-message';
import { STATUS_CODE } from '@/constants/status';

export default function ReceiptScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  // Accept both top-level params and nested receiptData (from Payment)
  const rd = route.params?.receiptData || {};
  const {
    paymentId,
    cost,
    paymentDate,
    paymentMethod = 'Credit Card',
    selectedCarName,
    pickupLocation,
    dropLocation,
    pickUpTime,
    pickupDate,
    dropoffTime,
    dropoffDate,
    tripType,
    hour,
    baseFare,
    discount,
    totalFare,
    id: initialRideId,

    // extras (may also live inside receiptData)
    additionalInfoOrderNotes,
    additionalInfoFlightNo,
    additionalInfoPassengers,
    additionalInfoLuggage,
  } = { ...route.params, ...rd };

  const [rideId] = useState(initialRideId || route.params?.id || rd?.id || null);
  const [animation] = useState(new Animated.Value(0));
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, []);

  const handleBackPress = () => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs', params: { screen: 'Home' } }] })
    );
    return true;
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 0.85, duration: 500, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const canCancelRide = () => {
    const now = new Date();
    if (!pickupDate || !pickUpTime) return false;
    const normalizedTime = pickUpTime.replace(/(am|pm)$/i, ' $1').trim();
    const [time, modifier] = normalizedTime.split(/ /);
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier?.toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (modifier?.toLowerCase() === 'am' && hours === 12) hours = 0;
    const datePart = new Date(pickupDate).toISOString().split('T')[0];
    const pickupDateTime = new Date(`${datePart}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
    return (pickupDateTime - now) / (1000 * 60 * 60) > 12;
  };

  const handleCancelPress = () => {
    if (canCancelRide()) {
      setShowCancellationModal(true);
    } else {
      Alert.alert(
        "Cannot Cancel Ride",
        "Rides can only be cancelled at least 12 hours before the scheduled time. Please contact Elite Chauffeurs for assistance.",
        [
          { text: "Call", onPress: () => Linking.openURL('tel:+1234567890') },
          { text: "Email", onPress: () => Linking.openURL('mailto:support@elitechauffeurs.com') },
          { text: "OK" }
        ]
      );
    }
  };

  const submitCancellation = async (reason) => {
    if (!reason || !rideId) {
      Alert.alert("Error", "Please provide a cancellation reason");
      return;
    }
    try {
      const rideRef = doc(db, tripType === 'hourly' ? 'byHourRides' : 'rides', rideId);
      const rideDoc = await getDoc(rideRef);
      if (!rideDoc.exists()) throw new Error("Ride not found");
      const batch = writeBatch(db);
      batch.update(rideRef, {
        status: STATUS_CODE.cancelled,
        cancelledReason: reason,
        cancellationTime: serverTimestamp(),
        cancelledBy: 'user'
      });
      await batch.commit();
      Toast.show({ type: 'success', text1: 'Ride Cancelled', text2: 'Your ride has been cancelled successfully.' });
      navigation.navigate('MainTabs', { screen: 'Rides' });
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to cancel ride.");
    }
  };

  const getTripTypeDetails = (type) => {
    switch (type) {
      case 'hourly':
        return { label: 'HOURLY RENTAL', icon: 'timer', color: '#b88a44', showDropoff: false, showReturnDate: false, showHours: true };
      case 'return':
        return { label: 'ROUND TRIP', icon: 'sync', color: '#b88a44', showDropoff: true, showReturnDate: true, showHours: false };
      default:
        return { label: 'ONE WAY', icon: 'arrow-forward', color: '#b88a44', showDropoff: true, showReturnDate: false, showHours: false };
    }
  };

  const cfg = getTripTypeDetails(tripType);

  const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value ?? 'N/A'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ImageBackground source={require("@/assets/images/bghome.png")} style={styles.background} resizeMode="cover">
        <ScrollView contentContainerStyle={styles.overlay}>

          {/* Success Animation */}
          <Animated.View style={[styles.successHeader, { transform: [{ scale: animation }] }]}>
            <MaterialIcons name="check-circle" size={80} color="#b88a44" />
            <Text style={styles.confirmationText}>Payment Successful</Text>
            <Text style={styles.confirmationSubtext}>Your booking is confirmed</Text>
          </Animated.View>

          {/* Receipt Card */}
          <View style={styles.receiptCard}>
            <View style={[styles.tripTypeBadge, { backgroundColor: cfg.color }]}>
              <MaterialIcons name={cfg.icon} size={18} color="#fff" />
              <Text style={styles.tripTypeText}>{cfg.label}</Text>
            </View>

            {/* Payment */}
            <Text style={styles.sectionTitle}>Payment Details</Text>
            <DetailRow label="Payment ID" value={paymentId || rideId} />
            <DetailRow label="Method" value={paymentMethod} />
            <DetailRow label="Date" value={formatDate(paymentDate)} />
            <DetailRow label="Amount" value={`$${totalFare || cost}`} />

            {/* Trip Details - ONLY relevant rows */}
            <Text style={styles.sectionTitle}>Ride Details</Text>
            <DetailRow label="Car" value={selectedCarName || "N/A"} />
            <DetailRow label="Pickup" value={pickupLocation} />
            {cfg.showDropoff && <DetailRow label="Dropoff" value={dropLocation} />}
            <DetailRow label="Pickup Date & Time" value={`${pickupDate || 'N/A'} ${pickUpTime || ''}`} />
            {cfg.showReturnDate && (
              <DetailRow label="Return Date & Time" value={`${dropoffDate || 'N/A'} ${dropoffTime || ''}`} />
            )}
            {cfg.showHours && <DetailRow label="Duration" value={`${hour || 0} hour(s)`} />}

            {/* Shared extra info */}
            <DetailRow label="Notes" value={additionalInfoOrderNotes || 'None'} />
            <DetailRow label="Flight" value={additionalInfoFlightNo || 'None'} />
            <DetailRow label="Passengers" value={`${additionalInfoPassengers ?? 0}`} />
            <DetailRow label="Luggages" value={`${additionalInfoLuggage ?? 0}`} />

            {/* Fare breakdown summary (optional; keep if you like) */}
            {baseFare != null && <DetailRow label="Base Fare" value={`$${baseFare}`} />}
            {discount != null && Number(discount) > 0 && <DetailRow label="Discount" value={`-$${discount}`} />}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelPress}>
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleBackPress}>
              <Text style={styles.primaryButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <CancellationBottomSheet
            visible={showCancellationModal}
            onClose={() => setShowCancellationModal(false)}
            onSubmit={submitCancellation}
            bookingTime={`${pickupDate || ''} ${pickUpTime || ''}`}
          />

          <Toast />
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F1115" },
  background: { flex: 1 },
  overlay: { padding: 20, backgroundColor: "rgba(15, 17, 21, 0.88)", flexGrow: 1 },
  successHeader: { alignItems: 'center', marginBottom: 25 },
  confirmationText: { fontSize: 26, fontWeight: '700', color: '#fff', marginTop: 10 },
  confirmationSubtext: { fontSize: 15, color: 'rgba(255,255,255,0.8)' },
  receiptCard: { backgroundColor: '#1c1e23', borderRadius: 18, padding: 20, marginBottom: 20 },
  tripTypeBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, alignSelf: 'center', marginBottom: 15 },
  tripTypeText: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#b88a44', marginTop: 15, marginBottom: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { color: '#b0b0b0', fontSize: 14 },
  detailValue: { color: '#fff', fontSize: 14, fontWeight: '500', textAlign: 'right', maxWidth: '60%' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 },
  button: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 30 },
  primaryButton: { backgroundColor: '#b88a44' },
  primaryButtonText: { color: '#fff', fontWeight: '600' },
  cancelButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e74c3c' },
  cancelButtonText: { color: '#e74c3c', fontWeight: '600' }
});
