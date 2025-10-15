import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { doc, getDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import Toast from "react-native-toast-message";
import CancellationBottomSheet from "./CancellationBottomSheet";
import { useNavigation } from "@react-navigation/native";
import { STATUS_CODE } from "@/constants/status";

const PRIMARY = "#b88a44";

export default function RideData({ route }) {
  const ride = route.params || {};
  const navigation = useNavigation();

  const {
    id,
    pickupLocation,
    dropLocation,
    pickUpTime,
    pickupDate,
    dropoffDate,
    dropoffTime,
    tripType,
    hour,
    price,
    selectedCarName,
    paymentId,
    paymentDate,
    paymentMethod = "Credit Card",
    status, // 👈 passed from RideScreen
  } = ride;

  const [showCancellationModal, setShowCancellationModal] = useState(false);

  // Trip type logic
  const getTripTypeDetails = (type) => {
    switch (type?.toLowerCase()) {
      case "hourly":
        return {
          label: "HOURLY RENTAL",
          icon: "timer",
          showDropoff: false,
          showReturnDate: false,
          showHours: true,
        };
      case "return":
        return {
          label: "ROUND TRIP",
          icon: "sync",
          showDropoff: true,
          showReturnDate: true,
          showHours: false,
        };
      default:
        return {
          label: "ONE WAY",
          icon: "arrow-forward",
          showDropoff: true,
          showReturnDate: false,
          showHours: false,
        };
    }
  };

  const cfg = getTripTypeDetails(tripType);

  const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value ?? "N/A"}</Text>
    </View>
  );

  // ---- Cancel Logic ----
  const canCancelRide = () => {
    const now = new Date();
    if (!pickupDate || !pickUpTime) return false;

    const normalizedTime = pickUpTime.replace(/(am|pm)$/i, " $1").trim();
    const [time, modifier] = normalizedTime.split(/ /);
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier?.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (modifier?.toLowerCase() === "am" && hours === 12) hours = 0;

    const datePart = new Date(pickupDate).toISOString().split("T")[0];
    const pickupDateTime = new Date(
      `${datePart}T${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:00`
    );

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
          { text: "Call", onPress: () => Linking.openURL("tel:+1234567890") },
          { text: "Email", onPress: () => Linking.openURL("mailto:support@elitechauffeurs.com") },
          { text: "OK" },
        ]
      );
    }
  };

  const submitCancellation = async (reason) => {
    if (!reason || !id) {
      Alert.alert("Error", "Please provide a cancellation reason");
      return;
    }
    try {
      const rideRef = doc(db, tripType === "hourly" ? "byHourRides" : "rides", id);
      const rideDoc = await getDoc(rideRef);
      if (!rideDoc.exists()) throw new Error("Ride not found");

      const batch = writeBatch(db);
      batch.update(rideRef, {
        status: STATUS_CODE.cancelled,
        cancelledReason: reason,
        cancellationTime: serverTimestamp(),
        cancelledBy: "user",
      });
      await batch.commit();

      Toast.show({
        type: "success",
        text1: "Ride Cancelled",
        text2: "Your ride has been cancelled successfully.",
      });

      navigation.navigate("MainTabs", { screen: "Rides" });
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to cancel ride.");
    }
  };

  // ---- PDF Download ----
  const handleDownload = async () => {
    try {
      const html = `
        <html>
          <body style="font-family: Arial; padding: 20px;">
            <h1 style="color: ${PRIMARY};">Ride Receipt</h1>
            <p><strong>Trip Type:</strong> ${cfg.label}</p>
            <p><strong>Car:</strong> ${selectedCarName || "N/A"}</p>
            <p><strong>Pickup:</strong> ${pickupLocation || "N/A"}</p>
            ${cfg.showDropoff ? `<p><strong>Dropoff:</strong> ${dropLocation || "N/A"}</p>` : ""}
            <p><strong>Pickup Date & Time:</strong> ${pickupDate || "N/A"} ${pickUpTime || ""}</p>
            ${cfg.showReturnDate ? `<p><strong>Return Date & Time:</strong> ${dropoffDate || "N/A"} ${dropoffTime || ""}</p>` : ""}
            ${cfg.showHours ? `<p><strong>Duration:</strong> ${hour || 0} hour(s)</p>` : ""}
            <h3>Payment</h3>
            <p><strong>Payment ID:</strong> ${paymentId || id}</p>
            <p><strong>Method:</strong> ${paymentMethod}</p>
            <p><strong>Date:</strong> ${paymentDate || "N/A"}</p>
            <p><strong>Amount:</strong> $${price || 0}</p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const pdfName = `RideReceipt_${Date.now()}.pdf`;
      const newPath = FileSystem.documentDirectory + pdfName;

      await FileSystem.moveAsync({ from: uri, to: newPath });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newPath);
      } else {
        Alert.alert("Saved", "Receipt saved to app storage:\n" + newPath);
      }
    } catch (e) {
      Alert.alert("Error", "Could not save receipt");
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ride Data</Text>
        <TouchableOpacity onPress={handleDownload}>
          <Ionicons name="download-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Trip Type */}
        <View style={[styles.tripTypeBadge, { backgroundColor: PRIMARY }]}>
          <MaterialIcons name={cfg.icon} size={18} color="#fff" />
          <Text style={styles.tripTypeText}>{cfg.label}</Text>
        </View>

        {/* Ride Details */}
        <Text style={styles.sectionTitle}>Ride Details</Text>
        <DetailRow label="Car" value={selectedCarName} />
        <DetailRow label="Pickup" value={pickupLocation} />
        {cfg.showDropoff && <DetailRow label="Dropoff" value={dropLocation} />}
        <DetailRow label="Pickup Date & Time" value={`${pickupDate || "N/A"} ${pickUpTime || ""}`} />
        {cfg.showReturnDate && <DetailRow label="Return Date & Time" value={`${dropoffDate || "N/A"} ${dropoffTime || ""}`} />}
        {cfg.showHours && <DetailRow label="Duration" value={`${hour || 0} hour(s)`} />}

        {/* Payment Details */}
        <Text style={styles.sectionTitle}>Payment</Text>
        <DetailRow label="Payment ID" value={paymentId || id} />
        <DetailRow label="Method" value={paymentMethod} />
        <DetailRow label="Date" value={paymentDate} />
        <DetailRow label="Amount" value={`€${price || 0}`} />

        {/* Cancel Button – only for upcoming rides */}
        {(status === STATUS_CODE.pending ||
          status === STATUS_CODE.accepted ||
          status === STATUS_CODE.ongoing) && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancelPress}
            >
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <CancellationBottomSheet
        visible={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        onSubmit={submitCancellation}
        bookingTime={`${pickupDate || ""} ${pickUpTime || ""}`}
      />

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "black" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "bold" },
  scroll: { padding: 20 },
  tripTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 15,
  },
  tripTypeText: { color: "#fff", fontSize: 15, fontWeight: "700", marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: PRIMARY, marginTop: 15, marginBottom: 8 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailLabel: { color: "#b0b0b0", fontSize: 14 },
  detailValue: { color: "#fff", fontSize: 14, fontWeight: "500", maxWidth: "60%", textAlign: "right" },

  buttonContainer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  button: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 30 },
  cancelButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e74c3c" },
  cancelButtonText: { color: "#e74c3c", fontWeight: "600" },
});
