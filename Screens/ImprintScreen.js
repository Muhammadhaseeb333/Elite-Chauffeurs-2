import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Dimensions, ScrollView } from "react-native";

const { width } = Dimensions.get("window");

export default function ImprintScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Imprint Heading */}
        <Text style={styles.heading}>Imprint</Text>

        {/* Company Details */}
        <View style={styles.box}>
          <Text style={styles.subHeading}>Company Information</Text>
          <Text style={styles.text}>Elite Chauffeurs Ltd.</Text>
          <Text style={styles.text}>32 Hawthorn Avenue, Kilcarbery Grange.Dublin 22</Text>
          <Text style={styles.text}>Leinster D22 F9C9, Ireland</Text>
          
          <Text style={styles.text}>Company Registration: 721994</Text>
        </View>

        {/* Contact Details */}
        <View style={styles.box}>
          <Text style={styles.subHeading}>Contact Information</Text>
          <Text style={styles.text}>Phone: +353 86 809 5524</Text>
          <Text style={styles.text}>Email: info@elitechauffeurs.ie</Text>
          <Text style={styles.text}>Website: www.elitechauffeurs.ie</Text>
        </View>

        {/* Legal Disclaimer */}
        <View style={styles.box}>
          <Text style={styles.subHeading}>Legal Disclaimer</Text>
          <Text style={styles.text}>
            The content of this app has been created with great care. However, we do not guarantee the accuracy, completeness, or timeliness of the information.
          </Text>
          <Text style={styles.text}>
            We are not responsible for any external links leading to third-party content. The respective provider is solely responsible for the linked content.
          </Text>
        </View>

        {/* Copyright Notice */}
        <View style={styles.box}>
          <Text style={styles.subHeading}>Copyright</Text>
          <Text style={styles.text}>
            All content and materials in this app are protected by copyright. Unauthorized use or reproduction is not permitted.
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
