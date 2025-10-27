import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "@/config/firebaseConfig";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch,
  serverTimestamp 
} from "firebase/firestore";
import { 
  deleteUser, 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  signOut 
} from "firebase/auth";
import { useNavigation } from "@react-navigation/native";

export default function PersonalInfoScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [phone, setPhone]         = useState("");
  const [email, setEmail]         = useState("");

  // Delete reasons as per Apple guidelines
  const deleteReasons = [
    "I'm concerned about my privacy",
    "I don't find the app useful",
    "I found a better alternative",
    "The app has too many bugs/issues",
    "I'm not using the app anymore",
    "Other reason"
  ];

  // ----- Load profile -----
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const ref = doc(db, "customers", user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data() || {};
            setFirstName(data.firstName || "");
            setLastName(data.lastName || "");
            setPhone(data.phone || "");
            setEmail(data.email || user.email || "");
          } else {
            setEmail(user.email || "");
          }
        }
      } catch (error) {
        console.log("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // ----- Save profile -----
  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    try {
      const ref = doc(db, "customers", user.uid);

      const updatePayload = {
        firstName: (firstName || "").trim(),
        lastName: (lastName || "").trim(),
        phone: (phone || "").trim(),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(ref, updatePayload);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      console.log("Error updating user:", error);
      Alert.alert("Error", error.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // ----- Delete Account Functions -----
  const initiateDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmation = () => {
    setShowDeleteModal(false);
    
    // Check if user needs to reauthenticate (recent login required for Firebase delete)
    const user = auth.currentUser;
    const lastSignIn = user.metadata.lastSignInTime;
    const now = new Date();
    const lastSignInTime = new Date(lastSignIn);
    const hoursSinceLogin = (now - lastSignInTime) / (1000 * 60 * 60);

    // If last login was more than 5 minutes ago, require reauthentication
    if (hoursSinceLogin > 0.083) { // 5 minutes in hours
      setShowReauthModal(true);
    } else {
      setShowReasonModal(true);
    }
  };

  const handleReauthenticate = async () => {
    if (!password) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      setShowReauthModal(false);
      setPassword("");
      setShowReasonModal(true);
    } catch (error) {
      console.log("Reauthentication error:", error);
      Alert.alert("Error", "Incorrect password. Please try again.");
    }
  };

  const deleteUserData = async (userId) => {
    try {
      const batch = writeBatch(db);
      
      // Delete user document from customers collection
      const userRef = doc(db, "customers", userId);
      batch.delete(userRef);

      // Delete user's rides
      const ridesQuery = query(
        collection(db, "rides"), 
        where("userId", "==", userId)
      );
      const ridesSnapshot = await getDocs(ridesQuery);
      ridesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete user's hourly rides
      const hourlyRidesQuery = query(
        collection(db, "byHourRides"), 
        where("userId", "==", userId)
      );
      const hourlyRidesSnapshot = await getDocs(hourlyRidesQuery);
      hourlyRidesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log("User data deleted successfully");
    } catch (error) {
      console.error("Error deleting user data:", error);
      throw error;
    }
  };

  const handleFinalDelete = async (reason) => {
    setIsDeleting(true);
    try {
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("No user found");
      }

      // Log deletion reason (optional but good for analytics)
      console.log("Account deletion reason:", reason);
      
      // Delete user data from Firestore first
      await deleteUserData(user.uid);
      
      // Delete Firebase Auth account
      await deleteUser(user);
      
      // Success - navigate to auth stack
      Alert.alert(
        "Account Deleted", 
        "Your account and all associated data have been permanently deleted.",
        [{ text: "OK", onPress: () => navigation.navigate("Auth") }]
      );
      
    } catch (error) {
      console.error("Account deletion error:", error);
      
      // If Firebase Auth deletion fails, at least clear local data and sign out
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          "Reauthentication Required", 
          "For security, please sign in again to delete your account.",
          [
            { 
              text: "Sign In Again", 
              onPress: async () => {
                await signOut(auth);
                navigation.navigate("Auth");
              }
            },
            { text: "Cancel", style: "cancel" }
          ]
        );
      } else {
        Alert.alert(
          "Deletion Error", 
          "We encountered an issue deleting your account. Please try again or contact support.",
          [
            { 
              text: "Try Again", 
              onPress: () => setShowReasonModal(true) 
            },
            { text: "Cancel", style: "cancel" }
          ]
        );
      }
    } finally {
      setIsDeleting(false);
      setShowReasonModal(false);
      setDeleteReason("");
    }
  };

  // ----- Render -----
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b88a44" />
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Personal Information</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Text style={styles.title}>Edit Personal Info</Text>

          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="#888"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#888"
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#888"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            editable={false}
          />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("ChangePasswordScreen")}
          >
            <Text style={styles.secondaryButtonText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
            <Text style={styles.buttonText}>
              {saving ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>

          {/* Delete Account Section */}
          <View style={styles.deleteSection}>
            <Text style={styles.deleteTitle}>Account Actions</Text>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={initiateDeleteAccount}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
            <Text style={styles.deleteWarning}>
              This will permanently delete your account and all associated data. This action cannot be undone.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={48} color="#ef4444" />
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to delete your account? This will permanently remove:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bullet}>• Your personal information</Text>
              <Text style={styles.bullet}>• Your ride history</Text>
              <Text style={styles.bullet}>• All saved preferences</Text>
            </View>
            <Text style={styles.modalWarning}>
              This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={handleDeleteConfirmation}
              >
                <Text style={styles.deleteModalButtonText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reauthentication Modal */}
      <Modal
        visible={showReauthModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="lock-closed" size={48} color="#b88a44" />
            <Text style={styles.modalTitle}>Verify Your Identity</Text>
            <Text style={styles.modalText}>
              For security, please enter your password to continue with account deletion.
            </Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#888"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowReauthModal(false);
                  setPassword("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleReauthenticate}
                disabled={!password}
              >
                <Text style={styles.confirmButtonText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reason Selection Modal */}
      <Modal
        visible={showReasonModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.reasonModal]}>
            <Text style={styles.modalTitle}>Help Us Improve</Text>
            <Text style={styles.modalText}>
              Please tell us why you're deleting your account:
            </Text>
            <ScrollView style={styles.reasonsList}>
              {deleteReasons.map((reason, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.reasonItem}
                  onPress={() => handleFinalDelete(reason)}
                  disabled={isDeleting}
                >
                  <Text style={styles.reasonText}>{reason}</Text>
                  {isDeleting && <ActivityIndicator size="small" color="#b88a44" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowReasonModal(false);
                setDeleteReason("");
              }}
              disabled={isDeleting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const BG = "#0f1115";
const CARD = "#1c1e23";
const GOLD = "#b88a44";
const TEXT = "#ffffff";
const BORDER = "#2c2f35";
const DANGER = "#ef4444";

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: BG,
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
    borderBottomColor: BORDER,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: GOLD,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  form: {
    backgroundColor: CARD,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: BORDER,
  },
  title: {
    color: GOLD,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#2c2f35",
    color: TEXT,
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
    fontSize: 16,
  },
  disabledInput: { opacity: 0.5 },

  button: {
    backgroundColor: GOLD,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#444",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },

  // Delete Account Section
  deleteSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  deleteTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: DANGER,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  deleteButtonText: {
    color: DANGER,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  deleteWarning: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  reasonModal: {
    maxHeight: "80%",
  },
  modalTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  modalText: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  modalWarning: {
    color: DANGER,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 12,
  },
  bulletList: {
    alignSelf: "stretch",
    marginVertical: 12,
  },
  bullet: {
    color: "#ccc",
    fontSize: 14,
    marginBottom: 6,
  },
  passwordInput: {
    backgroundColor: "#2c2f35",
    color: TEXT,
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    width: "100%",
    marginVertical: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: "#444",
  },
  cancelButtonText: {
    color: TEXT,
    fontWeight: "600",
    fontSize: 16,
  },
  deleteModalButton: {
    backgroundColor: DANGER,
  },
  deleteModalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: GOLD,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  // Reasons List
  reasonsList: {
    width: "100%",
    maxHeight: 200,
    marginVertical: 16,
  },
  reasonItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2c2f35",
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  reasonText: {
    color: TEXT,
    fontSize: 14,
    flex: 1,
  },
});