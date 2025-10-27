// Screens/ReturnMapScreen.js
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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { DARK_MAP_STYLE } from "@/constants/mapStyles";

const { width, height } = Dimensions.get("window");

const scale = (size) => (width / 375) * size;
const vScale = (size) => (height / 812) * size;

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

// Icon per prediction
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
  if (has(["airport", "air base", "airfield", "terminal"])) return { name: "airplane", color: COLORS.cyan };
  if (has(["hospital", "clinic", "medical", "pharmacy", "doctor"])) return { name: "medkit", color: "#FF6B6B" };
  if (has(["restaurant", "food", "cafe", "bakery", "bar", "eatery"])) return { name: "restaurant", color: "#FFD166" };
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

// Airport detector
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

export default function ReturnMapScreen({ navigation, route }) {
  const mapRef = useRef(null);
  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);

  const tripType = route?.params?.tripType || "return";

  const [pickupText, setPickupText] = useState("");
  const [dropoffText, setDropoffText] = useState("");
  const [mapInteractive, setMapInteractive] = useState(true);

  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropLocation, setDropLocation] = useState(null);

  const [pickupDate, setPickupDate] = useState(new Date());
  const [pickUpTime, setpickUpTime] = useState(new Date());
  const [dropoffDate, setDropoffDate] = useState(new Date());
  const [dropoffTime, setDropoffTime] = useState(new Date());

  const [showPicker, setShowPicker] = useState({
    pickupDate: false,
    pickUpTime: false,
    dropoffDate: false,
    dropoffTime: false,
  });

  const [distance, setDistance] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isLoadingDirections, setIsLoadingDirections] = useState(false);

  const [tracksPickup, setTracksPickup] = useState(true);
  const [tracksDropoff, setTracksDropoff] = useState(true);
  const tracksTimerPickup = useRef(null);
  const tracksTimerDrop = useRef(null);

  const [pickupFocused, setPickupFocused] = useState(false);
  const [dropoffFocused, setDropoffFocused] = useState(false);
  const [activeInput, setActiveInput] = useState(null); // Track which input is active

  useEffect(() => {
    const sh = Keyboard.addListener("keyboardDidShow", () => setMapInteractive(false));
    const hd = Keyboard.addListener("keyboardDidHide", () => setMapInteractive(true));
    return () => {
      sh.remove();
      hd.remove();
      if (tracksTimerPickup.current) clearTimeout(tracksTimerPickup.current);
      if (tracksTimerDrop.current) clearTimeout(tracksTimerDrop.current);
    };
  }, []);

  // Navigation back handler
  const handleBackPress = () => {
    navigation.goBack();
  };

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
      setIsLoadingDirections(true);
      const res = await fetch(url);
      const result = await res.json();
      if (result.routes?.length) {
        const pts = result.routes[0].overview_polyline.points;
        const decoded = polyline.decode(pts).map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
        setRouteCoordinates(decoded);
        setDistance(haversine(pickupLocation, dropLocation, { unit: "km" }).toFixed(2));
        mapRef.current?.fitToCoordinates(decoded, {
          edgePadding: { top: 80, right: 50, bottom: 120, left: 50 },
          animated: true,
        });
      } else {
        Alert.alert("Error", "Could not fetch route, please try again.");
      }
    } catch {
      Alert.alert("Error", "Failed to load route data.");
    } finally {
      setIsLoadingDirections(false);
    }
  };

  useEffect(() => {
    if (pickupLocation && dropLocation) fetchRoute();
    else {
      setRouteCoordinates([]);
      setDistance(null);
    }
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

    if (selectedPickup < now) {
      Alert.alert(
        "Invalid Time",
        `Please select a pickup time at least 2 hours later than current time (${minAllowed.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}).`
      );
      return;
    }
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

    if (tripType === "return") {
      if (!dropoffDate) {
        Alert.alert("Missing Return Date", "Please select a return date.");
        return;
      }
      if (!dropoffTime) {
        Alert.alert("Missing Return Time", "Please select a return time.");
        return;
      }

      const selectedReturn = new Date(dropoffDate);
      selectedReturn.setHours(dropoffTime.getHours(), dropoffTime.getMinutes(), 0, 0);

      if (selectedReturn < selectedPickup) {
        Alert.alert("Invalid Return", "Return time cannot be before pickup time.");
        return;
      }

      // NEW: 4-hour minimum difference validation
      const timeDifference = selectedReturn.getTime() - selectedPickup.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);
      
      if (hoursDifference < 4) {
        Alert.alert(
          "Invalid Time Difference",
          "Drop-off time must be at least 4 hours after pickup time. Please adjust your times."
        );
        return;
      }

      if (dropoffDate.toDateString() === pickupDate.toDateString() && selectedReturn < minAllowed) {
        Alert.alert(
          "Invalid Return Time",
          `Please select a return time at least 2 hours later than current time (${minAllowed.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}).`
        );
        return;
      }
    }

    const params = {
      pickupLocation,
      dropLocation,
      distance,
      pickupDate: pickupDate.toDateString(),
      pickUpTime: pickUpTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      tripType,
      requireFlightNumber: !!pickupLocation?.isAirport,
    };
    if (tripType === "return") {
      params.dropoffDate = dropoffDate.toDateString();
      params.dropoffTime = dropoffTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    navigation.navigate("CarSelection", params);
  };

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

  const isContinueDisabled = !(pickupLocation && dropLocation);

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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      {/* Navigation Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        customMapStyle={DARK_MAP_STYLE}
        provider={PROVIDER_GOOGLE}
        scrollEnabled
        zoomEnabled
        rotateEnabled
        pitchEnabled
        toolbarEnabled={false}
        onTouchStart={() => {
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

      {/* scrim */}
      <LinearGradient
        pointerEvents="none"
        colors={[COLORS.scrimTopA, COLORS.scrimTopB, COLORS.scrimTopC]}
        style={styles.topScrim}
      />

      {/* Panel: let touches outside flow to the map */}
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
              query={{ key: GOOGLE_MAPS_API_KEY, language: "en", components: "country:ie"  }}
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
                  {isLoadingDirections ? <ActivityIndicator color={COLORS.gold} /> : null}
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
              onFail={(e) => console.log("Pickup places error:", e)}
              renderRow={renderSuggestionRow}
            />
          </View>

          {/* Drop-off Location */}
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
              query={{ key: GOOGLE_MAPS_API_KEY, language: "en", components: "country:ie"  }}
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
                  {isLoadingDirections ? <ActivityIndicator color={COLORS.gold} /> : null}
                  {dropoffText?.length ? (
                    <TouchableOpacity
                      onPress={clearDropoff}
                      style={styles.clearBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.muted} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
              onFail={(e) => console.log("Dropoff places error:", e)}
              renderRow={renderSuggestionRow}
            />
          </View>

          {/* Pickup Date & Time */}
          <View style={styles.sectionTitleRow}>
            <Ionicons name="arrow-forward-circle" size={16} color={COLORS.text} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Pickup Date & Time</Text>
          </View>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              onPress={() => setShowPicker((s) => ({ ...s, pickupDate: true }))}
              style={[styles.dateTimeButton, styles.boxOutline]}
            >
              <View style={styles.dateTimeInner}>
                <Ionicons name="calendar" size={18} color={COLORS.text} style={{ marginRight: 8 }} />
                <Text style={styles.dateTimeText}>{pickupDate.toDateString()}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPicker((s) => ({ ...s, pickUpTime: true }))}
              style={[styles.dateTimeButton, styles.boxOutline]}
            >
              <View style={styles.dateTimeInner}>
                <Ionicons name="time" size={18} color={COLORS.text} style={{ marginRight: 8 }} />
                <Text style={styles.dateTimeText}>
                  {pickUpTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Return Date & Time */}
          {tripType === "return" && (
            <>
              <View style={[styles.sectionTitleRow, { marginTop: 10 }]}>
                <Ionicons name="arrow-back-circle" size={16} color={COLORS.text} style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Return Date & Time</Text>
              </View>
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  onPress={() => setShowPicker((s) => ({ ...s, dropoffDate: true }))}
                  style={[styles.dateTimeButton, styles.boxOutline]}
                >
                  <View style={styles.dateTimeInner}>
                    <Ionicons name="calendar" size={18} color={COLORS.text} style={{ marginRight: 8 }} />
                    <Text style={styles.dateTimeText}>{dropoffDate.toDateString()}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowPicker((s) => ({ ...s, dropoffTime: true }))}
                  style={[styles.dateTimeButton, styles.boxOutline]}
                >
                  <View style={styles.dateTimeInner}>
                    <Ionicons name="time" size={18} color={COLORS.text} style={{ marginRight: 8 }} />
                    <Text style={styles.dateTimeText}>
                      {dropoffTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* iOS bottom-sheet pickers (readable on dark UI) */}
      {(showPicker.pickupDate || showPicker.pickUpTime || showPicker.dropoffDate || showPicker.dropoffTime) &&
        Platform.OS === "ios" && (
          <View style={styles.iosPickerContainer}>
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity onPress={() => setShowPicker({ pickupDate: false, pickUpTime: false, dropoffDate: false, dropoffTime: false })}>
                <Text style={styles.iosPickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.iosPickerTitle}>
                {showPicker.pickupDate
                  ? "Select Pickup Date"
                  : showPicker.pickUpTime
                  ? "Select Pickup Time"
                  : showPicker.dropoffDate
                  ? "Select Return Date"
                  : "Select Return Time"}
              </Text>
              <TouchableOpacity onPress={() => setShowPicker({ pickupDate: false, pickUpTime: false, dropoffDate: false, dropoffTime: false })}>
                <Text style={styles.iosPickerDone}>Done</Text>
              </TouchableOpacity>
            </View>

            {showPicker.pickupDate && (
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
            {showPicker.pickUpTime && (
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
            {tripType === "return" && showPicker.dropoffDate && (
              <DateTimePicker
                value={dropoffDate}
                mode="date"
                display="spinner"
                minimumDate={pickupDate}
                onChange={(_, d) => d && setDropoffDate(d)}
                style={styles.iosPicker}
                themeVariant="dark"
                textColor={COLORS.text}
              />
            )}
            {tripType === "return" && showPicker.dropoffTime && (
              <DateTimePicker
                value={dropoffTime}
                mode="time"
                display="spinner"
                is24Hour
                onChange={(_, t) => t && setDropoffTime(t)}
                style={styles.iosPicker}
                themeVariant="dark"
                textColor={COLORS.text}
              />
            )}
          </View>
        )}

      {/* Android native pickers */}
      {showPicker.pickupDate && Platform.OS === "android" && (
        <DateTimePicker
          value={pickupDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(e, d) => {
            setShowPicker((s) => ({ ...s, pickupDate: false }));
            if (d) setPickupDate(d);
          }}
        />
      )}
      {showPicker.pickUpTime && Platform.OS === "android" && (
        <DateTimePicker
          value={pickUpTime}
          mode="time"
          display="default"
          is24Hour
          onChange={(e, t) => {
            setShowPicker((s) => ({ ...s, pickUpTime: false }));
            if (t) setpickUpTime(t);
          }}
        />
      )}
      {tripType === "return" && showPicker.dropoffDate && Platform.OS === "android" && (
        <DateTimePicker
          value={dropoffDate}
          mode="date"
          display="default"
          minimumDate={pickupDate}
          onChange={(e, d) => {
            setShowPicker((s) => ({ ...s, dropoffDate: false }));
            if (d) setDropoffDate(d);
          }}
        />
      )}
      {tripType === "return" && showPicker.dropoffTime && Platform.OS === "android" && (
        <DateTimePicker
          value={dropoffTime}
          mode="time"
          display="default"
          is24Hour
          onChange={(e, t) => {
            setShowPicker((s) => ({ ...s, dropoffTime: false }));
            if (t) setDropoffTime(t);
          }}
        />
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
  // Back Button
  backButton: {
    position: "absolute",
    top: vScale(35),
    left: scale(20),
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    backgroundColor: COLORS.panelBg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10001,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({ android: { elevation: 12 } }),
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
  iosPickerCancel: { color: "#0a84ff", fontSize: 17 },
  iosPickerTitle: { color: COLORS.text, fontSize: 17, fontWeight: "600" },
  iosPickerDone: { color: "#0a84ff", fontSize: 17, fontWeight: "600" },
  iosPicker: { height: 200 },

  // markers
  markerWrapper: { alignItems: "center", justifyContent: "flex-end" },
  markerGlow: {
    position: "absolute",
    bottom: height * 0.015,
    width: width * 0.07,
    height: width * 0.07,
    borderRadius: width * 0.035,
  },
  markerInner: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.05,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({ android: { elevation: 8 } }),
  },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },

  // scrim
  topScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    zIndex: 1,
  },

  // panel
  inputContainer: {
    position: "absolute",
    top: height * 0.09,
    width: "92%",
    alignSelf: "center",
    zIndex: 10000,
    ...Platform.select({ android: { elevation: 10000 } }),
  },
  searchPanel: {
    backgroundColor: COLORS.panelBg,
    borderRadius: 16,
    padding: width * 0.025,
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

  // labels
  fieldLabelWrap: { marginLeft: 6, marginBottom: 6 },
  fieldLabel: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.bg,
    color: COLORS.muted,
    fontSize: width * 0.03,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // autocomplete
  autoCompleteContainer: { flex: 0 },
  activeAutoCompleteContainer: {
    zIndex: 10003,
  },
  autoCompleteTextInput: {
    height: height * 0.06,
    fontSize: width * 0.04,
    backgroundColor: COLORS.card,
    color: COLORS.text,
    borderRadius: 12,
    paddingHorizontal: width * 0.04,
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
    top: height * 0.065,
    left: 0,
    right: 0,
    backgroundColor: "#14181f",
    borderRadius: 10,
    marginTop: 6,
    maxHeight: height * 0.35,
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
  autoCompleteSeparator: { height: 1, backgroundColor: COLORS.border },

  suggestionTextBlock: { color: COLORS.text, lineHeight: 18 },
  suggestionMain: { color: COLORS.text, fontWeight: "600" },
  suggestionSecondary: { color: COLORS.muted, fontSize: width * 0.03 },

  rightSide: { flexDirection: "row", alignItems: "center", paddingRight: 8 },
  clearBtn: { marginLeft: 8 },

  // section headings
  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 6, marginLeft: 2 },
  sectionTitle: { color: COLORS.muted, fontSize: width * 0.03, letterSpacing: 0.3 },

  // date & time
  dateTimeRow: { flexDirection: "row", marginBottom: 4 },
  dateTimeButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    paddingVertical: height * 0.015,
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
  dateTimeText: { fontSize: width * 0.04, color: COLORS.text },

  // distance
  distanceBox: {
    position: "absolute",
    top: height * 0.72,
    alignSelf: "center",
    backgroundColor: COLORS.card,
    paddingVertical: height * 0.012,
    paddingHorizontal: width * 0.035,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.borderStrong,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    ...Platform.select({ android: { elevation: 6 } }),
  },
  distanceText: { fontSize: width * 0.04, fontWeight: "700", color: COLORS.text },

  // continue
  continueButton: {
    position: "absolute",
    bottom: height * 0.025,
    left: width * 0.05,
    right: width * 0.05,
    backgroundColor: COLORS.gold,
    paddingVertical: height * 0.018,
    borderRadius: 12,
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
  continueButtonText: { color: "#0f1115", fontSize: width * 0.048, fontWeight: "800" },

  boxOutline: { borderWidth: 2, borderColor: COLORS.borderStrong },
});