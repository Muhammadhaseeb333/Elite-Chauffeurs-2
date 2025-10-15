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
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "@/config/firebaseConfig";
import { 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
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
  const [showDOBPicker, setShowDOBPicker] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [phone, setPhone]         = useState("");
  const [dob, setDob]             = useState(""); // "YYYY-MM-DD"
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

  // ----- Utils -----
  const toYMD = (dateLike) => {
    const d = new Date(dateLike);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  };

  const prettyDate = (ymd) => {
    if (!ymd) return "";
    const d = new Date(ymd);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const weekdayOf = (ymd) => {
    const d = new Date(ymd);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, { weekday: "long" });
  };

  const calcAge = (ymd) => {
    const d = new Date(ymd);
    if (isNaN(d)) return null;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  };

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

            // Backwards-compatible birthday read
            let resolvedDob = "";
            if (data.birthdayAt && typeof data.birthdayAt.toDate === "function") {
              resolvedDob = toYMD(data.birthdayAt.toDate());
            } else if (data.birthday) {
              resolvedDob = data.birthday;
            } else if (data.dob) {
              resolvedDob = data.dob;
            }
            setDob(resolvedDob);

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
        dob: dob || "",
        birthday: dob || "",
        updatedAt: serverTimestamp(),
      };

      if (dob) {
        const d = new Date(dob);
        if (!isNaN(d.getTime())) {
          updatePayload.birthdayAt = d; // stored as Timestamp in Firestore
        }
      } else {
        updatePayload.birthdayAt = null;
      }

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

  const age = calcAge(dob);
  const hasDob = Boolean(dob);

  return (
    <SafeAreaView style={styles.container}>
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

          {/* Birthday Card */}
          <View style={styles.bdayCard}>
            <View style={styles.bdayHeader}>
              <View style={styles.bdayIconWrap}>
                <Ionicons name="calendar-outline" size={18} color="#b88a44" />
              </View>
              <Text style={styles.bdayTitle}>Birthday</Text>

              <TouchableOpacity
                onPress={() => setShowDOBPicker(true)}
                style={styles.editPill}
              >
                <Ionicons name="create-outline" size={16} color="#0f1115" />
                <Text style={styles.editPillText}>{hasDob ? "Edit" : "Set"}</Text>
              </TouchableOpacity>
            </View>

            {hasDob ? (
              <>
                <Text style={styles.bdayBig}>{prettyDate(dob)}</Text>
                <View style={styles.chipsRow}>
                  {age !== null && (
                    <View style={styles.chip}>
                      <Ionicons name="gift-outline" size={14} color="#b88a44" />
                      <Text style={styles.chipText}>Age {age}</Text>
                    </View>
                  )}
                  <View style={styles.chip}>
                    <Ionicons name="calendar-number-outline" size={14} color="#b88a44" />
                    <Text style={styles.chipText}>{weekdayOf(dob)}</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.bdayHint}>
                Add your birthday to personalize your experience.
              </Text>
            )}
          </View>

          {showDOBPicker && (
            <DateTimePicker
              value={dob ? new Date(dob) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                if (Platform.OS !== "ios") setShowDOBPicker(false);
                if (selectedDate) {
                  setDob(toYMD(selectedDate));
                }
              }}
              onTouchCancel={() => setShowDOBPicker(false)}
            />
          )}

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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
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

  // Birthday card
  bdayCard: {
    backgroundColor: "#171a22",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 15,
  },
  bdayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bdayIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(184,138,68,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  bdayTitle: {
    color: TEXT,
    fontWeight: "700",
    fontSize: 14,
  },
  editPill: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GOLD,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  editPillText: {
    color: "#0f1115",
    fontWeight: "800",
    fontSize: 12,
    marginLeft: 6,
  },
  bdayBig: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  bdayHint: {
    color: "#b6b6b6",
    fontSize: 13,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#1f2330",
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "700",
  },

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