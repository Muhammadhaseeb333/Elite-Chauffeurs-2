import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useDiscount } from "@/Screens/DiscountContext";
import { auth } from '@/config/firebaseConfig';
import { serverTimestamp } from 'firebase/firestore';
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 380;
const PRIMARY = '#b88a44';

const scaleFont = (size) => Math.round(size * (width / 375)); // base iPhone 11 width
const scalePadding = (size) => Math.round(size * (width / 375));

const COLORS = {
  bg: "#0f1115",
  card: "#1c1e23",
  gold: "#b88a44",
  text: "#ffffff",
  muted: "#a9a9a9",
  border: "#23262d",
  danger: "#ef4444",
  success: "#22c55e",
  brand1: "#2a2d36",
  brand2: "#2f3340",
};

export default function RideDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const {
    discountPercentage,
    discountType,
    discountCode,
    applyDiscount,
    resetDiscount,
    isDiscountValid,
  } = useDiscount();

  const [initialLoad, setInitialLoad] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      return;
    }
    if (!isDiscountValid?.()) {
      resetDiscount();
    }
  }, [route.params?.fare]);

  // Normalize params: accept either key, use dropLocation internally
  const {
    pickupLocation = {},
    dropLocation: dropFromNew,
    dropoffLocation: dropFromLegacy,
    pickUpTime = "N/A",
    pickupDate = "N/A",
    dropoffTime = "N/A",
    dropoffDate = "N/A",
    selectedCar,
    fare = 0,
    distance = 0,
    tripType = "transfer",
    hour = 0,
    additionalInfoFlightNo = "",
    additionalInfoLuggage = 0,
    additionalInfoOrderNotes = "",
    additionalInfoPassengers = 0,
  } = route.params || {};

  const dropLocation = dropFromNew ?? dropFromLegacy ?? null;

  const isHourlyBooking = hour > 0;
  const isReturnTrip = tripType === "return";
  const currentTripType = isHourlyBooking ? "hourly" : isReturnTrip ? "return" : "transfer";

  const tripTypeConfig = {
    transfer: { label: "ONE WAY", color: COLORS.brand1, icon: "arrow-forward" },
    return:   { label: "ROUND TRIP", color: COLORS.brand2, icon: "sync" },
    hourly:   { label: "HOURLY", color: COLORS.success, icon: "timer" },
  };

  if (!selectedCar) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={styles.errorCard}>
          <MaterialIcons name="error-outline" size={60} color={COLORS.danger} />
          <Text style={styles.errorText}>No ride details available</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatLocation = (location) => {
    if (!location) return "Not specified";
    if (typeof location === "string") return location;
    if (location?.name) return location.name;
    if (location?.latitude && location?.longitude) {
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
    return "Location not specified";
  };

  const validFare = typeof fare === "number" && !isNaN(fare) ? fare : 0;
  const calculatedDiscountAmount = isDiscountValid?.() ? (validFare * (discountPercentage || 0)) / 100 : 0;
  const finalFare = (validFare - calculatedDiscountAmount).toFixed(2);

  const handleConfirmRide = async () => {
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!selectedCar) throw new Error("No car selected");

      const rideData = {
        userId: user?.uid || null,
        pickupLocation: formatLocation(pickupLocation),

        // keep canonical + legacy alias for downstream/UI compatibility
        dropLocation: formatLocation(dropLocation),        // ✅ canonical
        dropoffLocation: formatLocation(dropLocation),     // ✅ legacy alias

        pickupDate,
        pickUpTime,
        dropoffDate,
        dropoffTime,
        distance,
        car: selectedCar,
        price: parseFloat(finalFare),
        originalPrice: validFare,
        discountApplied: discountPercentage || 0,
        discountType: discountType || null,
        discountCode: discountCode || null,
        discountAmount: calculatedDiscountAmount,
        tripType: currentTripType,
        hour: isHourlyBooking ? hour : null,
        additionalInfoFlightNo: additionalInfoFlightNo || "",
        additionalInfoLuggage: Number(additionalInfoLuggage) || 0,
        additionalInfoOrderNotes: additionalInfoOrderNotes || "",
        additionalInfoPassengers: Number(additionalInfoPassengers) || 0,
        totalKm: Number(distance) || 0,
        status: 0,
        createdAt: serverTimestamp(),
      };

      if (user?.isAnonymous) {
        navigation.navigate("GuestContactScreen", {
          finalFare: parseFloat(finalFare),
          receiptData: rideData,
        });
        return;
      }

      navigation.navigate("Payment", {
        finalFare: parseFloat(finalFare),
        receiptData: {
          ...rideData,
          selectedCarName: selectedCar.name,
          collectionType: isHourlyBooking ? "byHourRides" : "rides",
        },
      });
    } catch (error) {
      console.error("Error confirming ride:", error);
      Alert.alert("Error", error?.message || "Failed to confirm ride");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top','left','right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ride Summary</Text>
          <View style={[styles.badge, { backgroundColor: tripTypeConfig[currentTripType].color }]}>
            <MaterialIcons name={tripTypeConfig[currentTripType].icon} size={18} color="#fff" />
            <Text style={styles.badgeText}>{tripTypeConfig[currentTripType].label}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Vehicle */}
          <View style={styles.card}>
            <View style={styles.imageWrap}>
              <Image source={selectedCar.image} style={styles.image} resizeMode="contain" />
            </View>
            <Text style={styles.carName}>{selectedCar.name}</Text>
            <View style={styles.specRow}>
              <View style={styles.pill}>
                <MaterialIcons name="people" size={16} color={COLORS.gold} />
                <Text style={styles.pillText}>{selectedCar.passengers} passengers</Text>
              </View>
              <View style={[styles.pill, { marginLeft: 10 }]}>
                <MaterialIcons name="work" size={16} color={COLORS.gold} />
                <Text style={styles.pillText}>{selectedCar.luggage} luggage</Text>
              </View>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="attach-money" size={20} color={COLORS.gold} />
              <Text style={styles.cardTitle}>Pricing Breakdown</Text>
            </View>
            <View style={styles.divider} />
            <Row label="Base Fare:" value={`€${validFare.toFixed(2)}`} />
            {(discountPercentage || 0) > 0 && (
              <>
                <Row
                  label={`Discount (${discountPercentage}%):`}
                  value={`-€${calculatedDiscountAmount.toFixed(2)}`}
                  valueStyle={{ color: COLORS.danger }}
                />
                <View style={styles.discountInfo}>
                  <MaterialCommunityIcons
                    name={discountType === "voucher" ? "ticket-confirmation" : "ticket-percent"}
                    size={16}
                    color={COLORS.gold}
                  />
                  <Text style={styles.discountInfoText}>
                    Applied {discountType === "voucher" ? "Voucher" : "Promo Code"}: {discountCode}
                  </Text>
                </View>
              </>
            )}
            <View style={styles.totalWrap}>
              <Row
                label="Total Amount:"
                value={`€${finalFare}`}
                labelStyle={{ color: COLORS.text, fontWeight: "700" }}
                valueStyle={{ color: COLORS.gold, fontWeight: "800", fontSize: 18 }}
              />
            </View>
          </View>

          {/* Trip Details — show only relevant rows per ride type */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="directions-car" size={20} color={COLORS.gold} />
              <Text style={styles.cardTitle}>Trip Details</Text>
            </View>
            <View style={styles.divider} />

            {/* Always show pickup */}
            <Detail icon="location-on" text={`Pickup: ${formatLocation(pickupLocation)}`} />

            {/* Show drop-off only for transfer & return */}
            {!isHourlyBooking && (
              <Detail icon="location-off" text={`Dropoff: ${formatLocation(dropLocation)}`} />
            )}

            {/* Pickup date/time always */}
            <Detail icon="date-range" text={`Pickup Date/Time: ${pickupDate} ${pickUpTime}`} />

            {/* Return date/time only for return trips */}
            {isReturnTrip && (
              <Detail icon="date-range" text={`Return Date/Time: ${dropoffDate} ${dropoffTime}`} />
            )}

            {/* Hours only for hourly bookings */}
            {isHourlyBooking && (
              <Detail icon="timer" text={`Hours: ${hour}`} />
            )}

            {/* Shared info across all ride types */}
            <Detail icon="notes" text={`Notes: ${additionalInfoOrderNotes || "None"}`} />
            <Detail icon="flight" text={`Flight: ${additionalInfoFlightNo || "None"}`} />
            <Detail icon="people" text={`Passengers: ${additionalInfoPassengers || 0}`} />
            <Detail icon="work" text={`Luggages: ${additionalInfoLuggage || 0}`} />
          </View>

          {/* Actions */}
          <View style={{ marginTop: 6 }}>
            <View style={styles.rowSplit}>
              <TouchableOpacity
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: discountType === "voucher" ? COLORS.brand2 : COLORS.brand1 },
                ]}
                onPress={() => navigation.navigate("PromotionsScreen", { fare: validFare })}
              >
                <MaterialIcons name="local-offer" size={18} color="#fff" />
                <Text style={styles.secondaryBtnText}>
                  {(discountPercentage || 0) > 0 && discountType === "voucher" ? "Change Voucher" : "Apply Voucher"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: discountType === "promo" ? COLORS.brand2 : COLORS.brand1 },
                ]}
                onPress={() => navigation.navigate("PromoCodeScreen", { fare: validFare })}
              >
                <MaterialCommunityIcons name="ticket-percent" size={18} color="#fff" />
                <Text style={styles.secondaryBtnText}>
                  {(discountPercentage || 0) > 0 && discountType === "promo" ? "Change Promo" : "Apply Promo"}
                </Text>
              </TouchableOpacity>
            </View>

            {(discountPercentage || 0) > 0 && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => {
                  resetDiscount();
                  Alert.alert("Discount Removed", "Your discount has been removed");
                }}
              >
                <MaterialIcons name="close" size={18} color="#fff" />
                <Text style={styles.removeBtnText}>Remove Discount</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmRide} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.confirmBtnText}>Confirm Ride</Text>
                  <MaterialIcons name="arrow-forward" size={22} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, labelStyle, valueStyle }) {
  return (
    <View style={rowStyles.row}>
      <Text style={[rowStyles.label, labelStyle]}>{label}</Text>
      <Text style={[rowStyles.value, valueStyle]}>{value}</Text>
    </View>
  );
}

function Detail({ icon, text }) {
  return (
    <View style={detailStyles.row}>
      <MaterialIcons name={icon} size={18} color={COLORS.muted} />
      <Text style={detailStyles.text}>{text}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screen: { 
    flex: 1, 
    backgroundColor: COLORS.bg,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scalePadding(16),
    paddingVertical: scalePadding(12),
    backgroundColor: COLORS.bg,
  },
  headerTitle: {
    color: COLORS.gold,
    fontSize: scaleFont(20),
    fontWeight: "800",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scalePadding(10),
    paddingVertical: scalePadding(5),
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "700",
    fontSize: scaleFont(12),
  },

  scroll: { 
    paddingHorizontal: scalePadding(14), 
    paddingBottom: 30,
    paddingTop: scalePadding(8),
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: scalePadding(14),
    marginBottom: scalePadding(12),
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageWrap: {
    backgroundColor: "#11141a",
    borderRadius: 10,
    padding: scalePadding(8),
    marginBottom: scalePadding(8),
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: height * 0.22, // scales with screen height
    resizeMode: "contain",
  },
  carName: {
    color: COLORS.text,
    fontSize: scaleFont(18),
    fontWeight: "800",
    textAlign: "center",
    marginTop: 6,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#242730",
    borderRadius: 12,
    paddingHorizontal: scalePadding(8),
    paddingVertical: scalePadding(5),
  },
  pillText: {
    color: COLORS.text,
    marginLeft: 6,
    fontWeight: "600",
    fontSize: scaleFont(12),
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scalePadding(6),
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: scaleFont(15),
    fontWeight: "700",
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: scalePadding(10),
  },
  discountInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171a22",
    borderRadius: 8,
    padding: scalePadding(6),
    marginTop: 4,
    marginBottom: 8,
  },
  discountInfoText: { color: COLORS.gold, marginLeft: 6, fontSize: scaleFont(12) },
  totalWrap: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, marginTop: 8 },

  rowSplit: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  secondaryBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: scalePadding(12),
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  secondaryBtnText: { color: "#fff", marginLeft: 6, fontWeight: "700", fontSize: scaleFont(13) },

  removeBtn: {
    backgroundColor: COLORS.danger,
    paddingVertical: scalePadding(12),
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  removeBtnText: { color: "#fff", fontWeight: "700", marginLeft: 6, fontSize: scaleFont(13) },

  confirmBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: scalePadding(14),
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#fff",
    fontWeight: "800",
    marginRight: 8,
    fontSize: scaleFont(15),
  },

  // error display
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorCard: {
    backgroundColor: COLORS.card,
    padding: scalePadding(20),
    borderRadius: 14,
    width: "88%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorText: {
    color: COLORS.text,
    fontSize: scaleFont(16),
    fontWeight: "700",
    marginVertical: 12,
    textAlign: "center",
  },
  primaryBtn: {
    backgroundColor: COLORS.gold,
    paddingVertical: scalePadding(10),
    borderRadius: 12,
    paddingHorizontal: 18,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: scaleFont(14) },
});

export const rowStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 6 },
  label: { color: COLORS.muted, fontSize: scaleFont(13) },
  value: { color: COLORS.text, fontSize: scaleFont(13), fontWeight: "600" },
});

export const detailStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  text: { marginLeft: 8, color: COLORS.text, fontSize: scaleFont(13), flexShrink: 1 },
});
