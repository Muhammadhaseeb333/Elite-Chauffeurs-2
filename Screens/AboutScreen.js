// Screens/AboutScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInRight,
  FadeInLeft,
  FlipInXUp,
  ZoomIn,
  SlideInDown,
  StretchInX,
  BounceInRight,
  LightSpeedInRight,
  PinwheelIn
} from "react-native-reanimated";

const COLORS = {
  bg: "#0f1115",
  card: "#1c1e23",
  gold: "#b88a44",
  text: "#ffffff",
  muted: "#aaa",
  border: "#23262d",
};

export default function AboutScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.gold} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Brand + tagline */}
        <Animated.Text 
          entering={FadeInUp.duration(800).springify().damping(12)} 
          style={styles.brandHeader}
        >
          Elite Chauffeurs
        </Animated.Text>
        <Animated.Text 
          entering={FadeInUp.delay(100).duration(800).springify().damping(12)} 
          style={styles.subHeader}
        >
          Luxury. Comfort. Style.
        </Animated.Text>

        {/* Mission */}
        <Animated.Text 
          entering={FadeIn.delay(200).duration(1000)} 
          style={styles.textBlock}
        >
          At Elite Chauffeurs, we redefine travel with a premium experience for every client.
          Whether it's a business trip, a luxury tour, or an airport transfer, our mission is
          to deliver seamless, comfortable, and stylish journeys across Ireland.
        </Animated.Text>

        {/* Best Chauffeur Service Award */}
        <Animated.View 
          entering={BounceInRight.delay(300).duration(1200)} 
          style={styles.awardBlockRow}
        >
          <Image source={require("@/assets/images/prize.jpeg")} style={styles.awardImage} />
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.awardTitle}>Best Chauffeur Service</Text>
            <Text style={styles.awardDescription}>
              Awarded as the Chauffeur Company of the Year for outstanding service,
              professionalism, and reliability in 2022/23.
            </Text>
          </View>
        </Animated.View>

        {/* Why Choose Us */}
        <Animated.View 
          entering={LightSpeedInRight.delay(400).duration(1000)} 
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Why Choose Us</Text>
          <View style={styles.cardsRow}>
            <FeatureCard icon="shield-checkmark-outline" title="Professional Chauffeurs" delay={500} />
            <FeatureCard icon="car-outline" title="Luxury Fleet" delay={600} />
          </View>
          <View style={styles.cardsRow}>
            <FeatureCard icon="time-outline" title="Always On Time" delay={700} />
            <FeatureCard icon="map-outline" title="Ireland-Wide Coverage" delay={800} />
          </View>
        </Animated.View>

        {/* Our Service Excellence */}
        <Animated.View 
          entering={FlipInXUp.delay(900).duration(1000)} 
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Our Service Excellence</Text>
          <Text style={styles.textBlock}>
            We believe that true luxury lies in the details. From the moment your chauffeur
            greets you, to the spotless condition of your vehicle, and the personalized
            attention to your preferences — everything we do is designed to make you feel
            valued and at ease.
          </Text>
          <View style={styles.cardsRow}>
            <FeatureCard icon="hand-left-outline" title="Courteous Drivers" delay={1000} />
            <FeatureCard icon="sparkles-outline" title="Immaculate Vehicles" delay={1100} />
          </View>
          <View style={styles.cardsRow}>
            <FeatureCard icon="star-outline" title="VIP Experience" delay={1200} />
          </View>
        </Animated.View>

        {/* Affiliations */}
        <Animated.View 
          entering={PinwheelIn.delay(1300).duration(1200)} 
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Proud Members Of</Text>
          <View style={styles.affiliationsRow}>
            <Animated.Text 
              entering={ZoomIn.delay(1400).duration(800)} 
              style={styles.affiliation}
            >
              IAGTO
            </Animated.Text>
            <Animated.Text 
              entering={ZoomIn.delay(1500).duration(800)} 
              style={styles.affiliation}
            >
              Fáilte Ireland
            </Animated.Text>
            <Animated.Text 
              entering={ZoomIn.delay(1600).duration(800)} 
              style={styles.affiliation}
            >
              Dublin Chamber
            </Animated.Text>
          </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({ icon, title, delay = 0 }) {
  return (
    <Animated.View 
      entering={FadeInRight.delay(delay).duration(800).springify()} 
      style={styles.card}
    >
      <Ionicons name={icon} size={28} color={COLORS.gold} />
      <Text style={styles.cardText}>{title}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: COLORS.bg 
  },
  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: { 
    padding: 20, 
    paddingBottom: 40 
  },
  brandHeader: {
    color: COLORS.gold,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
  },
  subHeader: {
    color: COLORS.muted,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 18,
  },
  textBlock: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 18,
  },
  awardBlockRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  awardImage: {
    width: 100,
    height: 150,
    resizeMode: "contain",
    borderRadius: 8,
  },
  awardTitle: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  awardDescription: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
  },
  section: { 
    marginBottom: 28 
  },
  sectionTitle: {
    color: COLORS.gold,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardText: {
    color: COLORS.text,
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  affiliationsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  affiliation: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
});