import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { auth, db } from "@/config/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  reload,
  updateProfile,
} from "firebase/auth";
import { useNavigation, useRoute } from "@react-navigation/native";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

export default function VerifyEmailScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { password, firstName, lastName, formattedPhone } = route.params || {};
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = () => {
    setErrorMessage("");
    if (!email) {
      setErrorMessage("Please enter your email address");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleCreateAndSend = async () => {
    if (!validateEmail()) return;
    if (creating) return;

    try {
      setCreating(true);
      setErrorMessage("");

      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCred.user;

      await updateProfile(user, {
        displayName: `${firstName || ""} ${lastName || ""}`.trim(),
      });

      await setDoc(doc(db, "customers", user.uid), {
        firstName: firstName || "",
        lastName: lastName || "",
        phone: formattedPhone || "",
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
        uid: user.uid,
        role: "user",
        status: "active",
        profileComplete: false,
        guestUser: false,
      });

      await sendEmailVerification(user);

      // Use reset instead of replace to clear the navigation stack
      navigation.reset({
        index: 0,
        routes: [{ 
          name: "EmailSentScreen", 
          params: { 
            email: email.trim(),
            password,
            firstName,
            lastName,
            formattedPhone
          }
        }],
      });
    } catch (error) {
      let msg = "Something went wrong. Please try again.";

      switch (error.code) {
        case "auth/email-already-in-use":
          msg = "This email is already registered. Please log in instead.";
          break;
        case "auth/invalid-email":
          msg = "The email address format is invalid.";
          break;
        case "auth/weak-password":
          msg = "Password must be at least 6 characters.";
          break;
        case "auth/network-request-failed":
          msg = "Network error. Please check your internet connection.";
          break;
        case "auth/too-many-requests":
          msg = "Too many attempts. Please wait a moment and try again.";
          break;
        case "auth/operation-not-allowed":
          msg = "Email sign-up is not enabled. Please contact support.";
          break;
        default:
          // If Firebase returns a message, we still keep it user-friendly
          if (error.message?.toLowerCase().includes("network")) {
            msg = "Network error. Please check your internet connection.";
          } else if (error.message?.toLowerCase().includes("email")) {
            msg = "There was a problem with your email address.";
          } else {
            msg = "Unable to create account. Please try again later.";
          }
          break;
      }

      setErrorMessage(msg);
    } finally {

      setCreating(false);
    }
  };

  const handleBackToSignUp = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" }],
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleBackToSignUp} style={styles.backBtn}>
        <Text style={styles.backText}>← Back to Sign Up</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>
        Enter your email to receive a verification link
      </Text>

      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={16} color="#ffcccc" style={styles.errorIcon} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleCreateAndSend}
        disabled={creating}
      >
        {creating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Verification Link</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1115",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  backBtn: {
    position: "absolute",
    top: 36,
    left: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(184,138,68,0.15)",
  },
  backText: {
    color: "#b88a44",
    fontSize: 14,
    fontWeight: "600",
  },
  title: { 
    color: "#b88a44", 
    fontSize: 22, 
    fontWeight: "600", 
    marginBottom: 10, 
    marginTop: 8 
  },
  subtitle: { 
    color: "#aaa", 
    fontSize: 16, 
    textAlign: "center", 
    marginBottom: 20 
  },
  input: {
    backgroundColor: "#1c1e23",
    color: "#fff",
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    width: "100%",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#b88a44",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: 16 
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "rgba(255, 0, 0, 0.2)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: { 
    color: "#ffcccc", 
    fontSize: 14, 
    flex: 1,
  },
});