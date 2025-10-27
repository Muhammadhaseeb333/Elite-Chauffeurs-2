// payment.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStripe } from '@stripe/stripe-react-native';
import { collection, doc, setDoc, getDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { db, auth } from "@/config/firebaseConfig";
import { useDiscount } from "@/Screens/DiscountContext";
import { STATUS_CODE } from "@/constants/status";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const API_URL = 'https://api-khdg5v6kxq-uc.a.run.app';

// ✅ Use your local asset for the screen background
const BG = require('assets/images/bghome.png'); // change to a relative path if needed

const COLORS = {
  gold: '#C89B4B',          // button/amount/heading color
  white: '#FFFFFF',
  card: '#1E1F24',          // dark summary card
  overlay: 'rgba(0,0,0,0.6)',
};

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { finalFare, receiptData } = route.params || {};
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { resetDiscount } = useDiscount();

  const [loading, setLoading] = useState(false);

  // Navigation back handler
  const handleBackPress = () => {
    navigation.goBack();
  };

  const fetchPaymentSheetParams = async () => {
    try {
      if (!finalFare || typeof finalFare !== 'number') {
        throw new Error('Invalid fare amount');
      }

      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(finalFare * 100),
          metadata: { userId: auth.currentUser?.uid, rideType: receiptData?.tripType }
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Payment failed');
      return data;
    } catch (error) {
      Alert.alert('Payment Error', error.message);
      return null;
    }
  };

  const initializePaymentSheet = async () => {
    const result = await fetchPaymentSheetParams();
    if (!result) return null;

    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: result.clientSecret,
      merchantDisplayName: 'Elite Chauffeurs',
      allowsDelayedPaymentMethods: false,
      returnURL: 'indrive://stripe-redirect',
      defaultBillingDetails: { name: 'Customer Name' },
    });

    if (error) {
      Alert.alert('Setup Failed', 'Could not initialize payment');
      return null;
    }
    return result.paymentIntentId;
  };

  const verifyPayment = async (paymentIntentId) => {
    try {
      const response = await fetch(`${API_URL}/acknowledge-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Verification failed');
      return data.success === true;
    } catch (error) {
      Alert.alert('Verification Failed', error.message);
      return false;
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');
      if (!finalFare) throw new Error('Invalid fare');

      const paymentIntentId = await initializePaymentSheet();
      if (!paymentIntentId) return;

      const { error } = await presentPaymentSheet();
      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert('Payment Failed', error.message || 'Payment error');
        }
        return;
      }

      const success = await verifyPayment(paymentIntentId);
      if (!success) return;

      // Pull customer profile
      const userDocRef = doc(db, "customers", auth.currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      let customerName = "Unknown";
      let customerEmail = auth.currentUser.email || "Unknown";
      let customerPhone = "Unknown";

      if (userSnap.exists()) {
        const userData = userSnap.data();
        customerName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
        customerEmail = userData.email || customerEmail;
        customerPhone = userData.phone || customerPhone;
      }

      // Prepare Firestore payload
      const rideData = {
        ...receiptData,
        cost: finalFare,
        paymentId: paymentIntentId,
        status: STATUS_CODE.pending,
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        customerName,
        customerEmail,
        customerPhone,
        date: receiptData.pickupDate,
        time: receiptData.pickUpTime,
        price: finalFare,
        originalPrice: receiptData.originalPrice || finalFare,
        discountApplied: receiptData.discountApplied || 0,
        discountType: receiptData.discountType || null,
        discountCode: receiptData.discountCode || null,
        driverAssigned: false,
        vehicleDetails: receiptData.car || null,
        pickupLocation: receiptData.pickupLocation || 'Not specified',
        dropoffLocation: receiptData.dropoffLocation || 'Not specified',
        tripType: receiptData.tripType || 'transfer',
        companyId: "",
        additionalInfoFlightNo: receiptData.additionalInfoFlightNo || "",
        additionalInfoLuggage: Number(receiptData.additionalInfoLuggage) || 0,
        additionalInfoOrderNotes: receiptData.additionalInfoOrderNotes || "",
        additionalInfoPassengers: Number(receiptData.additionalInfoPassengers) || 0
      };

      const targetCollection =
        receiptData.collectionType ||
        (receiptData.tripType === 'hourly' ? 'byHourRides' : 'rides');

      const rideRef = await addDoc(collection(db, targetCollection), rideData);

      resetDiscount();

      navigation.navigate('ReceiptScreen', {
        ...rideData,
        id: rideRef.id,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'Credit Card',
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Payment failed');
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={BG} style={styles.bg} imageStyle={styles.bgImage}>
        {/* dark overlay for readability */}
        <View style={styles.overlay} />

        {/* Header with Back Button */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.gold} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Top heading */}
          <Text style={styles.heading}>Just last step to book your ride</Text>

          {/* Summary card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Summary</Text>
            <Text style={styles.amount}>
              €{(Number(finalFare) || 0).toFixed(2)}
            </Text>
          </View>

          {/* Pay Now */}
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.gold} />
          ) : (
            <TouchableOpacity style={styles.payBtn} onPress={handlePayment} activeOpacity={0.9}>
              <Text style={styles.payText}>Pay Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1 },
  bgImage: { resizeMode: 'cover' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: "800",
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 40,
  },
  heading: {
    textAlign: 'left',
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gold,
    marginTop: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  cardTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  amount: {
    color: COLORS.gold,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  payBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  payText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
});