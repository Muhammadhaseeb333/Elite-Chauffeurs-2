// Screens/HourlyBookingMapScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { DARK_MAP_STYLE } from "@/constants/mapStyles";

const GOOGLE_MAPS_API_KEY = "AIzaSyAq5LNTt4_tSsErPFJqf82TJpBwfixOvnc";

const COLORS = {
  bg: "#0f1115",
  card: "#1c1e23",
  text: "#ffffff",
  muted: "#a9a9a9",
  border: "#23262d",
  borderStrong: "#3a3f47",
  input: "#2c2f35",
  shadow: "#000",

  gold: "#FFC857",
  cyan: "#4FC3F7",
  rim: "#0b0d10",
  route: "#39B5FF",
  panelBg: "rgba(18,22,28,0.92)",
  scrimTopA: "rgba(10,12,16,0.98)",
  scrimTopB: "rgba(10,12,16,0.65)",
  scrimTopC: "rgba(10,12,16,0.0)",
};

const initialRegion = {
  latitude: 53.3431 + 0.01, // Dublin offset
  longitude: -6.2489,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

// Icon for Places predictions (parity with MapScreen)
const pickIconForPrediction = (p) => {
  const types = (p?.types || []).map((t) => String(t).toLowerCase());
  const text = [
    p?.structured_formatting?.main_text,
    p?.structured_formatting?.secondary_text,
    p?.description,
    ...(p?.terms?.map((t) => t.value) || []),
    ...types,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const has = (needles) => needles.some((k) => text.includes(k));
  if (has(["airport", "terminal"])) return { name: "airplane", color: COLORS.cyan };
  if (has(["hospital", "clinic", "medical", "pharmacy", "doctor"])) return { name: "medkit", color: "#FF6B6B" };
  if (has(["restaurant", "food", "cafe", "bakery", "bar"])) return { name: "restaurant", color: "#FFD166" };
  if (has(["hotel", "lodging", "guest house", "motel"])) return { name: "home", color: "#A78BFA" };
  if (has(["park", "garden", "zoo"])) return { name: "leaf", color: "#81C784" };
  if (has(["school", "university", "college", "institute"])) return { name: "school", color: "#90CAF9" };
  if (has(["bank", "atm"])) return { name: "cash", color: "#26A69A" };
  if (has(["train", "railway"])) return { name: "train", color: COLORS.cyan };
  if (has(["bus", "coach stand"])) return { name: "bus", color: COLORS.cyan };
  if (has(["gas", "fuel", "petrol", "diesel"])) return { name: "flame", color: "#FFA726" };
  if (has(["police"])) return { name: "shield", color: "#64B5F6" };
  if (has(["market", "mall", "shop", "store", "supermarket"])) return { name: "bag", color: "#F48FB1" };
  return { name: "location", color: COLORS.muted };
};

// Detect airport from types or text (parity)
const isAirportPlace = (data, details) => {
  const types = (details?.types || []).map((t) => String(t).toLowerCase());
  if (types.includes("airport")) return true;

  const text = [
    details?.name,
    details?.formatted_address,
    data?.structured_formatting?.main_text,
    data?.structured_formatting?.secondary_text,
    data?.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /\b(airport|terminal|air\s?base|airfield)\b/.test(text);
};

export default function HourlyBookingMapScreen({ navigation }) {
  const autoCompleteRef = useRef(null);
  const mapRef = useRef(null);
  const sliderValueRef = useRef(4);

  const [pickupText, setPickupText] = useState("");
  const [pickupLocation, setPickupLocation] = useState(null);
  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickUpTime, setpickUpTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hours, setHours] = useState(4);
  const [manualHours, setManualHours] = useState("4");
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pickupFocused, setPickupFocused] = useState(false);
  const [activeInput, setActiveInput] = useState(null); // Track which input is active

  // Center helper
  const centerAt = (lat, lng, delta = 0.012) => {
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta },
      600
    );
  };

  const handleManualHoursChange = (text) => {
    if (text === "" || /^[2-8]$/.test(text)) {
      setManualHours(text);
      setHours(text === "" ? 0 : parseInt(text, 10));
    }
  };

  const handleManualHoursSubmit = () => {
    if (manualHours === "") {
      setManualHours(hours.toString());
      return;
    }
    const num = parseInt(manualHours, 10);
    if (num >= 2 && num <= 8) setHours(num);
    else setManualHours(hours.toString());
    setIsEditingHours(false);
  };

  const handleLocationSelect = async (data, details = null) => {
    try {
      setIsLoading(true);
      if (!data || !details?.geometry?.location) throw new Error("Invalid location data");

      const desc =
        details?.formatted_address ||
        data?.description ||
        data?.structured_formatting?.main_text ||
        "Selected Location";

      const location = {
        name: desc,
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        isAirport: isAirportPlace(data, details),
      };

      setPickupText(desc);
      autoCompleteRef.current?.setAddressText?.(desc);

      setPickupLocation(location);
      centerAt(location.latitude, location.longitude, 0.012);

      autoCompleteRef.current?.blur?.();
      Keyboard.dismiss();
      setActiveInput(null);
    } catch {
      Alert.alert("Error", "Failed to select location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearPickup = () => {
    setPickupText("");
    setPickupLocation(null);
    autoCompleteRef.current?.setAddressText?.("");
    autoCompleteRef.current?.clear?.();
    mapRef.current?.animateToRegion(initialRegion, 500);
  };

  const renderHourMarkers = () =>
    [2, 3, 4, 5, 6, 7, 8].map((h) => (
      <View key={h} style={styles.hourMarkerContainer}>
        <Text style={[styles.hourMarkerText, h === hours && styles.activeHourMarker]}>{h}</Text>
      </View>
    ));

  const onContinue = () => {
    if (!pickupLocation) {
      Alert.alert("Missing Pickup", "Please select a pickup location before continuing.");
      return;
    }
    if (!pickupDate) {
      Alert.alert("Missing Pickup Date", "Please select a pickup date.");
      return;
    }
    if (!pickUpTime) {
      Alert.alert("Missing Pickup Time", "Please select a pickup time.");
      return;
    }

    const now = new Date();
    const minAllowed = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const selectedPickup = new Date(pickupDate);
    selectedPickup.setHours(pickUpTime.getHours(), pickUpTime.getMinutes(), 0, 0);

    if (selectedPickup < minAllowed) {
      Alert.alert(
        "Invalid Time",
        `Please select a pickup time at least 2 hours later than current time (${minAllowed.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}).`
      );
      return;
    }

    if (!hours || hours < 2 || hours > 8) {
      Alert.alert("Invalid Duration", "Booking duration must be between 2 and 8 hours.");
      return;
    }

    navigation.navigate("CarSelection", {
      pickupLocation,
      pickupDate: pickupDate.toDateString(),
      pickUpTime: pickUpTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      hour: hours,
      tripType: "hourly",
      requireFlightNumber: !!pickupLocation?.isAirport,
    });
  };

  const isContinueDisabled = !pickupLocation;

  // Suggestion row with icon
  const renderSuggestionRow = (item) => {
    const { name, color } = pickIconForPrediction(item);
    const main =
      item?.structured_formatting?.main_text ||
      (item?.description ? String(item.description).split(",")[0] : "Location");
    const secondary =
      item?.structured_formatting?.secondary_text ||
      (item?.description && String(item.description).includes(",")
        ? String(item.description).split(",").slice(1).join(", ").trim()
        : "");

    return (
      <Text style={styles.suggestionTextBlock} numberOfLines={2}>
        <Text>
          <Ionicons name={name} size={16} color={color} />{" "}
        </Text>
        <Text style={styles.suggestionMain}>{main}</Text>
        {secondary ? <Text style={styles.suggestionSecondary}>{"\n"}{secondary}</Text> : null}
      </Text>
    );
  };

  // Dynamic styles based on active input
  const getAutoStyles = () => ({
    container: [styles.autoCompleteContainer, activeInput === 'pickup' && styles.activeAutoCompleteContainer],
    textInput: [styles.autoCompleteTextInput, pickupFocused && styles.textInputFocusedGold],
    listView: [styles.autoCompleteListView, activeInput === 'pickup' && styles.activeAutoCompleteListView],
    row: styles.autoCompleteRow,
    separator: styles.autoCompleteSeparator,
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        provider={PROVIDER_GOOGLE}
        customMapStyle={DARK_MAP_STYLE}
        scrollEnabled
        zoomEnabled
        rotateEnabled
        pitchEnabled
        toolbarEnabled={false}
        onMapReady={() => console.log("Map is ready")}
        onError={(error) => console.log("Map error:", error)}
        onTouchStart={() => {
          autoCompleteRef.current?.blur?.();
          setActiveInput(null);
        }}
      >
        {pickupLocation && (
          <Marker coordinate={pickupLocation} title={pickupLocation.name} pinColor={COLORS.gold} />
        )}
      </MapView>

      {/* scrim behind the panel */}
      <LinearGradient
        pointerEvents="none"
        colors={[COLORS.scrimTopA, COLORS.scrimTopB, COLORS.scrimTopC]}
        style={styles.topScrim}
      />

      {/* Panel: allow touches outside to hit the map */}
      <View style={styles.inputContainer} pointerEvents="box-none">
        <View style={styles.searchPanel} pointerEvents="auto">
          {/* Pickup Location with dynamic z-index wrapper */}
          <View style={[
            styles.autocompleteWrapper, 
            activeInput === 'pickup' && styles.activeAutocompleteWrapper
          ]}>
            <View style={styles.fieldLabelWrap}>
              <Text style={styles.fieldLabel}>Pickup</Text>
            </View>

            <GooglePlacesAutocomplete
              ref={autoCompleteRef}
              placeholder="Enter Pickup Location"
              fetchDetails
              minLength={2}
              debounce={300}
              timeout={15000}
              onPress={handleLocationSelect}
              keyboardShouldPersistTaps="always"
              query={{
                key: GOOGLE_MAPS_API_KEY,
                language: "en",
                types: "geocode",
                components: "country:ie" 
              }}
              GooglePlacesDetailsQuery={{
                fields: ["geometry", "name", "formatted_address", "types"],
              }}
              enablePoweredByContainer={false}
              currentLocation={false}
              predefinedPlaces={[]}
              textInputProps={{
                onChangeText: setPickupText,
                placeholderTextColor: COLORS.muted,
                returnKeyType: "search",
                value: pickupText,
                onFocus: () => {
                  setPickupFocused(true);
                  setActiveInput('pickup');
                },
                onBlur: () => {
                  setPickupFocused(false);
                  if (activeInput === 'pickup') setActiveInput(null);
                },
              }}
              styles={getAutoStyles()}
              listEmptyComponent={<View />}
              renderRightButton={() => (
                <View style={styles.rightSide}>
                  {isLoading ? <ActivityIndicator style={{ marginRight: 6 }} color={COLORS.gold} /> : null}
                  {pickupText?.length ? (
                    <TouchableOpacity
                      onPress={clearPickup}
                      style={styles.clearBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.muted} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
              renderRow={renderSuggestionRow}
              onFail={(e) => console.log("Hourly pickup places error:", e)}
            />
          </View>

          {/* Date & Time (inside panel) */}
          <View style={styles.dateTimeRow}>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.dateTimeButton, styles.boxOutline]}>
              <View style={styles.dateTimeInner}>
                <Ionicons name="calendar" size={18} color={COLORS.text} style={{ marginRight: 8 }} />
                <Text style={styles.dateTimeText}>{pickupDate.toDateString()}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={[styles.dateTimeButton, styles.boxOutline]}>
              <View style={styles.dateTimeInner}>
                <Ionicons name="time" size={18} color={COLORS.text} style={{ marginRight: 8 }} />
                <Text style={styles.dateTimeText}>
                  {pickUpTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* iOS-specific DateTimePicker with dark theme + Cancel/Done bar */}
      {(showDatePicker || showTimePicker) && Platform.OS === "ios" && (
        <View style={styles.iosPickerContainer}>
          <View style={styles.iosPickerHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowDatePicker(false);
                setShowTimePicker(false);
              }}
            >
              <Text style={styles.iosPickerCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.iosPickerTitle}>{showDatePicker ? "Select Date" : "Select Time"}</Text>
            <TouchableOpacity
              onPress={() => {
                setShowDatePicker(false);
                setShowTimePicker(false);
              }}
            >
              <Text style={styles.iosPickerDone}>Done</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={pickupDate}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={(_, d) => d && setPickupDate(d)}
              style={styles.iosPicker}
              themeVariant="dark"
              textColor={COLORS.text}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={pickUpTime}
              mode="time"
              display="spinner"
              is24Hour
              onChange={(_, t) => t && setpickUpTime(t)}
              style={styles.iosPicker}
              themeVariant="dark"
              textColor={COLORS.text}
            />
          )}
        </View>
      )}

      {/* Android DateTimePicker (system modal) */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={pickupDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(e, d) => {
            setShowDatePicker(false);
            if (d) setPickupDate(d);
          }}
        />
      )}
      {showTimePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={pickUpTime}
          mode="time"
          display="default"
          is24Hour
          onChange={(e, t) => {
            setShowTimePicker(false);
            if (t) setpickUpTime(t);
          }}
        />
      )}

      {/* Booking Duration */}
      <View style={[styles.hourSelectionContainer, styles.boxOutline]}>
        <Text style={styles.hourSelectionTitle}>Booking Duration</Text>
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrackBackground}>
            <LinearGradient
              colors={["#3a2e16", COLORS.gold, "#d2b278"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientTrack}
            />
          </View>
          <Slider
            style={styles.slider}
            minimumValue={2}
            maximumValue={8}
            step={1}
            value={hours}
            onValueChange={(v) => {
              sliderValueRef.current = Math.round(v);
              setManualHours(sliderValueRef.current.toString());
            }}
            onSlidingComplete={() => setHours(sliderValueRef.current)}
            minimumTrackTintColor="transparent"
            maximumTrackTintColor="transparent"
            thumbTintColor={COLORS.gold}
          />
          <View style={styles.hourMarkers}>{renderHourMarkers()}</View>
        </View>

        <View style={styles.manualInputContainer}>
          <Text style={styles.manualInputLabel}>Hours:</Text>
          <TextInput
            style={[styles.manualInput, styles.boxOutline]}
            keyboardType="numeric"
            value={isEditingHours ? manualHours : hours.toString()}
            onChangeText={handleManualHoursChange}
            onBlur={handleManualHoursSubmit}
            onFocus={() => setIsEditingHours(true)}
            maxLength={1}
            placeholderTextColor={COLORS.muted}
          />
          <Text style={styles.manualInputSuffix}>hours</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, isContinueDisabled && styles.continueButtonDisabled]}
        onPress={onContinue}
        disabled={isContinueDisabled}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  map: { 
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0b0d10',
    zIndex: 0,
  },

  // scrim
  topScrim: { position: "absolute", top: 0, left: 0, right: 0, height: 280, zIndex: 1 },

  // iOS DateTimePicker styles (match MapScreen)
  iosPickerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1c1c1e",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    zIndex: 10001,
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2c2c2e",
  },
  iosPickerCancel: { color: "#0a84ff", fontSize: 17 },
  iosPickerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "600" },
  iosPickerDone: { color: "#0a84ff", fontSize: 17, fontWeight: "600" },
  iosPicker: { height: 200 },

  // Panel container
  inputContainer: {
    position: "absolute",
    top: 50,
    width: "92%",
    alignSelf: "center",
    zIndex: 10000,
    ...Platform.select({ android: { elevation: 10000 } }),
  },
  searchPanel: {
    backgroundColor: COLORS.panelBg,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    ...Platform.select({ android: { elevation: 14 } }),
  },

  // Autocomplete wrappers with dynamic z-index
  autocompleteWrapper: {
    zIndex: 1,
  },
  activeAutocompleteWrapper: {
    zIndex: 10002, // Very high z-index when active
  },

  // Field label
  fieldLabelWrap: { marginLeft: 6, marginBottom: 6 },
  fieldLabel: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.bg,
    color: COLORS.muted,
    fontSize: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Autocomplete
  autoCompleteContainer: { flex: 0 },
  activeAutoCompleteContainer: {
    zIndex: 10003,
  },
  autoCompleteTextInput: {
    height: 50,
    fontSize: 16,
    backgroundColor: COLORS.card,
    color: COLORS.text,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({ android: { elevation: 6 } }),
  },
  textInputFocusedGold: { borderColor: COLORS.gold },
  
  // AutoComplete list view with dynamic positioning
  autoCompleteListView: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#14181f",
    borderRadius: 10,
    marginTop: 6,
    maxHeight: 260,
    zIndex: 9999,
    elevation: 30,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  activeAutoCompleteListView: {
    zIndex: 10004, // Highest z-index for active list
    elevation: 35,
  },
  autoCompleteRow: { backgroundColor: "#14181f", paddingVertical: 10, paddingHorizontal: 12 },
  autoCompleteSeparator: { height: 1, backgroundColor: "#14181f" },

  suggestionTextBlock: { color: COLORS.text, lineHeight: 18 },
  suggestionMain: { color: COLORS.text, fontWeight: "600" },
  suggestionSecondary: { color: COLORS.muted, fontSize: 12 },

  rightSide: { flexDirection: "row", alignItems: "center", paddingRight: 8 },
  clearBtn: { marginLeft: 8 },

  // Date & Time
  dateTimeRow: { flexDirection: "row", marginTop: 12 },
  dateTimeButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    ...Platform.select({ android: { elevation: 6 } }),
  },
  dateTimeInner: { flexDirection: "row", alignItems: "center" },
  dateTimeText: { fontSize: 16, color: COLORS.text },

  // Booking duration
  hourSelectionContainer: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    ...Platform.select({ android: { elevation: 14 } }),
  },
  hourSelectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 12,
  },
  sliderContainer: { marginBottom: 18, position: "relative" },
  sliderTrackBackground: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 6,
    top: 17,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#151922",
  },
  gradientTrack: { width: "100%", height: "100%" },
  slider: { width: "100%", height: 40 },
  hourMarkers: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 6,
  },
  hourMarkerContainer: { width: 24, alignItems: "center" },
  hourMarkerText: { fontSize: 13, color: COLORS.muted },
  activeHourMarker: { color: COLORS.gold, fontWeight: "700" },

  // Manual input
  manualInputContainer: { flexDirection: "row", justifyContent: "center", marginTop: 6 },
  manualInputLabel: { fontSize: 15, color: COLORS.text, marginRight: 10 },
  manualInput: {
    width: 60,
    height: 40,
    backgroundColor: COLORS.input,
    color: COLORS.text,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    borderColor: COLORS.border,
    borderWidth: 1,
    marginRight: 6,
  },
  manualInputSuffix: { fontSize: 15, color: COLORS.text, alignSelf: "center" },

  // Continue button
  continueButton: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    borderWidth: 2,
    borderColor: "#d2b278",
    ...Platform.select({ android: { elevation: 16 } }),
  },
  continueButtonDisabled: {
    backgroundColor: "#b79649",
    borderColor: "#c6a85a",
  },
  continueButtonText: { fontSize: 16, color: "#0f1115", fontWeight: "800" },

  // Reusable stronger outline
  boxOutline: {
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
  },
});