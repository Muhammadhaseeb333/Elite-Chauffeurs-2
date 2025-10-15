// Screens/FleetScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
} from "react-native";
import Animated, { Keyframe } from "react-native-reanimated";

const fleet = [
  {
    name: "Business Class – Mercedes E-Class",
    description:
      "The Mercedes E-Class offers executive comfort, premium interiors, and smooth performance — ideal for 2–3 passengers seeking stylish, reliable, and professional business travel.",
    features: [
      "Upgraded leather seating",
      "Built-in phone",
      "Air-conditioning",
      "Satellite navigation",
      "Long wheel base",
      "Finished in elegant silver or black",
    ],
    image: require("../assets/images/E-class.jpg"),
  },
  {
    name: "First Class – Mercedes S-Class",
    description:
      "The Mercedes S-Class is the epitome of luxury, designed for VIPs who demand the highest level of comfort, privacy, and sophistication. Perfect for 2–3 passengers for executive transfers or special occasions.",
    features: [
      "Massaging heated seats",
      "Rear seat entertainment",
      "Ambient lighting",
      "Privacy blinds",
      "Long wheel base",
      "Premium sound system",
    ],
    image: require("../assets/images/S-class.jpg"),
  },
  {
    name: "Luxury MPV – Mercedes V-Class",
    description:
      "The Mercedes V-Class combines space and elegance, making it ideal for families, groups, or executives traveling together. Comfortably accommodates up to 6 passengers with luggage.",
    features: [
      "Spacious leather cabin",
      "Conference-style seating",
      "Privacy windows",
      "Ambient lighting",
      "Climate control",
      "Sliding doors for easy access",
    ],
    image: require("../assets/images/Business-minivan.jpg"),
  },
  {
    name: "Executive Coach – Turas Sprinter",
    description:
      "The Turas Sprinter offers a premium mini-coach experience for 16–19 passengers, combining capacity with luxurious seating and on-board amenities. Perfect for larger group tours and events.",
    features: [
      "Extra-wide reclining leather seats",
      "Mood lighting",
      "USB charging points",
      "Climate control",
      "PA system",
      "Overhead storage",
    ],
    image: require("../assets/images/Sprinter.jpg"),
  },

];

export default function FleetScreen() {
  const cardAnimation = (index) =>
    new Keyframe({
      0: { opacity: 0, transform: [{ translateY: 18 }, { scale: 0.98 }] },
      60: { opacity: 0.7, transform: [{ translateY: 6 }, { scale: 1 }] },
      100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
    })
      .duration(650)
      .delay(index * 80);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {fleet.map((car, index) => (
          <Animated.View key={index} entering={cardAnimation(index)} style={styles.card}>
            <Image source={car.image} style={styles.carImage} />
            <Text style={styles.carName}>{car.name}</Text>
            <Text style={styles.carDescription}>{car.description}</Text>
            <View style={styles.featuresList}>
              {car.features.map((feature, i) => (
                <Text key={i} style={styles.feature}>
                  <Text style={{ color: "#B88A44" }}>• </Text>
                  {feature}
                </Text>
              ))}
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f1115",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: "#1c1e23",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#23262d",
  },
  carImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  carName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#b88a44",
    marginBottom: 6,
  },
  carDescription: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 10,
    lineHeight: 20,
  },
  featuresList: {
    marginLeft: 6,
  },
  feature: {
    fontSize: 13,
    color: "#e5e7eb",
    marginBottom: 4,
  },
});
