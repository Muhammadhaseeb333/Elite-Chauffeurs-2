import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { auth } from "@/config/firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

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
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity 
        style={styles.eyeIcon} 
        onPress={() => setShow(!show)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={22} color="#aaa" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#b88a44" />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {renderPasswordInput("Current Password", currentPassword, setCurrentPassword, showCurrent, setShowCurrent)}
        {renderPasswordInput("New Password", newPassword, setNewPassword, showNew, setShowNew)}
        {renderPasswordInput("Confirm New Password", confirmPassword, setConfirmPassword, showConfirm, setShowConfirm)}

        <TouchableOpacity 
          style={[styles.button, loading && styles.disabledButton]} 
          onPress={handleChangePassword} 
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.buttonText}>Updating...</Text>
          ) : (
            <Text style={styles.buttonText}>Change Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate("ForgotPasswordScreen")}
          style={styles.forgotButton}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1115",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: "#b88a44",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  passwordContainer: {
    position: "relative",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#1c1e23",
    color: "#fff",
    padding: 16,
    paddingRight: 50,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -11 }],
    padding: 4,
  },
  button: {
    backgroundColor: "#b88a44",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  forgotButton: {
    alignItems: "center",
  },
  forgotText: {
    color: "#aaa",
    textAlign: "center",
    textDecorationLine: "underline",
    fontSize: 14,
  },
});