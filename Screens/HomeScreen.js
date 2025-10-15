import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Image,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  FadeInUp,
  SlideInLeft,
  SlideInRight,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { icons } from "../components/icons";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const { width } = Dimensions.get("window");
const scaleSize = width / 375;
const ICON_SIZE = scaleSize * 26;

const serviceNames = {
  city: "One Way",
  plane: "Return",
  clock: "By Hour",
  mountaincity: "Tour",
};

const serviceNavigation = {
  city: "MapScreen",
  plane: "ReturnMapScreen",
  clock: "HourlyBookingMapScreen",
  mountaincity: "ToursScreen",
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("home");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(true);

  const handleTabPress = (tab) => {
    setActiveTab(tab);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
    };

  const fetchUserName = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "customers", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFirstName(data?.firstName || "");
        }
      }
    } catch (error) {
      console.log("Failed to fetch user name:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserName();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f1115", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#b88a44" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" />

      <ImageBackground
        source={require("@/assets/images/bghome.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <TouchableOpacity
              onPress={() => navigation.navigate("PersonalInfoScreen")}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Open Personal Information"
            >
              <Ionicons name="person-circle-outline" size={42} color="#b88a44" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.container}>
            {/* Greeting */}
            <Animated.Text
              entering={FadeInUp.delay(100).duration(800)}
              style={styles.title}
            >
              {getGreeting()}, {firstName || "User"}!
            </Animated.Text>

            {/* Ride Card */}
            <Animated.View
              entering={FadeInUp.delay(200).duration(800)}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>Search for a Ride</Text>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => navigation.navigate("MapScreen")}
              >
                <Text style={styles.bookButtonText}>Find a Ride</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* First Row of Services */}
            <View style={styles.optionsRow}>
              {["city", "plane"].map((icon, index) => (
                <Animated.View
                  key={icon}
                  entering={
                    index % 2 === 0
                      ? SlideInLeft.delay(300).duration(850)
                      : SlideInRight.delay(400).duration(850)
                  }
                  style={styles.optionCard}
                >
                  <TouchableOpacity
                    style={styles.centeredButton}
                    onPress={() => navigation.navigate(serviceNavigation[icon])}
                  >
                    <FontAwesomeIcon icon={icons[icon]} size={ICON_SIZE} color="#fff" />
                    <Text style={styles.optionTitle}>{serviceNames[icon]}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>

            {/* Second Row of Services */}
            <View style={styles.optionsRow}>
              {["clock", "mountaincity"].map((icon, index) => (
                <Animated.View
                  key={icon}
                  entering={
                    index % 2 === 0
                      ? SlideInLeft.delay(500).duration(850)
                      : SlideInRight.delay(600).duration(850)
                  }
                  style={styles.optionCard}
                >
                  <TouchableOpacity
                    style={styles.centeredButton}
                    onPress={() => navigation.navigate(serviceNavigation[icon])}
                  >
                    <FontAwesomeIcon icon={icons[icon]} size={ICON_SIZE} color="#fff" />
                    <Text style={styles.optionTitle}>{serviceNames[icon]}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  logo: {
    width: 90,
    height: 110,
  },
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#b88a44",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#1c1e23",
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 14,
  },
  bookButton: {
    backgroundColor: "#b88a44",
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: "#1c1e23",
    borderRadius: 14,
    flex: 1,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
    padding: 10,
  },
  optionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 10,
  },
  centeredButton: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
  },
});
