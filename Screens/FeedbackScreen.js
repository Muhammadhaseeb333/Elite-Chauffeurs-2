// Screens/FeedbackScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";

// 🔌 Firebase
import { auth, db } from "@/config/firebaseConfig";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
// (Optional) accept context like rideId/driverId/companyId via route if you pass them
import { useRoute, useNavigation } from "@react-navigation/native";

const COLORS = {
  bg: "#0f1115",
  card: "#1c1e23",
  gold: "#b88a44",
  text: "#ffffff",
  muted: "#aaa",
  border: "#23262d",
};

export default function FeedbackScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { rideId = null, driverId = null, companyId = null } = route.params || {};

  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const submitScale = useSharedValue(1);
  const submitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  const getCustomerMeta = async () => {
    const user = auth.currentUser;
    if (!user) return { userId: null, customerName: "Unknown", customerEmail: "Unknown", customerPhone: "Unknown" };

    let customerName = "Unknown";
    let customerEmail = user.email || "Unknown";
    let customerPhone = "Unknown";

    try {
      const snap = await getDoc(doc(db, "customers", user.uid));
      if (snap.exists()) {
        const d = snap.data() || {};
        const fn = (d.firstName || "").trim();
        const ln = (d.lastName || "").trim();
        customerName = `${fn} ${ln}`.trim() || customerName;
        customerEmail = (d.email || customerEmail) || "Unknown";
        customerPhone = (d.phone || customerPhone) || "Unknown";
      }
    } catch {
      // best-effort; keep fallbacks
    }

    return { userId: user.uid, customerName, customerEmail, customerPhone };
  };

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      Alert.alert("Validation", "Please enter your feedback.");
      return;
    }
    setLoading(true);

    try {
      const meta = await getCustomerMeta();

      // Write to the shared `feedback` collection
      await addDoc(collection(db, "feedback"), {
        // who
        userId: meta.userId,
        customerName: meta.customerName,
        customerEmail: meta.customerEmail,
        customerPhone: meta.customerPhone,

        // what
        message: feedback.trim(),
        rating: Number(rating) || 0,

        // context (optional)
        ...(rideId && { rideId }),
        ...(driverId && { driverId }),
        ...(companyId && { companyId }),

        // metadata for your admin panel
        source: "customer",           // companies/drivers can use "company"/"driver"
        platform: "mobile",
        role: "user",
        status: "new",

        createdAt: serverTimestamp(),
      });

      Alert.alert("Thank you!", "Your feedback has been submitted.");
      setFeedback("");
      setRating(0);
    } catch (e) {
      Alert.alert("Error", e?.message || "Could not submit feedback.");
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Feedback</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.Text
            style={styles.title}
            entering={FadeInDown.delay(80).duration(500)}
          >
            We Value Your Feedback
          </Animated.Text>

          <Animated.View entering={FadeIn.delay(150).duration(500)} style={styles.card}>
            <Text style={styles.label}>Tell us about your experience</Text>
            <TextInput
              style={styles.input}
              placeholder="Write your feedback here…"
              placeholderTextColor={COLORS.muted}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              editable={!loading}
            />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(250).duration(500)} style={styles.card}>
            <Text style={styles.label}>Rate your ride</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setRating(i)} disabled={loading}>
                  <Animated.View entering={FadeInUp.delay(i * 80).duration(400)}>
                    <Ionicons
                      name={i <= rating ? "star" : "star-outline"}
                      size={32}
                      color={COLORS.gold}
                    />
                  </Animated.View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={() => {
              submitScale.value = withSpring(0.95, undefined, () => {
                submitScale.value = withSpring(1);
              });
              handleSubmit();
            }}
            disabled={loading}
          >
            <Animated.View style={submitAnimatedStyle}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit Feedback</Text>
              )}
            </Animated.View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  content: { 
    padding: 20, 
    paddingBottom: 36 
  },
  title: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#171a22",
    color: COLORS.text,
    borderRadius: 10,
    padding: 14,
    height: 130,
    textAlignVertical: "top",
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 6,
  },
  submitBtn: {
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});