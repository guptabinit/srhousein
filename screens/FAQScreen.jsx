import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

// Custom Components & Functions
import { getFAQ } from "../language/stringPicker";
import FAQ from "../components/FAQ";
import { useStateValue } from "../StateProvider";
import { COLORS } from "../variables/color";

const FAQScreen = () => {
  const [{ appSettings }] = useStateValue();
  const [faqData, setFaqData] = useState(getFAQ(appSettings.lng));
  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.mainWrap}>
          <View style={styles.contentWrap}>
            {faqData.map((item, index) => (
              <FAQ
                key={`${index}`}
                isLast={index < faqData.length - 1 ? false : true}
                item={item}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  contentWrap: {
    borderWidth: 1,
    borderColor: COLORS.bg_dark,
    borderRadius: 5,
    backgroundColor: COLORS.bg_light,
    paddingVertical: 15,
    elevation: 5,
    shadowColor: COLORS.gray,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: {
      height: 5,
      width: 3,
    },
  },
  mainWrap: {
    paddingHorizontal: "3%",
    paddingVertical: 20,
    width: "100%",
  },
});

export default FAQScreen;
