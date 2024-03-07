import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useStateValue } from "../StateProvider";

// Vector Icons
import { FontAwesome5 } from "@expo/vector-icons";

// Custom Components
import { COLORS } from "../variables/color";
import AppSeparator from "./AppSeparator";

const FAQ = ({ isLast, item }) => {
  const [{ rtl_support, ios }] = useStateValue();
  const [faqToggle, setFaqToggle] = useState(false);

  const rtlText = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };
  return (
    <TouchableWithoutFeedback onPress={() => setFaqToggle(!faqToggle)}>
      <View style={styles.container}>
        <View style={[styles.faqHeader, rtlView]}>
          <View style={styles.questionWrap}>
            <Text
              style={[
                faqToggle ? styles.question : styles.questionTruncated,
                rtlText,
              ]}
            >
              {item.question}
            </Text>
          </View>
          <FontAwesome5
            name={faqToggle ? "chevron-up" : "chevron-down"}
            size={16}
            color={faqToggle ? COLORS.primary : COLORS.text_gray}
          />
        </View>
        <View style={styles.faqData}>
          <Text
            style={[
              styles.answer,
              { display: faqToggle ? "flex" : "none" },
              rtlText,
            ]}
          >
            {item.answer}
          </Text>
        </View>
        {isLast === false && (
          <AppSeparator style={{ width: "100%", marginVertical: 15 }} />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  answer: {
    marginTop: 10,
    color: COLORS.text_gray,
    textAlign: "justify",
    fontSize: 14,
    lineHeight: 22,
  },

  faqData: { paddingHorizontal: 15 },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  question: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  questionTruncated: {
    color: "#4D4B4B",
    fontWeight: "bold",
  },
  questionWrap: {
    flex: 1,
  },
});

export default FAQ;
