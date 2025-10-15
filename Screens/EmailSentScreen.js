import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator 
} from "react-native";
import { auth } from "@/config/firebaseConfig";  // adjust path if deeper
import { reload, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";

import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from 'expo-linking';

export default function EmailSentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, password, firstName, lastName, formattedPhone } = route.params || {};
  const pollRef = useRef(null);
  const [isChecking, setIsChecking] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    let pollInterval = null;
    
    const checkEmailVerification = async () => {
      if (!isMounted || hasVerified) return;
      
      try {
        setIsChecking(true);
        
        // Get current user and reload to get latest status
        const currentUser = auth.currentUser;
        if (currentUser) {
          await reload(currentUser);
          
          if (currentUser.emailVerified) {
            setHasVerified(true);
            
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            
            try {
              // Sign in to refresh the token
              await signInWithEmailAndPassword(auth, email, password);
              
              // Navigate to main app
              navigation.reset({
                index: 0,
                routes: [{ name: "App" }],
              });
            } catch (loginError) {
              console.log("Login error after verification:", loginError);
              setErrorMessage("Could not log in after verification. Please try logging in manually.");
            }
          }
        }
      } catch (error) {
        console.log("Error checking verification:", error);
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    // Start polling immediately
    checkEmailVerification();
    pollInterval = setInterval(checkEmailVerification, 3000);

    // Also set up deep linking listener
    const handleDeepLink = (event) => {
      if (event.url.includes('mode=verifyEmail')) {
        checkEmailVerification();
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      subscription.remove();
    };
  }, [email, password, navigation, hasVerified]);

  const handleResend = async () => {
    try {
      setResending(true);
      setErrorMessage("");
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setErrorMessage("Please enter your email and send the verification link first.");
        return;
      }
      
      await sendEmailVerification(currentUser);
      setErrorMessage("✅ Verification email resent. Please check your inbox.");
      
    } catch (error) {
      let msg = "Could not resend verification email. Please try again.";
      
      switch (error.code) {
        case "auth/too-many-requests":
          msg = "Too many attempts. Please wait before trying again.";
          break;
        case "auth/network-request-failed":
          msg = "Network error. Please check your internet connection.";
          break;
        case "auth/user-not-found":
          msg = "No account found with this email. Please sign up first.";
          break;
        case "auth/invalid-email":
          msg = "Invalid email address. Please check and try again.";
          break;
        case "auth/operation-not-allowed":
          msg = "Email sign-up is not enabled. Please contact support.";
          break;
        default:
          if (error.message?.toLowerCase().includes("network")) {
            msg = "Network error. Please check your internet connection.";
          }
          break;
      }
      
      setErrorMessage(msg);
    } finally {
      setResending(false);
    }
  };


  const handleChangeEmail = () => {
    navigation.reset({
      index: 0,
      routes: [{ 
        name: "VerifyEmailScreen", 
        params: {
          password,
          firstName,
          lastName,
          formattedPhone
        }
      }],
    });
  };

  const handleBackToSignUp = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Auth" }],
    });
  };

  const handleManualLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ 
        name: "LoginScreen",
        params: { preFilledEmail: email }
      }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verification Email Sent</Text>
      <Text style={styles.subtitle}>
        We've sent a verification link to{" "}
        <Text style={styles.email}>{email}</Text>. Please check your inbox and spam folder.
      </Text>
      
      <Text style={styles.instruction}>
        After clicking the verification link, you can login with your credentials.
      </Text>
      
      {errorMessage ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={16} color="#ffcccc" style={styles.errorIcon} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <Text style={styles.note}>
        {isChecking && "Checking verification status..."}
        {hasVerified && "Email verified! Redirecting..."}
      </Text>

      {/* First row: Resend button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleResend}
        disabled={resending}
      >
        {resending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Resend Verification Email</Text>
        )}
      </TouchableOpacity>

      {/* Second row: Change Email button */}
      <TouchableOpacity
        style={[styles.button, styles.secondary]}
        onPress={handleChangeEmail}
      >
        <Text style={styles.buttonText}>Change Email</Text>
      </TouchableOpacity>

      {/* Third row: Two buttons side by side */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.halfButton, styles.outline]}
          onPress={handleBackToSignUp}
        >
          <Text style={[styles.buttonText, styles.outlineText]}>Back to Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.halfButton, styles.loginButton]}
          onPress={handleManualLogin}
        >
          <Text style={styles.buttonText}>Login Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "#0f1115", 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "700", 
    color: "#b88a44", 
    marginBottom: 15,
    textAlign: "center"
  },
  subtitle: { 
    color: "#aaa", 
    fontSize: 16, 
    textAlign: "center", 
    marginBottom: 15,
    lineHeight: 22
  },
  instruction: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 25,
    fontStyle: "italic",
    lineHeight: 20,
  },
  email: { 
    color: "#fff", 
    fontWeight: "600" 
  },
  note: {
    color: "#b88a44",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  button: {
    backgroundColor: "#b88a44",
    paddingVertical: 16,
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
  secondary: { 
    backgroundColor: "#2d2d2d",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#b88a44",
  },
  outlineText: {
    color: "#b88a44",
  },
  loginButton: {
    backgroundColor: "#4CAF50", // Green color for login button
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 12,
  },
  halfButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
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