import React from "react";
import {
  StyleSheet,
  Pressable,
  Text,
  ActivityIndicator,
  View,
} from "react-native";

// Custom Components
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";

const SmallButton = ({
  title,
  style,
  textStyle,
  onPress,
  disabled,
  loading,
}) => {
  const [{ rtl_support }] = useStateValue();
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  return (
    <Pressable
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
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.button.active,
  },
  buttonDisabled: {
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
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

export default SmallButton;
