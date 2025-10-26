import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import haversine from "haversine";
import polyline from "@mapbox/polyline";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { DARK_MAP_STYLE } from "@/constants/mapStyles";

const { width, height } = Dimensions.get("window");

const scale = (size) => (width / 375) * size;
const vScale = (size) => (height / 812) * size;

const GOOGLE_MAPS_API_KEY = "AIzaSyAq5LNTt4_tSsErPFJqf82TJpBwfixOvnc";
const PRIMARY = "#b88a44";

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
  glowGold: "rgba(255,200,87,0.35)",
  glowCyan: "rgba(79,195,247,0.35)",
  route: "#39B5FF",
  scrimTopA: "rgba(10,12,16,0.98)",
  scrimTopB: "rgba(10,12,16,0.65)",
  scrimTopC: "rgba(10,12,16,0.0)",
  panelBg: "rgba(18,22,28,0.92)",
};

const initialRegion = {
  latitude: 53.3431 + 0.01,
  longitude: -6.2489,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

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

  return /\b(airport|terminal)\b/.test(text);
};

export default function MapScreen() {
  const navigation = useNavigation();
  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);
  const mapRef = useRef(null);

  const [pickupText, setPickupText] = useState("");
  const [dropoffText, setDropoffText] = useState("");

  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setDropLocation] = useState(null);

  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickUpTime, setpickUpTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [distance, setDistance] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  const [tracksPickup, setTracksPickup] = useState(true);
  const [tracksDropoff, setTracksDropoff] = useState(true);
  const tracksTimerPickup = useRef(null);
  const tracksTimerDrop = useRef(null);

  const [pickupFocused, setPickupFocused] = useState(false);
  const [dropoffFocused, setDropoffFocused] = useState(false);
  const [activeInput, setActiveInput] = useState(null); // Track which input is active

  // Add state to track map loading and errors
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    AsyncStorage.removeItem("claimedDiscount").catch(console.error);
  }, []);

  // Center helper
  const centerAt = (lat, lng, delta = 0.01) => {
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta },
      600
    );
  };

  const fetchRoute = async () => {
    if (!pickupLocation || !dropLocation) return;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${pickupLocation.latitude},${pickupLocation.longitude}&destination=${dropLocation.latitude},${dropLocation.longitude}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`;
    try {
      const response = await fetch(url);
      const result = await response.json();
      if (result.routes.length) {
        const points = result.routes[0].overview_polyline.points;
        const decodedPoints = polyline.decode(points).map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
        setRouteCoordinates(decodedPoints);
        setDistance(haversine(pickupLocation, dropLocation, { unit: "km" }).toFixed(2));
        mapRef.current?.fitToCoordinates(decodedPoints, {
          edgePadding: { top: 80, right: 50, bottom: 120, left: 50 },
          animated: true,
        });
      } else {
        Alert.alert("Error", "Could not fetch route, please try again.");
      }
    } catch {
      Alert.alert("Error", "Failed to load route data.");
    }
  };

  useEffect(() => {
    if (pickupLocation && dropLocation) fetchRoute();
  }, [pickupLocation, dropLocation]);

  const onPickupSelect = (data, details) => {
    if (!details?.geometry?.location) return;

    const desc =
      details?.formatted_address || data?.description || data?.structured_formatting?.main_text || "Pickup";

    setPickupText(desc);
    pickupRef.current?.setAddressText?.(desc);

    const loc = {
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
      name: desc,
      isAirport: isAirportPlace(data, details),
    };
    setPickupLocation(loc);

    setTracksPickup(true);
    if (tracksTimerPickup.current) clearTimeout(tracksTimerPickup.current);
    tracksTimerPickup.current = setTimeout(() => setTracksPickup(false), 1200);

    centerAt(loc.latitude, loc.longitude, 0.012);
    pickupRef.current?.blur?.();
    Keyboard.dismiss();
    setActiveInput(null);
    setTimeout(() => dropoffRef.current?.focus?.(), 120);
  };

  const onDropoffSelect = (data, details) => {
    if (!details?.geometry?.location) return;
    const desc =
      details?.formatted_address || data?.description || data?.structured_formatting?.main_text || "Drop-off";
    setDropoffText(desc);
    dropoffRef.current?.setAddressText?.(desc);

    const loc = {
      latitude: details.geometry.location.lat,
      longitude: details.geometry.location.lng,
      name: desc,
    };
    setDropLocation(loc);

    setTracksDropoff(true);
    if (tracksTimerDrop.current) clearTimeout(tracksTimerDrop.current);
    tracksTimerDrop.current = setTimeout(() => setTracksDropoff(false), 1200);

    centerAt(loc.latitude, loc.longitude, 0.012);
    dropoffRef.current?.blur?.();
    Keyboard.dismiss();
    setActiveInput(null);
  };

  const handleContinue = () => {
    if (!pickupLocation) {
      Alert.alert("Missing Pickup", "Please select a pickup location before continuing.");
      return;
    }
    if (!dropLocation) {
      Alert.alert("Missing Drop-off", "Please select a drop-off location before continuing.");
      return;
    }
    if (!pickupDate) {
      Alert.alert("Missing Date", "Please select a pickup date before continuing.");
      return;
    }
    if (!pickUpTime) {
      Alert.alert("Missing Time", "Please select a pickup time before continuing.");
      return;
    }

    // 🔒 Time validation (now + 2 hours)
    const now = new Date();
    const minAllowed = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const selected = new Date(pickupDate);
    selected.setHours(pickUpTime.getHours(), pickUpTime.getMinutes(), 0, 0);

    if (selected < minAllowed) {
      Alert.alert(
        "Invalid Time",
        `Please select a pickup time at least 2 hours later than current time (${minAllowed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}).`
      );
      return;
    }

    navigation.navigate("CarSelection", {
      pickupLocation,
      dropLocation,
      dropoffLocation: dropLocation,
      distance,
      pickupDate: pickupDate.toDateString(),
      pickUpTime: pickUpTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      requireFlightNumber: !!pickupLocation?.isAirport,
    });
  };

  const isContinueDisabled = !(pickupLocation && dropLocation);

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

  const clearPickup = () => {
    setPickupText("");
    setPickupLocation(null);
    setRouteCoordinates([]);
    setDistance(null);
    pickupRef.current?.setAddressText?.("");
    pickupRef.current?.clear?.();
    mapRef.current?.animateToRegion(initialRegion, 500);
  };
  const clearDropoff = () => {
    setDropoffText("");
    setDropLocation(null);
    setRouteCoordinates([]);
    setDistance(null);
    dropoffRef.current?.setAddressText?.("");
    dropoffRef.current?.clear?.();
    if (pickupLocation) centerAt(pickupLocation.latitude, pickupLocation.longitude, 0.02);
    else mapRef.current?.animateToRegion(initialRegion, 500);
  };

  // Dynamic styles based on active input
  const getPickupAutoStyles = () => ({
    container: [styles.autoCompleteContainer, activeInput === 'pickup' && styles.activeAutoCompleteContainer],
    textInput: [styles.autoCompleteTextInput, pickupFocused && styles.textInputFocusedGold],
    listView: [styles.autoCompleteListView, activeInput === 'pickup' && styles.activeAutoCompleteListView],
    row: styles.autoCompleteRow,
    separator: styles.autoCompleteSeparator,
  });

  const getDropoffAutoStyles = () => ({
    container: [styles.autoCompleteContainer, activeInput === 'dropoff' && styles.activeAutoCompleteContainer],
    textInput: [styles.autoCompleteTextInput, dropoffFocused && styles.textInputFocusedCyan],
    listView: [styles.autoCompleteListView, activeInput === 'dropoff' && styles.activeAutoCompleteListView],
    row: styles.autoCompleteRow,
    separator: styles.autoCompleteSeparator,
  });

  // iOS-specific date/time picker handling
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setPickupDate(selectedDate);
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selectedTime) {
      const now = new Date();
      const minAllowed = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const selected = new Date(pickupDate);
      selected.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

      if (selected < minAllowed) {
        Alert.alert(
          "Invalid Time",
          `Please select a pickup time at least 2 hours later than current time (${minAllowed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}).`
        );
        return;
      }

      setpickUpTime(selectedTime);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      {/* Add a dark overlay that disappears when map is ready */}
      {!isMapReady && !mapError && (
        <View style={styles.mapOverlay}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.loadingText}>Loading Map...</Text>
        </View>
      )}
      
      {/* Map Error Fallback */}
      {mapError ? (
        <View style={styles.mapFallback}>
          <Ionicons name="map-outline" size={64} color={COLORS.muted} />
          <Text style={styles.mapErrorText}>Map unavailable</Text>
          <Text style={styles.mapErrorSubtext}>Please check your connection</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setMapError(false);
              setIsMapReady(false);
              setTimeout(() => {
                if (mapRef.current) {
                  mapRef.current.animateToRegion(initialRegion, 1000);
                }
              }, 500);
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          customMapStyle={DARK_MAP_STYLE}
          provider={PROVIDER_GOOGLE}
          scrollEnabled={true}
          zoomEnabled={true}
          rotateEnabled={true}
          pitchEnabled={true}
          toolbarEnabled={false}
          loadingEnabled={true}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          showsBuildings={true}
          showsTraffic={false}
          showsIndoors={false}
          loadingIndicatorColor={COLORS.gold}
          loadingBackgroundColor={COLORS.bg}
          onMapLoaded={() => setIsMapReady(true)}
          onMapReady={() => {
            setIsMapReady(true);
            setTimeout(() => {
              if (mapRef.current) {
                mapRef.current.animateToRegion(initialRegion, 1000);
              }
            }, 500);
          }}
          onError={(error) => {
            console.log('Map error:', error);
            setMapError(true);
          }}
          onPress={() => {
            Keyboard.dismiss();
            pickupRef.current?.blur?.();
            dropoffRef.current?.blur?.();
            setActiveInput(null);
          }}
        >
          {pickupLocation && (
            <Marker
              coordinate={pickupLocation}
              title={pickupLocation.name}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={tracksPickup}
              zIndex={9999}
            >
              <View style={styles.markerWrapper}>
                <View style={[styles.markerGlow, { backgroundColor: COLORS.glowGold }]} />
                <View style={[styles.markerInner, { backgroundColor: COLORS.gold, borderColor: COLORS.rim }]}>
                  <Ionicons name="car" size={22} color={COLORS.rim} />
                </View>
                <View style={[styles.markerTail, { borderTopColor: COLORS.gold }]} />
              </View>
            </Marker>
          )}
          {dropLocation && (
            <Marker
              coordinate={dropLocation}
              title={dropLocation.name}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={tracksDropoff}
              zIndex={9998}
            >
              <View style={styles.markerWrapper}>
                <View style={[styles.markerGlow, { backgroundColor: COLORS.glowCyan }]} />
                <View style={[styles.markerInner, { backgroundColor: COLORS.cyan, borderColor: COLORS.rim }]}>
                  <Ionicons name="flag" size={20} color={COLORS.rim} />
                </View>
                <View style={[styles.markerTail, { borderTopColor: COLORS.cyan }]} />
              </View>
            </Marker>
          )}
          {routeCoordinates.length > 0 && (
            <Polyline coordinates={routeCoordinates} strokeColor={COLORS.route} strokeWidth={5} />
          )}
        </MapView>
      )}

      {/* scrim behind the whole panel */}
      <LinearGradient pointerEvents="none" colors={[COLORS.scrimTopA, COLORS.scrimTopB, COLORS.scrimTopC]} style={styles.topScrim} />

      {/* Panel with fields + date/time */}
      <View style={styles.inputContainer} pointerEvents="box-none">
        <View style={styles.searchPanel} pointerEvents="auto">
          {/* Pickup Location */}
          <View style={[
            styles.autocompleteWrapper, 
            activeInput === 'pickup' && styles.activeAutocompleteWrapper
          ]}>
            <View style={styles.fieldLabelWrap}>
              <Text style={styles.fieldLabel}>Pickup</Text>
            </View>
            <GooglePlacesAutocomplete
              ref={pickupRef}
              placeholder="Enter Pickup Location"
              fetchDetails
              minLength={2}
              debounce={250}
              timeout={15000}
              onPress={onPickupSelect}
              keyboardShouldPersistTaps="always"
              query={{ key: GOOGLE_MAPS_API_KEY, language: "en", components: "country:ie" }}
              GooglePlacesDetailsQuery={{ fields: ["geometry", "name", "formatted_address", "types"] }}
              predefinedPlaces={[]}
              textInputProps={{
                onChangeText: setPickupText,
                onFocus: () => {
                  setPickupFocused(true);
                  setActiveInput('pickup');
                },
                onBlur: () => {
                  setPickupFocused(false);
                  if (activeInput === 'pickup') setActiveInput(null);
                },
                returnKeyType: "search",
                placeholderTextColor: COLORS.muted,
                value: pickupText,
              }}
              styles={getPickupAutoStyles()}
              enablePoweredByContainer={false}
              listEmptyComponent={<View />}
              renderRightButton={() => (
                <View style={styles.rightSide}>
                  {pickupText?.length ? (
                    <TouchableOpacity onPress={clearPickup} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={20} color={COLORS.muted} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
              onFail={(e) => console.log("Pickup places error:", e)}
              renderRow={renderSuggestionRow}
            />
          </View>

          {/* Dropoff Location */}
          <View style={[
            styles.autocompleteWrapper, 
            activeInput === 'dropoff' && styles.activeAutocompleteWrapper
          ]}>
            <View style={[styles.fieldLabelWrap, { marginTop: 12 }]}>
              <Text style={styles.fieldLabel}>Drop-off</Text>
            </View>
            <GooglePlacesAutocomplete
              ref={dropoffRef}
              placeholder="Enter Drop-off Location"
              fetchDetails
              minLength={2}
              debounce={250}
              timeout={15000}
              onPress={onDropoffSelect}
              keyboardShouldPersistTaps="always"
              query={{ key: GOOGLE_MAPS_API_KEY, language: "en", components: "country:ie" }}
              GooglePlacesDetailsQuery={{ fields: ["geometry", "name", "formatted_address"] }}
              predefinedPlaces={[]}
              textInputProps={{
                onChangeText: setDropoffText,
                onFocus: () => {
                  setDropoffFocused(true);
                  setActiveInput('dropoff');
                },
                onBlur: () => {
                  setDropoffFocused(false);
                  if (activeInput === 'dropoff') setActiveInput(null);
                },
                returnKeyType: "search",
                placeholderTextColor: COLORS.muted,
                value: dropoffText,
              }}
              styles={getDropoffAutoStyles()}
              enablePoweredByContainer={false}
              listEmptyComponent={<View />}
              renderRightButton={() => (
                <View style={styles.rightSide}>
                  {dropoffText?.length ? (
                    <TouchableOpacity onPress={clearDropoff} style={styles.clearBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={20} color={COLORS.muted} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
              onFail={(e) => console.log("Dropoff places error:", e)}
              renderRow={renderSuggestionRow}
            />
          </View>

          {/* Date & Time */}
          <View style={styles.dateTimeRow}>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.dateTimeButton, styles.boxOutline]}>
              <View style={styles.dateTimeInner}>
                <Ionicons name="calendar" size={scale(16)} color={COLORS.text} style={{ marginRight: 8 }} />
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

      {/* iOS-specific DateTimePicker handling */}
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
              onChange={onDateChange}
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
              onChange={onTimeChange}
              style={styles.iosPicker}
              themeVariant="dark"
              textColor={COLORS.text}
            />
          )}
        </View>
      )}

      {/* Android DateTimePicker (appears as modal) */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker value={pickupDate} mode="date" display="default" minimumDate={new Date()} onChange={onDateChange} />
      )}
      {showTimePicker && Platform.OS === "android" && (
        <DateTimePicker value={pickUpTime} mode="time" display="default" is24Hour onChange={onTimeChange} />
      )}

      {distance && (
        <View style={styles.distanceBox}>
          <Text style={styles.distanceText}>Distance: {distance} km</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.continueButton, isContinueDisabled && styles.continueButtonDisabled]}
        onPress={handleContinue}
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
  // Map loading overlay
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0b0d10',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 10,
    fontSize: 16,
  },
  // Map error fallback
  mapFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 998,
  },
  mapErrorText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  mapErrorSubtext: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 8,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retryText: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '600',
  },

  // iOS DateTimePicker styles
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
  iosPickerCancel: {
    color: "#0a84ff",
    fontSize: 17,
  },
  iosPickerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "600",
  },
  iosPickerDone: {
    color: "#0a84ff",
    fontSize: 17,
    fontWeight: "600",
  },
  iosPicker: {
    height: 200,
  },

  // markers
  markerWrapper: { alignItems: "center", justifyContent: "flex-end" },
  markerGlow: { position: "absolute", bottom: vScale(12), width: scale(28), height: scale(28), borderRadius: scale(14) },
  markerInner: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.rim,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({ android: { elevation: 8 } }),
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: scale(6),
    borderRightWidth: scale(6),
    borderTopWidth: scale(8),
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },

  // scrim
  topScrim: { position: "absolute", top: 0, left: 0, right: 0, height: vScale(280), zIndex: 1 },

  // inputs panel
  inputContainer: {
    position: "absolute",
    top: vScale(50),
    width: "92%",
    alignSelf: "center",
    zIndex: 10000,
    ...Platform.select({ android: { elevation: 10000 } }),
  },
  searchPanel: {
    backgroundColor: COLORS.panelBg,
    borderRadius: scale(16),
    padding: scale(10),
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

  fieldLabelWrap: { marginLeft: scale(6), marginBottom: scale(6) },
  fieldLabel: {
    alignSelf: "flex-start",
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    backgroundColor: COLORS.bg,
    color: COLORS.muted,
    fontSize: scale(12),
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  autoCompleteContainer: { flex: 0 },
  activeAutoCompleteContainer: {
    zIndex: 10003,
  },
  autoCompleteTextInput: {
    height: vScale(50),
    fontSize: scale(16),
    backgroundColor: COLORS.card,
    color: COLORS.text,
    borderRadius: scale(12),
    paddingHorizontal: scale(15),
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({ android: { elevation: 6 } }),
  },
  textInputFocusedGold: { borderColor: COLORS.gold },
  textInputFocusedCyan: { borderColor: COLORS.cyan },
  
  // AutoComplete list view with dynamic positioning
  autoCompleteListView: {
    position: "absolute",
    top: vScale(52),
    left: 0,
    right: 0,
    backgroundColor: "#14181f",
    borderRadius: scale(10),
    marginTop: vScale(6),
    maxHeight: vScale(260),
    zIndex: 9999,
    elevation: 30,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 30,
      },
    }),
  },
  activeAutoCompleteListView: {
    zIndex: 10004, // Highest z-index for active list
    elevation: 35,
  },
  autoCompleteRow: { backgroundColor: "#14181f", paddingVertical: vScale(10), paddingHorizontal: scale(12) },
  autoCompleteSeparator: { height: 1, backgroundColor: COLORS.border },

  suggestionTextBlock: { color: COLORS.text, lineHeight: vScale(18) },
  suggestionMain: { color: COLORS.text, fontWeight: "600" },
  suggestionSecondary: { color: COLORS.muted, fontSize: scale(12) },

  rightSide: { flexDirection: "row", alignItems: "center", paddingRight: scale(8) },
  clearBtn: { marginLeft: scale(8) },

  // date & time inside panel
  dateTimeRow: { flexDirection: "row", marginTop: vScale(12) },
  dateTimeButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    paddingVertical: vScale(12),
    borderRadius: scale(12),
    marginHorizontal: scale(5),
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
  dateTimeInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "nowrap",
  },
  dateTimeText: {
    fontSize: scale(15),
    color: COLORS.text,
    flexShrink: 1,
    maxWidth: width * 0.35,
  },

  // distance box
  distanceBox: {
    position: "absolute",
    top: height * 0.71,
    alignSelf: "center",
    backgroundColor: COLORS.card,
    paddingVertical: vScale(10),
    paddingHorizontal: scale(14),
    borderRadius: scale(10),
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({ android: { elevation: 6 } }),
  },
  distanceText: { fontSize: scale(16), fontWeight: "700", color: COLORS.text },

  // continue
  continueButton: {
    position: "absolute",
    bottom: vScale(20),
    left: scale(20),
    right: scale(20),
    backgroundColor: PRIMARY,
    paddingVertical: vScale(15),
    borderRadius: scale(12),
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#d2b278",
  },
  continueButtonDisabled: { backgroundColor: "#b79649", borderColor: "#c6a85a" },
  continueButtonText: { color: "#0f1115", fontSize: scale(18), fontWeight: "800" },

  boxOutline: { borderWidth: 2, borderColor: COLORS.borderStrong },
});