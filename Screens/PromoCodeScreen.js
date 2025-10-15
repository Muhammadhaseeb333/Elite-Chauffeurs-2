import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { useDiscount } from "@/Screens/DiscountContext";

const COLORS = {
  bg: "#0f1115",
  card: "#1c1e23",
  gold: "#b88a44",
  text: "#ffffff",
  muted: "#a9a9a9",
  border: "#23262d",
  danger: "#ef4444",
  brand1: "#2a2d36",
  brand2: "#2f3340",
};

export default function PromoCodeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { applyDiscount, resetDiscount, discountPercentage = 0, discountType } = useDiscount();

  const [promoCode, setPromoCode] = useState("");
  const [loading, setLoading] = useState(false);

  const originalFare = route.params?.fare || 0;

  const handleApplyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      Alert.alert("Error", "Please enter a promo code.");
      return;
    }

    setLoading(true);
    try {
      const promosRef = collection(db, "promoCodes");
      const q = query(
        promosRef,
        where("code", "==", code),
        where("isActive", "==", true)
      );
      const snap = await getDocs(q);

      if (snap.empty) throw new Error("Invalid or expired promo code");

      const data = snap.docs[0].data();
      const now = new Date();
      const expiry = data.expiryDate?.toDate?.();

      if (expiry && now > expiry) throw new Error("This promo code has expired");

      // apply to context (keeps screen parity with your other flows)
      applyDiscount(
        data.discountPercentage,
        "promo",
        code,
        data.validForMinutes || 90,
        originalFare
      );

      Alert.alert("Success", `Promo applied! You got ${data.discountPercentage}% off.`);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to apply promo.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    resetDiscount();
    Alert.alert("Discount removed", "Your discount has been removed.");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="ticket-percent" size={20} color={COLORS.gold} />
          <Text style={styles.cardTitle}>Apply Promo Code</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.helperText}>
          Enter your promo code below. If valid, your discount will be applied to the fare.
        </Text>

        <View style={styles.inputWrap}>
          <MaterialIcons name="confirmation-number" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.input}
            placeholder="e.g. SUMMER2024"
            placeholderTextColor="#888"
            value={promoCode}
            onChangeText={setPromoCode}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!loading}
            returnKeyType="done"
          />
        </View>

        {discountPercentage > 0 && (
          <TouchableOpacity style={styles.removeBtn} onPress={handleRemove} disabled={loading}>
            <MaterialIcons name="close" size={18} color="#fff" />
            <Text style={styles.removeBtnText}>
              Remove {discountType === "voucher" ? "Voucher" : "Promo Code"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.applyBtn} onPress={handleApplyPromo} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.applyBtnText}>Apply Promo Code</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, padding: 16, justifyContent: "center" },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },

  helperText: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 10,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171a22",
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 6,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },

  removeBtn: {
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
  },
  removeBtnText: { color: "#fff", fontWeight: "700", marginLeft: 8 },

  applyBtn: {
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "center",
  },
  applyBtnText: { color: "#fff", fontWeight: "800", fontSize: 16, marginRight: 8 },
});
