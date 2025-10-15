import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "@/config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth"; // Import signOut function
import { Platform } from "react-native";

function ProfileOption({ icon, text, onPress }) {
  return (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <Ionicons name={icon} size={22} color="#b88a44" />
      <Text style={styles.optionText}>{text}</Text>
      <Ionicons name="chevron-forward-outline" size={20} color="#666" style={{ marginLeft: "auto" }} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "customers", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#b88a44" />
      </View>
    );
  }

  const avatarLetter =
    userData?.firstName?.[0]?.toUpperCase() || userData?.email?.[0]?.toUpperCase() || "U";
  const fullName = `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim();

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign the user out
      navigation.navigate("Auth"); // Redirect to login screen after signing out
    } catch (error) {
      console.log("Error during logout:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <Text style={styles.username}>{fullName || "User"}</Text>
          <Text style={styles.email}>{userData?.email || "user@email.com"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <ProfileOption
            icon="create-outline"
            text="Edit Profile"
            onPress={() => navigation.navigate("PersonalInfoScreen")}
          />
           <ProfileOption
        icon="car-outline"
        text="Our Fleet"
        onPress={() => navigation.navigate('FleetScreen')}
      />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <ProfileOption icon="chatbubbles-outline" text="Feedback" onPress={() => navigation.navigate("FeedbackScreen")} />
          <ProfileOption icon="information-circle-outline" text="About Us" onPress={() => navigation.navigate('AboutScreen')} />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1115",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
    marginTop: Platform.OS === "ios" ? 40 : 30,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1c1e23",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    color: "#b88a44",
    fontSize: 36,
    fontWeight: "700",
  },
  username: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  email: {
    color: "#aaa",
    fontSize: 14,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: "#b88a44",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1e23",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  optionText: {
    color: "#fff",
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#b88a44",
    paddingVertical: 14,
    borderRadius: 15,
    marginTop: 20,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
});
