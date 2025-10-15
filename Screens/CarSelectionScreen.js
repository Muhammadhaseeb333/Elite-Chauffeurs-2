// Screens/CarSelectionScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const ITEM_WIDTH = width * 0.46;
const PRIMARY = '#b88a44';

/** ===== Brand colors ===== */
const COLORS = {
  bg: "#0B1220",
  surface: "#101826",
  card: "#151F2E",
  text: "#E9EEF5",
  muted: "#ACB7C6",
  line: "#273244",
  accent: "#C8A14E",
  imageWell: "#F3F5F7",
};

/** ===== Vehicle data ===== */
const hardcodedCars = [
  {
    id: "1",
    name: "E-Class",
    image: require("../assets/images/E-class.jpg"),
    passengers: 3,
    luggage: 2,
    fixedFare: 105,
    perKmRate: 1.7,
    hourlyRate: 90,
  },
  {
    id: "2",
    name: "S-Class",
    image: require("../assets/images/S-class.jpg"),
    passengers: 3,
    luggage: 4,
    fixedFare: 125,
    perKmRate: 1.9,
    hourlyRate: 105,
  },
  {
    id: "3",
    name: "Business Van",
    image: require("../assets/images/Business-minivan.jpg"),
    passengers: 6,
    luggage: 6,
    fixedFare: 125,
    perKmRate: 2.0,
    hourlyRate: 105,
  },
  {
    id: "4",
    name: "Sprinter",
    image: require("../assets/images/Sprinter.jpg"),
    passengers: 16,
    luggage: 3,
    fixedFare: 240,
    perKmRate: 2.5,
    hourlyRate: 140,
  },
];

export default function CarSelectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    pickupLocation,
    dropLocation,
    distance = 0,
    pickupDate,
    pickUpTime,
    dropoffDate,
    dropoffTime,
    tripType = "transfer", // 👈 can be "transfer", "return", or "hourly"
    hour = 0,
  } = route.params || {};

  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [fare, setFare] = useState(0);

  const scaleAnim = useState(new Animated.Value(1))[0];
  const liftAnim = useState(new Animated.Value(0))[0];

  const formatFare = (v) => (Number(v) || 0).toFixed(2);

  useEffect(() => {
    setCars(hardcodedCars);
    if (hardcodedCars.length > 0) {
      selectCar(hardcodedCars[0]);
    }
  }, []);

  const calculateFare = (car) => {
    const fixed = Number(car.fixedFare) || 0;
    const perKm = Number(car.perKmRate) || 0;

    let oneWayFare = 0;

    if (hour > 0) {
      oneWayFare = (Number(car.hourlyRate) || 0) * hour;
    } else if (distance <= 20) {
      oneWayFare = fixed;
    } else {
      oneWayFare = fixed + (distance - 20) * perKm;
    }

    // 🚨 If round trip, double it
    if (tripType === "return") {
      return oneWayFare * 2;
    }
    return oneWayFare;
  };

  const selectCar = (car) => {
    if (!car) return;
    setSelectedCar(car);
    setFare(calculateFare(car));

    // Tiny feedback animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.06,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(liftAnim, {
        toValue: -8,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(liftAnim, {
        toValue: 0,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = () => {
    if (!selectedCar) return;
    navigation.navigate("AdditionalInfoScreen", {
      pickupLocation,
      dropLocation,
      pickupDate,
      pickUpTime,
      dropoffDate,
      dropoffTime,
      distance,
      selectedCar,
      fare: fare || 0,
      tripType,
      hour,
    });
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedCar?.id === item.id;
    const calc = calculateFare(item);

    return (
      <TouchableOpacity
        onPress={() => selectCar(item)}
        activeOpacity={0.9}
        style={[styles.card, isSelected && styles.cardSelected]}
      >
        <View style={styles.cardImageWell}>
          <Image source={item.image} style={styles.cardImage} />
        </View>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardPrice}>
          €{isSelected ? formatFare(fare) : formatFare(calc)}
        </Text>
        {hour > 0 && !isSelected && (
          <Text style={styles.cardSub}>€{item.hourlyRate}/hour</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.screenTitle}>
              {tripType === "return"
                ? "Select Return Vehicle"
                : "Select Your Vehicle"}
            </Text>
            <Ionicons
              name="car-outline"
              size={width * 0.06}
              color={COLORS.accent}
            />
          </View>

          {/* Selected preview */}
          {selectedCar && (
            <Animated.View
              style={[styles.preview, { transform: [{ translateY: liftAnim }] }]}
            >
              <View style={styles.previewImageWell}>
                <Animated.Image
                  source={selectedCar.image}
                  style={[
                    styles.previewImage,
                    { transform: [{ scale: scaleAnim }] },
                  ]}
                />
              </View>

              <View style={styles.previewRow}>
                <View style={styles.badge}>
                  <Ionicons
                    name="people-outline"
                    size={width * 0.04}
                    color={COLORS.accent}
                  />
                  <Text style={styles.badgeText}>
                    Max {selectedCar.passengers}
                  </Text>
                </View>
                <View style={[styles.badge, { marginLeft: 10 }]}>
                  <Ionicons
                    name="briefcase-outline"
                    size={width * 0.04}
                    color={COLORS.accent}
                  />
                  <Text style={styles.badgeText}>
                    Max {selectedCar.luggage}
                  </Text>
                </View>
              </View>

              <Text style={styles.previewPrice}>€{formatFare(fare)}</Text>
              {hour > 0 && (
                <Text style={styles.previewSub}>
                  {hour} hour(s) @ €{selectedCar.hourlyRate}/hour
                </Text>
              )}
              {tripType === "return" && (
                <Text style={[styles.previewSub, { color: COLORS.muted }]}>
                  (Round trip fare x 2 applied)
                </Text>
              )}
            </Animated.View>
          )}

          {/* Car list */}
          <FlatList
            data={cars}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => i.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />

          {/* Continue */}
          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.9}
            disabled={!selectedCar}
            style={[styles.cta, { opacity: selectedCar ? 1 : 0.6 }]}
          >
            <Text style={styles.ctaText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: width * 0.04,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: height * 0.01,
    paddingBottom: height * 0.015,
  },
  screenTitle: {
    color: COLORS.accent,
    fontSize: width * 0.05,
    fontWeight: "700",
  },

  /** Preview */
  preview: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: width * 0.04,
    marginBottom: height * 0.02,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  previewImageWell: {
    width: width * 0.9,
    borderRadius: 14,
    backgroundColor: COLORS.imageWell,
    padding: width * 0.03,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  previewImage: {
    width: "100%",
    height: height * 0.24,
    resizeMode: "contain",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: height * 0.01,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: width * 0.03,
    paddingVertical: height * 0.007,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  badgeText: {
    color: COLORS.text,
    marginLeft: 6,
    fontSize: width * 0.035,
    fontWeight: "600",
  },
  previewPrice: {
    color: COLORS.accent,
    fontSize: width * 0.06,
    fontWeight: "800",
    marginTop: height * 0.015,
  },
  previewSub: { color: COLORS.muted, fontSize: width * 0.035, marginTop: 4 },

  /** List & Cards */
  list: { paddingVertical: 6 },
  card: {
    width: ITEM_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    padding: width * 0.025,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  cardSelected: {
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  cardImageWell: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: COLORS.imageWell,
    paddingVertical: height * 0.01,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardImage: {
    width: width * 0.28,
    height: height * 0.1,
    resizeMode: "contain",
  },
  cardTitle: {
    color: COLORS.text,
    fontWeight: "700",
    marginTop: 2,
    fontSize: width * 0.035,
  },
  cardPrice: {
    color: COLORS.accent,
    fontWeight: "700",
    marginTop: 4,
    fontSize: width * 0.035,
  },
  cardSub: { color: COLORS.muted, fontSize: width * 0.03, marginTop: 2 },

  /** CTA */
  cta: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: height * 0.018,
    marginTop: 10,
  },
  ctaText: { color: "#0E1420", fontWeight: "700", fontSize: width * 0.045 },
});
