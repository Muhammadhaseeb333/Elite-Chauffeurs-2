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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
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
    luggage: 3,
    fixedFare: 105,
    perKmRate: 1.7,
    hourlyRate: 90,
  },
  {
    id: "2",
    name: "S-Class",
    image: require("../assets/images/S-class.jpg"),
    passengers: 3,
    luggage: 3,
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
    luggage: 20,
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

  // Navigation back handler
  const handleBackPress = () => {
    navigation.goBack();
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
        <View style={styles.cardContent}>
          <View style={styles.cardImageWell}>
            <Image source={item.image} style={styles.cardImage} />
          </View>
          
          <View style={styles.cardDetails}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            
            <View style={styles.specsRow}>
              <View style={styles.specItem}>
                <Ionicons name="people-outline" size={16} color={COLORS.muted} />
                <Text style={styles.specText}>{item.passengers} passengers</Text>
              </View>
              <View style={styles.specItem}>
                <Ionicons name="briefcase-outline" size={16} color={COLORS.muted} />
                <Text style={styles.specText}>{item.luggage} luggage</Text>
              </View>
            </View>
            
            <Text style={styles.cardPrice}>
              €{isSelected ? formatFare(fare) : formatFare(calc)}
            </Text>
            {hour > 0 && !isSelected && (
              <Text style={styles.cardSub}>€{item.hourlyRate}/hour</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.accent} />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>
              {tripType === "return"
                ? "Select Return Vehicle"
                : "Select Your Vehicle"}
            </Text>
          </View>
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

        {/* Car list - Vertical scroll with full-width cards */}
        <View style={styles.carListContainer}>
          <Text style={styles.carListTitle}>Available Vehicles</Text>
          <FlatList
            data={cars}
            showsVerticalScrollIndicator={false}
            keyExtractor={(i) => i.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            // Remove any numColumns prop completely for single column
          />
        </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: width * 0.04,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: height * 0.01,
    paddingBottom: height * 0.015,
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
  screenTitle: {
    color: COLORS.accent,
    fontSize: width * 0.05,
    fontWeight: "700",
    flex: 1,
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

  /** Car List Container */
  carListContainer: {
    flex: 1,
    marginBottom: 20,
  },
  carListTitle: {
    color: COLORS.text,
    fontSize: width * 0.045,
    fontWeight: "700",
    marginBottom: 15,
    marginLeft: 8,
  },

  /** List & Cards */
  list: { 
    paddingBottom: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.line,
    width: '100%',
  },
  cardSelected: {
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardImageWell: {
    width: width * 0.3,
    height: width * 0.2,
    borderRadius: 12,
    backgroundColor: COLORS.imageWell,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardImage: {
    width: '90%',
    height: '90%',
    resizeMode: "contain",
  },
  cardDetails: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: width * 0.045,
    marginBottom: 8,
  },
  specsRow: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 16,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  specText: {
    color: COLORS.muted,
    fontSize: width * 0.035,
    fontWeight: "500",
  },
  cardPrice: {
    color: COLORS.accent,
    fontWeight: "700",
    fontSize: width * 0.04,
  },
  cardSub: { 
    color: COLORS.muted, 
    fontSize: width * 0.033, 
    marginTop: 2,
  },

  /** CTA */
  cta: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: height * 0.018,
    marginTop: 10,
    marginBottom: 30,
  },
  ctaText: { color: "#0E1420", fontWeight: "700", fontSize: width * 0.045 },
});