import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useStripe } from '@stripe/stripe-react-native';
import { collection, doc, setDoc, getDoc, serverTimestamp, addDoc } from "firebase/firestore";
import { db, auth } from "@/config/firebaseConfig";
import { useDiscount } from "@/Screens/DiscountContext";
import { STATUS_CODE } from "@/constants/status";

const API_URL = 'https://api-khdg5v6kxq-uc.a.run.app';

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { finalFare, receiptData } = route.params || {};
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { discountPercentage, discountType, discountCode, resetDiscount } = useDiscount();

  const [loading, setLoading] = useState(false);

  const fetchPaymentSheetParams = async () => {
    try {
      if (!finalFare || typeof finalFare !== 'number') {
        throw new Error('Invalid fare amount');
      }

      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          amount: Math.round(finalFare * 100),
          metadata: {
            userId: auth.currentUser?.uid,
            rideType: receiptData?.tripType
          }
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
      // ✅ ESSENTIAL: Return URL for iOS redirects (matches your app scheme)
      returnURL: 'indrive://stripe-redirect',
      // Optional: Add default billing details
      defaultBillingDetails: {
        name: 'Customer Name', // You can customize this later
      }
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
        headers: {
          'Content-Type': 'application/json',
        },
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
  
      // Get user details
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
  
      // Prepare ride data with payment info
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
        // These are now top-level fields
        additionalInfoFlightNo: receiptData.additionalInfoFlightNo || "",
        additionalInfoLuggage: Number(receiptData.additionalInfoLuggage) || 0,
        additionalInfoOrderNotes: receiptData.additionalInfoOrderNotes || "",
        additionalInfoPassengers: Number(receiptData.additionalInfoPassengers) || 0
      };
  
      // Save to the correct collection
      const targetCollection = receiptData.collectionType || 
                             (receiptData.tripType === 'hourly' ? 'byHourRides' : 'rides');
      
      const rideRef = await addDoc(collection(db, targetCollection), rideData);
  
      resetDiscount();
  
      navigation.navigate('ReceiptScreen', {
        ...rideData,
        id: rideRef.id, // Include the new document ID
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
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.title}>Payment Summary</Text>
        <Text style={styles.amount}>${finalFare?.toFixed(2)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#27ae60" />
      ) : (
        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          disabled={loading}
        >
          <Text style={styles.payButtonText}>Pay Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  amount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#059669',
    textAlign: 'center',
    marginTop: 10,
  },
  payButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});