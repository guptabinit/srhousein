import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../variables/color";

const AppSeparator = ({ style }) => {
  return <View style={[styles.container, style]} />;
};

const styles = StyleSheet.create({
  container: {
    height: 1,
    width: "95%",
    backgroundColor: COLORS.border_light,
  },
});

export default AppSeparator;
