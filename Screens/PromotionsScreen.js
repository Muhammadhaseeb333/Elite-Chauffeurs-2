import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { useDiscount } from "@/Screens/DiscountContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

const PromotionsScreen = () => {
  const [promotions, setPromotions] = useState([]);
  const [claimed, setClaimed] = useState({});
  const [activePromoId, setActivePromoId] = useState(null);
  const [loading, setLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const { applyDiscount, resetDiscount } = useDiscount();
  const navigation = useNavigation();
  const route = useRoute();
  const originalFare = route.params?.fare || 0;

  useEffect(() => {
    fetchPromotions();
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
    resetDiscount();
  }, []);

  const fetchPromotions = async () => {
    try {
      const snapshot = await getDocs(collection(db, "coupon"));

      const validPromos = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            badge: `${data.offValue}% OFF`,
            title: data.couponTitle,
            description: "Exclusive chauffeur offer",
            discount: data.offValue,
            validUntil: data.couponValidDate,
            raw: data,
          };
        })
        .filter((promo) => {
          if (!promo.validUntil) return false;
          try {
            const [day, month, year] = promo.validUntil.split("-").map(Number);
            const expiryDate = new Date(year, month - 1, day);
            return expiryDate.getTime() > new Date().getTime();
          } catch {
            return true;
          }
        });

      setPromotions(validPromos);
    } catch (error) {
      console.error("Error fetching promotions:", error);
    }
  };

  const handleClaim = async (promo) => {
    if (claimed[promo.id] || loading) return;

    setLoading(true);
    setClaimed((prev) => ({ ...prev, [promo.id]: true }));
    setActivePromoId(promo.id);

    const expiresIn = 90; // minutes
    applyDiscount(
      promo.discount,
      "voucher",
      promo.raw?.couponCode || null,
      expiresIn,
      originalFare
    );

    await new Promise((resolve) => setTimeout(resolve, 100));
    navigation.goBack();
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#b88a44" />
          <Text style={styles.loadingText}>Applying Discount...</Text>
        </View>
      )}

      {activePromoId && !loading && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={styles.successText}>🎉 Claimed Successfully!</Text>
        </View>
      )}

      <View style={styles.headerContainer}>
        <Text style={styles.header}>Exclusive Vouchers</Text>
        <Text style={styles.subHeader}>Premium offers for our valued clients</Text>
        <View style={styles.headerDivider} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {promotions.map((promo) => {
          const isClaimed = claimed[promo.id];
          return (
            <Animated.View
              key={promo.id}
              style={[
                styles.cardWrapper,
                {
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                },
              ]}
            >
              <ImageBackground
                source={require("@/assets/images/bglogin.png")}
                style={styles.card}
                imageStyle={styles.cardImage}
              >
                <View style={styles.cardContent}>
                  <View style={styles.badgeBox}>
                    <Text style={styles.badgeText}>{promo.badge}</Text>
                  </View>

                  <Text style={styles.title}>{promo.title}</Text>
                  <Text style={styles.description}>{promo.description}</Text>

                  <TouchableOpacity
                    style={[styles.buttonPrimary, isClaimed && styles.buttonClaimed]}
                    disabled={isClaimed || loading}
                    onPress={() => handleClaim(promo)}
                    activeOpacity={0.9}
                  >
                    <Text
                      style={[
                        styles.buttonPrimaryText,
                        isClaimed && styles.buttonClaimedText,
                      ]}
                    >
                      {isClaimed ? "Claimed" : "Claim Offer"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ImageBackground>

              <View style={styles.cardFooter}>
                <Ionicons name="time-outline" size={14} color="#aaa" />
                <Text style={styles.expiryText}>
                  Valid until: {promo.validUntil}
                </Text>
              </View>
            </Animated.View>
          );
        })}

        {promotions.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={60} color="#b88a44" />
            <Text style={styles.emptyStateText}>No current promotions</Text>
            <Text style={styles.emptyStateSubText}>
              Check back later for exclusive offers
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1115" },
  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 30, // extra spacing so heading doesn’t merge
    alignItems: "center",
    top: 50
  },
  header: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    color: "#b88a44",
    marginBottom: 4,
  },
  subHeader: { fontSize: 14, color: "#ddd", textAlign: "center" },
  headerDivider: {
    marginTop: 10,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    width: "80%",
    alignSelf: "center",
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  cardWrapper: {
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  card: { flex: 1, justifyContent: "flex-end" },
  cardImage: { resizeMode: "cover", borderRadius: 18 },
  cardContent: { padding: 16 },
  badgeBox: {
    backgroundColor: "red",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  badgeText: { fontSize: 14, fontWeight: "800", color: "#fff" },
  title: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 5 },
  description: { fontSize: 14, color: "#ddd", marginBottom: 12 },
  buttonPrimary: {
    backgroundColor: "#b88a44",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonPrimaryText: { fontSize: 16, fontWeight: "800", color: "#000" },
  buttonClaimed: { backgroundColor: "#28a745" },
  buttonClaimedText: { color: "#fff" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "rgba(20,20,20,0.9)",
  },
  expiryText: { color: "#aaa", fontSize: 12, marginLeft: 5 },
  successBanner: {
    position: "absolute",
    top: Platform.OS === "android" ? 50 : 70,
    width: "100%",
    backgroundColor: "#28a745",
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  successText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginLeft: 6 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
  },
  loadingText: { color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 12 },
  emptyState: { alignItems: "center", paddingVertical: 50 },
  emptyStateText: { fontSize: 18, color: "#b88a44", fontWeight: "700" },
  emptyStateSubText: { fontSize: 14, color: "#aaa", marginTop: 4 },
});

export default PromotionsScreen;
