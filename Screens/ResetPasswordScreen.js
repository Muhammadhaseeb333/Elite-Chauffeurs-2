import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, SafeAreaView } from "react-native";
import { getAuth, signInWithEmailAndPassword, updatePassword } from "firebase/auth";

export default function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleReset = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      return Alert.alert("Error", "Please fill in all fields.");
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match.");
    }
    if (newPassword.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters.");
    }

    try {
      const auth = getAuth();
      // For production, better to reset password in backend using Admin SDK
      await updatePassword(auth.currentUser, newPassword);

      Alert.alert("Success", "Password updated successfully.");
      navigation.navigate("LoginScreen");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to reset password. Please log in again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <TextInput
        style={styles.input}
        placeholder="New Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Update Password</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f1115", padding: 20, justifyContent: "center" },
  title: { color: "#b88a44", fontSize: 22, fontWeight: "600", marginBottom: 25, textAlign: "center" },
  input: { backgroundColor: "#1c1e23", color: "#fff", padding: 14, marginBottom: 15, borderRadius: 10, fontSize: 16 },
  button: { backgroundColor: "#b88a44", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
