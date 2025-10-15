import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Heading */}
        <Text style={styles.heading}>Privacy Policy</Text>

        {/* Intro */}
        <View style={styles.box}>
          <Text style={styles.text}>
            This Privacy Policy describes how we collect, use, and protect your personal information. 
            By using our services, you agree to the collection and use of information in accordance with this policy.
          </Text>
        </View>

        {/* Section 1 */}
        <View style={styles.box}>
          <Text style={styles.subHeading}>1. Information We Collect</Text>
          <Text style={styles.text}>
            We collect personal information that you provide to us, such as your name, email, and phone number. 
            Additionally, we may collect usage data and analytics.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.box}>
          <Text style={styles.subHeading}>2. How We Use Your Information</Text>
          <Text style={styles.text}>
            We use the collected information to improve our services, provide customer support, and 
            communicate with you about updates and offers.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={styles.box}>
          <Text style={styles.subHeading}>3. Data Security</Text>
          <Text style={styles.text}>
            We implement strong security measures to protect your personal data from unauthorized access or disclosure.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.box}>
          <Text style={styles.subHeading}>4. Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions about this Privacy Policy, please contact us at info@elitechauffers.ie.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: width * 0.07,
    color: "white",
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 20,
    textAlign: "center",
  },
  box: {
    backgroundColor: "#333",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  subHeading: {
    fontSize: width * 0.05,
    color: "white",
    fontWeight: "bold",
    marginBottom: 10,
  },
  text: {
    color: "white",
    fontSize: width * 0.04,
    marginBottom: 5,
    lineHeight: 22,
  },
});
