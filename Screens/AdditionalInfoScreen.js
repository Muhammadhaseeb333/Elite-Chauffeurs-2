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
import { Ionicons } from "@expo/vector-icons";

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

  // Navigation back handler
  const handleBackPress = () => {
    navigation.goBack();
  };

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

  // Get vehicle capacity from selected car
  const maxPassengers = selectedCar?.passengers || 4;
  const maxLuggage = selectedCar?.luggage || 2;

  // Validation states
  const [passengersError, setPassengersError] = useState("");
  const [luggageError, setLuggageError] = useState("");

  const handleNumericInput = (text) => text.replace(/[^0-9]/g, "");

  const validatePassengers = (value) => {
    const numValue = Number(value);
    if (value === "") {
      setPassengersError("");
      return true;
    }
    if (numValue > maxPassengers) {
      setPassengersError(`Maximum ${maxPassengers} passengers for ${selectedCar?.name}`);
      return false;
    }
    if (numValue < 1) {
      setPassengersError("At least 1 passenger required");
      return false;
    }
    setPassengersError("");
    return true;
  };

  const validateLuggage = (value) => {
    const numValue = Number(value);
    if (value === "") {
      setLuggageError("");
      return true;
    }
    if (numValue > maxLuggage) {
      setLuggageError(`Maximum ${maxLuggage} luggage for ${selectedCar?.name}`);
      return false;
    }
    if (numValue < 0) {
      setLuggageError("Luggage count cannot be negative");
      return false;
    }
    setLuggageError("");
    return true;
  };

  const handlePassengersChange = (text) => {
    const numericText = handleNumericInput(text);
    setAdditionalInfoPassengers(numericText);
    validatePassengers(numericText);
  };

  const handleLuggageChange = (text) => {
    const numericText = handleNumericInput(text);
    setAdditionalInfoLuggage(numericText);
    validateLuggage(numericText);
  };

  const handleContinue = () => {
    if (isAirportPickup && !additionalInfoFlightNo.trim()) {
      Alert.alert(
        "Flight number required",
        "Please enter your flight number because your pickup is from an airport."
      );
      return;
    }

    // Validate passengers and luggage before continuing
    const isPassengersValid = validatePassengers(additionalInfoPassengers);
    const isLuggageValid = validateLuggage(additionalInfoLuggage);

    if (!isPassengersValid || !isLuggageValid) {
      Alert.alert(
        "Invalid Input",
        "Please check the passenger and luggage counts. They exceed the vehicle capacity."
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

  // Check if inputs are valid for styling
  const isPassengersInvalid = passengersError !== "";
  const isLuggageInvalid = luggageError !== "";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground
        source={require("@/assets/images/bghome.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Header with Back Button */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {/* Back Button */}
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBackPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={24} color="#b88a44" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {isAirportPickup
                  ? "Additional Information (Flight # required)"
                  : "Additional Information (Optional)"}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.container}>
            {/* Vehicle Capacity Info */}
            <View style={styles.capacityInfo}>
              <Ionicons name="car-sport" size={20} color="#b88a44" />
              <Text style={styles.capacityText}>
                {selectedCar?.name} - Max: {maxPassengers} passengers, {maxLuggage} luggage
              </Text>
            </View>

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

            {/* Passengers Input */}
            <View>
              <TextInput
                placeholder={`Number of Passengers (max ${maxPassengers})`}
                placeholderTextColor="#ccc"
                style={[
                  styles.input,
                  isPassengersInvalid && styles.inputError
                ]}
                value={additionalInfoPassengers}
                onChangeText={handlePassengersChange}
                keyboardType="numeric"
              />
              {passengersError ? (
                <Text style={styles.errorText}>{passengersError}</Text>
              ) : (
                <Text style={styles.hintText}>
                  Optional - Leave empty if you don't know yet
                </Text>
              )}
            </View>

            {/* Luggage Input */}
            <View>
              <TextInput
                placeholder={`Number of Luggages (max ${maxLuggage})`}
                placeholderTextColor="#ccc"
                style={[
                  styles.input,
                  isLuggageInvalid && styles.inputError
                ]}
                value={additionalInfoLuggage}
                onChangeText={handleLuggageChange}
                keyboardType="numeric"
              />
              {luggageError ? (
                <Text style={styles.errorText}>{luggageError}</Text>
              ) : (
                <Text style={styles.hintText}>
                  Optional - Leave empty if you don't know yet
                </Text>
              )}
            </View>

            <TouchableOpacity 
              style={[
                styles.button, 
                (isPassengersInvalid || isLuggageInvalid) && styles.buttonDisabled
              ]} 
              onPress={handleContinue}
              disabled={isPassengersInvalid || isLuggageInvalid}
            >
              <Text style={styles.buttonText}>
                {(isPassengersInvalid || isLuggageInvalid) ? "Fix Input Errors" : "Continue"}
              </Text>
            </TouchableOpacity>

            {/* Optional Note */}
            <Text style={styles.optionalNote}>
              💡 All fields except Flight Number (for airport pickups) are optional. 
              You can skip them if you're not sure.
            </Text>
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
  
  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
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
    color: "#b88a44",
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },

  container: {
    padding: 16,
    paddingBottom: 80,
  },
  
  // Vehicle Capacity Info
  capacityInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(184, 138, 68, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(184, 138, 68, 0.3)",
  },
  capacityText: {
    color: "#b88a44",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  input: {
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    color: "#fff",
    backgroundColor: "#1c1e23",
    fontSize: 16,
  },
  
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 1.5,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },

  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: "500",
  },

  hintText: {
    color: "#888",
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
    fontStyle: "italic",
  },

  button: {
    backgroundColor: PRIMARY,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    backgroundColor: "#666",
    opacity: 0.7,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  optionalNote: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 16,
    fontStyle: "italic",
  },
});