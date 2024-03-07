import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
} from "react-native";

// Custom Components
import { COLORS } from "../variables/color";

const AppIconButton = ({
  title,
  style,
  textStyle,
  onPress,
  disabled,
  loading,
}) => {
  return (
    <TouchableOpacity
      disabled={loading || disabled}
      onPress={onPress}
      style={[
        disabled || loading ? styles.buttonDisabled : styles.button,
        style,
      ]}
    >
      {!loading ? (
        <View style={styles.view}>
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </View>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={COLORS.white} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    display: "flex",
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    padding: 10,
    backgroundColor: COLORS.button.active,
  },
  buttonDisabled: {
    display: "flex",
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    width: "100%",
    backgroundColor: COLORS.button.disabled,
  },
  loading: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.8,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    flex: 1,
    height: 23,
  },
  text: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "bold",
  },
});

export default AppIconButton;
