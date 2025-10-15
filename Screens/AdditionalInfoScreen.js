import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useNavigation, useRoute } from "@react-navigation/native";

const PRIMARY = '#b88a44';
const guessAirportFromName = (name = "") =>
  /\b(airport|terminal)\b/i.test(String(name));

export default function AdditionalInfoScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    pickupLocation,
    dropLocation,
    pickupDate,
    pickUpTime,
    dropoffDate,
    dropoffTime,
    distance,
    selectedCar,
    fare,
    tripType,
    hour,
    // may be set by Map/Hourly/Return screens
    requireFlightNumber,
  } = route.params || {};

  // Decide airport requirement robustly
  const isAirportPickup = useMemo(() => {
    if (typeof requireFlightNumber === "boolean") return requireFlightNumber;
    if (pickupLocation?.isAirport === true) return true;
    return guessAirportFromName(pickupLocation?.name);
  }, [requireFlightNumber, pickupLocation]);

  const [additionalInfoOrderNotes, setAdditionalInfoOrderNotes] = useState("");
  const [additionalInfoFlightNo, setAdditionalInfoFlightNo] = useState("");
  const [additionalInfoPassengers, setAdditionalInfoPassengers] = useState("");
  const [additionalInfoLuggage, setAdditionalInfoLuggage] = useState("");

  const handleNumericInput = (text) => text.replace(/[^0-9]/g, "");

  const handleContinue = () => {
    if (isAirportPickup && !additionalInfoFlightNo.trim()) {
      Alert.alert(
        "Flight number required",
        "Please enter your flight number because your pickup is from an airport."
      );
      return;
    }

    navigation.navigate("RideDetailsScreen", {
      pickupLocation,
      dropLocation,
      pickupDate,
      pickUpTime,
      dropoffDate,
      dropoffTime,
      distance,
      selectedCar,
      fare,
      tripType,
      hour,
      additionalInfoFlightNo: additionalInfoFlightNo.trim(),
      additionalInfoLuggage: Number(additionalInfoLuggage) || 0,
      additionalInfoOrderNotes: additionalInfoOrderNotes || "",
      additionalInfoPassengers: Number(additionalInfoPassengers) || 0,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground
        source={require("@/assets/images/bghome.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.container}>
            <Animated.Text
              entering={FadeInUp.delay(100).duration(800)}
              style={styles.title}
            >
              {isAirportPickup
                ? "Additional Information (Flight # required)"
                : "Additional Information (Optional)"}
            </Animated.Text>

            <TextInput
              placeholder="Order Notes"
              placeholderTextColor="#ccc"
              style={styles.input}
              value={additionalInfoOrderNotes}
              onChangeText={setAdditionalInfoOrderNotes}
              multiline
            />

            <TextInput
              placeholder={
                isAirportPickup ? "Flight Number (required)" : "Flight Number"
              }
              placeholderTextColor={isAirportPickup ? "#ffd7a0" : "#ccc"}
              style={[
                styles.input,
                isAirportPickup && !additionalInfoFlightNo.trim()
                  ? { borderColor: "#b44", borderWidth: 1.2 }
                  : null,
              ]}
              value={additionalInfoFlightNo}
              onChangeText={setAdditionalInfoFlightNo}
            />

            <TextInput
              placeholder="Number of Passengers"
              placeholderTextColor="#ccc"
              style={styles.input}
              value={additionalInfoPassengers}
              onChangeText={(text) =>
                setAdditionalInfoPassengers(handleNumericInput(text))
              }
              keyboardType="numeric"
            />

            <TextInput
              placeholder="Number of Luggages"
              placeholderTextColor="#ccc"
              style={styles.input}
              value={additionalInfoLuggage}
              onChangeText={(text) =>
                setAdditionalInfoLuggage(handleNumericInput(text))
              }
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0F1115" },
  background: { flex: 1 },
  overlay: { flex: 1, backgroundColor: "rgba(15, 17, 21, 0.85)" },
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#b88a44",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    color: "#fff",
    backgroundColor: "#1c1e23",
  },
  button: {
    backgroundColor: PRIMARY,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
