import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PhoneInput from "react-native-phone-number-input";
import { useGoogleAuth } from "@/services/useGoogleAuth";
import { loginUser } from "@/services/authService";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Platform } from "react-native";

// Firebase + Firestore helpers
import { auth, db } from "@/config/firebaseConfig";
import { 
  signInAnonymously, 
  sendEmailVerification, 
  signInWithEmailAndPassword,
  signOut,
  reload
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const { width } = Dimensions.get("window");
const scaleFont = (size) => (width / 375) * size;

export default function LoginScreen() {
  const navigation = useNavigation();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Shared
  const [password, setPassword] = useState("");

  // Login-only
  const [email, setEmail] = useState("");

  // Signup-only
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSkipLoading, setIsSkipLoading] = useState(false);
  
  // New state for unverified email modal
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const phoneInput = useRef(null);
  const { request, promptAsync } = useGoogleAuth();

  // Polling effect to check email verification status
  useEffect(() => {
    let pollInterval = null;
    
    if (showVerificationModal && currentUser) {
      const checkEmailVerification = async () => {
        if (!currentUser) return;
        
        try {
          setIsCheckingVerification(true);
          
          // Reload user to get latest verification status
          await reload(currentUser);
          
          if (currentUser.emailVerified) {
            // Email verified! Continue with login flow
            setIsCheckingVerification(false);
            setShowVerificationModal(false);
            
            // Ensure profile exists & mark as registered (not guest)
            const uid = currentUser.uid;
            if (uid) {
              await ensureCustomerDoc(uid, { guestUser: false });
            }

            // Navigate to main app
            navigation.reset({
              index: 0,
              routes: [{ name: "App" }],
            });
          }
        } catch (error) {
          console.error("Error checking verification:", error);
        } finally {
          setIsCheckingVerification(false);
        }
      };

      // Start polling immediately and every 3 seconds
      checkEmailVerification();
      pollInterval = setInterval(checkEmailVerification, 3000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [showVerificationModal, currentUser, navigation]);

  const validateForm = () => {
    setErrorMessage(""); // Clear previous errors
    
    if (isSignup) {
      if (!firstName || !lastName || !formattedPhone || !password) {
        setErrorMessage("Please fill all fields");
        return false;
      }
      if (firstName.length < 2) {
        setErrorMessage("First name must be at least 2 characters");
        return false;
      }
      if (lastName.length < 2) {
        setErrorMessage("Last name must be at least 2 characters");
        return false;
      }
      if (formattedPhone.length < 10) {
        setErrorMessage("Please enter a valid phone number");
        return false;
      }
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters");
        return false;
      }
    } else {
      if (!email || !password) {
        setErrorMessage("Please fill all fields");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrorMessage("Please enter a valid email address");
        return false;
      }
    }
    return true;
  };

  // Ensure a customers/{uid} doc exists with the right flags
  const ensureCustomerDoc = async (uid, data = {}) => {
    const ref = doc(db, "customers", uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    } else {
      await setDoc(
        ref,
        {
          firstName: "",
          lastName: "",
          email: auth.currentUser?.email || "",
          phone: "",
          stripeCustomerId: null,
          guestUser: true,
          createdAt: serverTimestamp(),
          ...data,
        },
        { merge: true }
      );
    }
  };

  // "Skip" → Anonymous auth + guest profile
  const handleSkip = async () => {
    if (isSkipLoading) return;
    setIsSkipLoading(true);
    setErrorMessage("");

    try {
      const cred = await signInAnonymously(auth);
      const uid = cred.user.uid;

      await ensureCustomerDoc(uid, {
        guestUser: true,
      });

      navigation.navigate("App");
    } catch (err) {
      console.error("Skip/guest error:", err);
      Alert.alert("Error", "Could not continue as guest. Please try again.");
    } finally {
      setIsSkipLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!validateForm()) return;
    if (isLoading) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      if (isSignup) {
        // Navigate to VerifyEmailScreen for user creation
        navigation.navigate("VerifyEmailScreen", {
          password,
          firstName,
          lastName,
          formattedPhone,
        });
      } else {
        // Email/password login - try to sign in first
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Check if email is verified
        if (!user.emailVerified) {
          // Store the user and show verification modal
          setCurrentUser(user);
          setUnverifiedEmail(email);
          setShowVerificationModal(true);
          // Don't proceed with login, just return
          setIsLoading(false);
          return;
        }

        // If email is verified, continue with normal flow
        // Ensure profile exists & mark as registered (not guest)
        const uid = user.uid;
        if (uid) {
          await ensureCustomerDoc(uid, { guestUser: false });
        }

        navigation.navigate("App");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (isSendingVerification) return;
    
    setIsSendingVerification(true);
    
    try {
      // Use the stored currentUser to send verification
      if (currentUser) {
        await sendEmailVerification(currentUser);
        
        // Show success message
        setErrorMessage("✅ Verification email sent! Please check your inbox and spam folder.");
      } else {
        setErrorMessage("Unable to resend verification. Please try logging in again.");
      }
      
    } catch (error) {
      console.error("Error sending verification:", error);
      let errorMsg = "Failed to send verification email. Please try again.";
      
      if (error.code === "auth/too-many-requests") {
        errorMsg = "Too many attempts. Please wait before trying again.";
      } else if (error.code === "auth/network-request-failed") {
        errorMsg = "Network error. Please check your internet connection.";
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleAuthError = (error) => {
    let message = "Something went wrong. Please try again.";
  
    switch (error.code) {
      case "auth/invalid-email":
        message = "The email address is not valid.";
        break;
      case "auth/user-disabled":
        message = "Your account has been disabled. Please contact support.";
        break;
      case "auth/user-not-found":
        message = "No account found with this email. Please sign up first.";
        break;
      case "auth/wrong-password":
      case "auth/invalid-credential":
        message = "The email or password you entered is incorrect.";
        break;
      case "auth/too-many-requests":
        message = "Too many failed attempts. Please reset your password or try again later.";
        break;
      case "auth/email-already-in-use":
        message = "This email is already registered. Please log in instead.";
        break;
      case "auth/weak-password":
        message = "Your password is too weak. Please use at least 6 characters.";
        break;
      case "auth/network-request-failed":
        message = "Network error. Please check your internet connection.";
        break;
      case "auth/operation-not-allowed":
        message = "Email and password login is not enabled. Please use another method.";
        break;
      default:
        message = "Unable to sign in. Please check your details and try again.";
        break;
    }
  
    setErrorMessage(message);
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setPassword("");
    setEmail("");
    setErrorMessage("");
  };

  // Close modal and sign out the unverified user
  const handleCloseModal = async () => {
    if (currentUser) {
      try {
        await signOut(auth);
      } catch (error) {
        console.error("Error signing out:", error);
      }
    }
    setShowVerificationModal(false);
    setCurrentUser(null);
  };

  return (
    <ImageBackground
      source={isSignup ? require("@/assets/images/bgsignup.png") : require("@/assets/images/bglogin.png")}
      style={styles.background}
      blurRadius={2}
    >
      <SafeAreaView style={styles.overlay}>
        {/* Skip (top-right) */}
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.skipBtn} 
            onPress={handleSkip} 
            disabled={isSkipLoading || isLoading}
          >
            {isSkipLoading ? (
              <ActivityIndicator color="#b88a44" />
            ) : (
              <Text style={styles.skipText}>Skip</Text>
            )}
          </TouchableOpacity>
        </View>

        <Animated.Text entering={FadeInUp.duration(700)} style={styles.title}>
          Elite Chauffeurs
        </Animated.Text>

        <Animated.Text entering={FadeInUp.delay(100).duration(700)} style={styles.subtitle}>
          {isSignup ? "Create your account" : "Please log in to continue your journey"}
        </Animated.Text>

        {errorMessage ? (
          <Animated.View entering={FadeInUp.delay(150).duration(700)} style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="#ffcccc" style={styles.errorIcon} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </Animated.View>
        ) : null}

        {isSignup ? (
          <>
            {/* First Name */}
            <Animated.View entering={FadeInUp.delay(200).duration(700)} style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#b88a44" style={styles.icon} />
              <TextInput
                placeholder="First Name"
                placeholderTextColor="#aaa"
                style={styles.input}
                onChangeText={setFirstName}
                value={firstName}
                autoCapitalize="words"
              />
            </Animated.View>

            {/* Last Name */}
            <Animated.View entering={FadeInUp.delay(250).duration(700)} style={styles.inputContainer}>
              <Ionicons name="person-circle-outline" size={20} color="#b88a44" style={styles.icon} />
              <TextInput
                placeholder="Last Name"
                placeholderTextColor="#aaa"
                style={styles.input}
                onChangeText={setLastName}
                value={lastName}
                autoCapitalize="words"
                secureTextEntry={false} 
              />
            </Animated.View>

            {/* Phone Input */}
            <Animated.View entering={FadeInUp.delay(300).duration(700)} style={styles.phoneInputContainer}>
              <Ionicons name="call-outline" size={20} color="#b88a44" style={styles.icon} />
              <PhoneInput
                ref={phoneInput}
                defaultValue={phoneNumber}
                defaultCode="IE"
                layout="first"
                onChangeText={setPhoneNumber}
                onChangeFormattedText={setFormattedPhone}
                containerStyle={styles.phoneContainer}
                textContainerStyle={styles.phoneTextContainer}
                textInputStyle={styles.phoneInput}
                codeTextStyle={styles.phoneCode}
                flagButtonStyle={styles.flagButton}
                placeholder="Phone Number"
                placeholderTextColor="#aaa"
                textInputProps={{
                  placeholderTextColor: "#aaa",
                }}
              />
            </Animated.View>

            {/* Password (signup) */}
            <Animated.View entering={FadeInUp.delay(350).duration(700)} style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#b88a44" style={styles.icon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#aaa"
                style={styles.input}
                onChangeText={setPassword}
                value={password}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#aaa" />
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          <>
            {/* Email (login only) */}
            <Animated.View entering={FadeInUp.delay(200).duration(700)} style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#b88a44" style={styles.icon} />
              <TextInput
                placeholder="Email"
                placeholderTextColor="#aaa"
                style={styles.input}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
              />
            </Animated.View>

            {/* Password (login) */}
            <Animated.View entering={FadeInUp.delay(250).duration(700)} style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#b88a44" style={styles.icon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor="#aaa"
                style={styles.input}
                onChangeText={setPassword}
                value={password}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#aaa" />
              </TouchableOpacity>
            </Animated.View>

            {/* Forgot Password */}
            <Animated.View entering={FadeInUp.delay(300).duration(700)} style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={() => navigation.navigate("ForgotPasswordScreen")}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        {/* Auth Button */}
        <Animated.View entering={FadeInUp.delay(isSignup ? 400 : 350).duration(700)} style={styles.loginBtn}>
          <TouchableOpacity onPress={handleAuth} activeOpacity={0.9} disabled={isSkipLoading || isLoading}>
            <LinearGradient colors={["#B88A44", "#9C6B2F"]} style={styles.gradient}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginText}>{isSignup ? "Continue" : "Login"}</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Toggle Login/Signup */}
        <Animated.View entering={FadeInUp.delay(isSignup ? 450 : 400).duration(700)} style={styles.signupContainer}>
          <Text style={styles.signupText}>{isSignup ? "Already have an account? " : "Don't have an account? "}</Text>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setIsSignup(!isSignup);
            }}
            disabled={isLoading || isSkipLoading}
          >
            <Text style={[styles.signupText, { color: "#B88A44", fontWeight: "600" }]}>
              {isSignup ? "Login" : "Sign Up"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Email Verification Modal */}
        <Modal
          visible={showVerificationModal}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Email Not Verified</Text>
              
              <Text style={styles.modalText}>
                Your email address <Text style={styles.emailHighlight}>{unverifiedEmail}</Text> has not been verified yet.
              </Text>
              
              <Text style={styles.modalText}>
                Please check your inbox and spam folder for the verification link. 
                {isCheckingVerification && "\n\nChecking verification status..."}
              </Text>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendVerification}
                disabled={isSendingVerification}
              >
                {isSendingVerification ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.resendButtonText}>Resend Verification Email</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
                disabled={isCheckingVerification}
              >
                <Text style={styles.closeButtonText}>
                  {isCheckingVerification ? "Checking..." : "Close"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 17, 21, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  // Top bar with Skip
  topBar: {
    position: "absolute",
    top: 40,
    right: 10,
    left: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    zIndex: 10,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(184, 138, 68, 0.15)",
    borderWidth: 1,
    borderColor: "#b88a44",
    marginTop: Platform.OS === "ios" ? 40 : 0,
  },
  skipText: { color: "#b88a44", fontWeight: "700", fontSize: 14 },

  title: { fontSize: 30, fontWeight: "700", color: "#b88a44", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "#aaa", marginBottom: 20 },
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
    fontSize: scaleFont(14), 
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1e23",
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: Platform.OS === "ios" ? "90%" : "100%",
    alignSelf: "center",
    height: 50,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1e23",
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: Platform.OS === "ios" ? "90%" : "100%",
    alignSelf: "center",
    height: 50,
  },
  icon: { marginRight: 5 },
  input: { flex: 1, height: 50, color: "#fff" },
  phoneContainer: {
    backgroundColor: "transparent",
    flex: 1,
    height: 40,
  },
  phoneTextContainer: { 
    backgroundColor: "transparent",
    paddingVertical: 0,
  },
  phoneInput: { 
    color: "white", 
    height: 40, 
    fontSize: 14,
    placeholderTextColor: "#aaa"
  },
  phoneCode: { 
    color: "white",
    fontSize: 14,
  },
  flagButton: {
    width: 60,
  },
  loginBtn: { 
    width: Platform.OS === "ios" ? "90%" : "100%",
    marginTop: 10,
    alignSelf: "center",
  },
  gradient: { borderRadius: 20, paddingVertical: 15, alignItems: "center" },
  loginText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  signupContainer: { flexDirection: "row", marginTop: 20 },
  signupText: { color: "#aaa", fontSize: 14 },
  forgotPasswordContainer: { 
    width: Platform.OS === "ios" ? "90%" : "100%",
    alignItems: "flex-end", 
    marginBottom: 10,
    alignSelf: "center",
  },
  forgotPasswordText: { color: "#B88A44", fontSize: 14, fontWeight: "500" },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1c1e23",
    borderRadius: 15,
    padding: 25,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#b88a44",
    textAlign: "center",
    marginBottom: 15,
  },
  modalText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 22,
  },
  emailHighlight: {
    color: "#b88a44",
    fontWeight: "600",
  },
  resendButton: {
    backgroundColor: "#b88a44",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    marginTop: 10,
  },
  resendButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#b88a44",
  },
  closeButtonText: {
    color: "#b88a44",
    fontWeight: "600",
    fontSize: 16,
  },
});