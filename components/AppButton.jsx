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
import { useStateValue } from "../StateProvider";

const AppButton = ({ title, style, textStyle, onPress, disabled, loading }) => {
  const [{ rtl_support }] = useStateValue();
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  return (
    <TouchableOpacity
      disabled={loading || disabled}
      onPress={onPress}
      style={[
        disabled || loading ? styles.buttonDisabled : styles.button,
        style,
      ]}
    >
      {!loading && (
        <Text style={[styles.text, textStyle, rtlText]} numberOfLines={1}>
          {title}
        </Text>
      )}
      {loading && (
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

export default AppButton;
