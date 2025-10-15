import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { auth, db } from "@/config/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function GuestContactScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { finalFare, receiptData } = route.params || {};

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const validate = () => {
    if (!firstName || !email || !phone) {
      Alert.alert("Missing info", "Please enter name, email and phone.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return false;
    }
    if (phone.replace(/\D/g, "").length < 7) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const user = auth.currentUser;
    if (!user || !user.isAnonymous) {
      Alert.alert("Not a guest", "This screen is only for guest users.");
      return;
    }
    setSaving(true);
    try {
      // Keep structure consistent (add lastName: "" for guests)
      const payload = {
        firstName: firstName.trim(),
        lastName: "", // ← ensure structure matches registered users
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        guestUser: true,
        updatedAt: serverTimestamp(),
      };

      // Save to customers/{uid} so Payment can read it
      await setDoc(doc(db, "customers", user.uid), payload, { merge: true });

      // Forward to payment; pass fields (incl. lastName) for PaymentScreen
      navigation.navigate("payment", {
        finalFare,
        receiptData: {
          ...receiptData,
          firstName: payload.firstName,
          lastName: payload.lastName,      // ← keep structure
          email: payload.email,
          phone: payload.phone,
        },
      });
    } catch (e) {
      console.error("Save guest contact error:", e);
      Alert.alert("Error", e?.message || "Failed to save details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Your Contact Details</Text>
      <Text style={styles.subtitle}>We’ll use these to coordinate your ride</Text>

      <TextInput
        placeholder="First Name"
        placeholderTextColor="#888"
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Phone (+countrycode...)"
        placeholderTextColor="#888"
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save & Continue</Text>}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1115", padding: 20, justifyContent: "center" },
  title: { color: "#b88a44", fontSize: 22, fontWeight: "800", marginBottom: 6, textAlign: "center" },
  subtitle: { color: "#aaa", fontSize: 14, marginBottom: 18, textAlign: "center" },
  input: {
    backgroundColor: "#1c1e23",
    color: "#fff",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2d36",
  },
  btn: { backgroundColor: "#b88a44", paddingVertical: 15, borderRadius: 12, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
