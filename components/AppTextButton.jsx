import React from "react";
import { StyleSheet, TouchableOpacity, Text } from "react-native";

// Custom Components
import { COLORS } from "../variables/color";

const AppTextButton = ({ title, style, textStyle, onPress, disabled }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, style]}
      disabled={disabled}
    >
      <Text
        style={[
          styles.text,
          { color: disabled ? COLORS.button.disabled : COLORS.button.active },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
  },
});

export default AppTextButton;
