import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { auth } from "@/config/firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // Make sure you have expo-vector-icons installed

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Validation
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      return Alert.alert("Error", "All fields are required.");
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "New password and confirmation do not match.");
    }

    if (newPassword.length < 6) {
      return Alert.alert("Error", "New password must be at least 6 characters.");
    }

    setLoading(true);
    const credentials = EmailAuthProvider.credential(user.email, currentPassword);

    try {
      await reauthenticateWithCredential(user, credentials);
      await updatePassword(user, newPassword);
      Alert.alert("Success", "Password changed successfully.");
      navigation.goBack();
    } catch (error) {
      console.log("Password change error:", error);
      if (error.code === "auth/wrong-password") {
        Alert.alert("Error", "The current password you entered is incorrect.");
      } else if (error.code === "auth/too-many-requests") {
        Alert.alert("Error", "Too many failed attempts. Please try again later.");
      } else {
        Alert.alert("Error", "Failed to change password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordInput = (placeholder, value, setValue, show, setShow) => (
    <View style={styles.passwordContainer}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
        secureTextEntry={!show}
        value={value}
        onChangeText={setValue}
      />
      <TouchableOpacity style={styles.eyeIcon} onPress={() => setShow(!show)}>
        <Ionicons name={show ? "eye-off" : "eye"} size={22} color="#aaa" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Change Password</Text>

      {renderPasswordInput("Current Password", currentPassword, setCurrentPassword, showCurrent, setShowCurrent)}
      {renderPasswordInput("New Password", newPassword, setNewPassword, showNew, setShowNew)}
      {renderPasswordInput("Confirm New Password", confirmPassword, setConfirmPassword, showConfirm, setShowConfirm)}

      <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? "Updating..." : "Change Password"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("ForgotPasswordScreen")}>
  <Text style={styles.forgotText}>Forgot Password?</Text>

  
</TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1115",
    padding: 20,
    justifyContent: "center",
  },
  title: {
    color: "#b88a44",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 25,
    textAlign: "center",
  },
  passwordContainer: {
    position: "relative",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#1c1e23",
    color: "#fff",
    padding: 14,
    paddingRight: 40, // extra space for icon
    borderRadius: 10,
    fontSize: 16,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -11 }],
  },
  button: {
    backgroundColor: "#b88a44",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  forgotText: {
    color: "#aaa",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
