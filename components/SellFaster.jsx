/* eslint-disable no-undef */
import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useStateValue } from "../StateProvider";

// Custom Components & Constants
import { COLORS } from "../variables/color";

const SellFaster = ({ title, detail, uri }) => {
  const [{ rtl_support }] = useStateValue();

  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  return (
    <View style={styles.container}>
      <Image source={uri} style={styles.image} />
      <Text style={[styles.title, rtlText]}>{title}</Text>
      <Text style={[styles.detail, rtlText]}>{detail}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 5,
    padding: 10,
    justifyContent: "center",
    backgroundColor: COLORS.bg_light,
    borderRadius: 5,
    width: "100%",

    borderWidth: 1,
    borderColor: COLORS.bg_dark,
  },
  detail: {
    color: COLORS.text_gray,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  image: {
    height: 100,
    width: 100,
    resizeMode: "contain",
  },
  title: {
    marginVertical: 15,
    fontSize: 20,
    textAlign: "center",
    color: COLORS.text_medium,
  },
});

export default SellFaster;
