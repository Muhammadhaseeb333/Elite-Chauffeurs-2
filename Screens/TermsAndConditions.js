import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function TermsAndConditions() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Heading */}
        <Text style={styles.heading}>Terms & Conditions</Text>

        {/* Section 1 */}
        <View style={styles.box}>
          <Text style={styles.subHeading}>1. Introduction</Text>
          <Text style={styles.text}>
            By using our services, you agree to comply with these terms and conditions.
          </Text>
        </View>

        {/* Section 2 */}
        <View style={styles.box}>
          <Text style={styles.subHeading}>2. User Responsibilities</Text>
          <Text style={styles.text}>
            You must provide accurate information and follow applicable laws while using our service.
          </Text>
        </View>

        {/* Section 3 */}
        <View style={styles.box}>
          <Text style={styles.subHeading}>3. Privacy Policy</Text>
          <Text style={styles.text}>
            Your data will be handled according to our Privacy Policy.
          </Text>
        </View>

        {/* Section 4 */}
        <View style={styles.box}>
          <Text style={styles.subHeading}>4. Changes to Terms</Text>
          <Text style={styles.text}>
            We reserve the right to update these terms at any time.
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
  },
});
