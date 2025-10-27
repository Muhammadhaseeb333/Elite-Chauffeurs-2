import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

// Enable layout animation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const faqs = [
  {
    question: "What services does Elite Chauffeurs provide in Ireland?",
    answer:
      "We provide airport transfers, corporate travel, weddings, golf tours, and custom private chauffeur services across Ireland.",
  },
  {
    question: "Are your chauffeurs professionally trained?",
    answer:
      "Yes. All of our chauffeurs are fully licensed, experienced, and trained in customer service to ensure a safe and luxurious experience.",
  },
  {
    question: "Do you offer airport transfers from Dublin Airport?",
    answer:
      "Absolutely. We provide 24/7 chauffeur-driven transfers to and from Dublin Airport with meet & greet services included.",
  },
  {
    question: "What vehicles are available in your fleet?",
    answer:
      "Our fleet includes Mercedes-Benz S-Class, V-Class, Sprinters, and luxury sedans and SUVs, all maintained to the highest standards.",
  },
  {
    question: "Can I book for special events such as weddings or tours?",
    answer:
      "Yes, we specialize in weddings, golf tours, and special events. Our team can tailor packages to meet your requirements.",
  },
  {
    question: "How do I make a booking?",
    answer:
      "You can book directly through our app, website, or by contacting our customer service team.",
  },
  {
    question: "Do you provide chauffeur services outside Dublin?",
    answer:
      "Yes, we operate nationwide across Ireland, covering Cork, Limerick, Galway, Belfast, and all major cities and tourist destinations.",
  },
];

export default function FAQScreen() {
  const navigation = useNavigation();
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    LayoutAnimation.easeInEaseOut();
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#d4af37" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.card}>
            <TouchableOpacity
              style={styles.questionRow}
              onPress={() => toggleFAQ(index)}
            >
              <Text style={styles.question}>{faq.question}</Text>
              <Ionicons
                name={activeIndex === index ? "chevron-up" : "chevron-down"}
                size={20}
                color="#d4af37"
              />
            </TouchableOpacity>
            {activeIndex === index && (
              <View style={styles.answerBox}>
                <Text style={styles.answer}>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "black",
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
    borderBottomColor: "#333",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#d4af37",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#d4af37",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#1c1c1c",
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  questionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  question: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
  },
  answerBox: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#333",
    backgroundColor: "#2a2a2a",
  },
  answer: {
    color: "#ccc",
    fontSize: 15,
    lineHeight: 22,
  },
});