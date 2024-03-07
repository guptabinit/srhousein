import React, { useState, useEffect } from "react";
import { StyleSheet, SafeAreaView, View, Text, StatusBar } from "react-native";

// Expo Libraries
import Constants from "expo-constants";

// External Libraries
import { useNetInfo } from "@react-native-community/netinfo";

// Custom Components & Constants
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";

const Screen = ({ children, style }) => {
  const [{ appSettings, ios, sBColor }, dispatch] = useStateValue();
  const [initial, setInitial] = useState(true);
  const netInfo = useNetInfo();

  useEffect(() => {
    if (initial && !netInfo.isInternetReachable) {
      setInitial(false);
    } else {
      if (netInfo.isInternetReachable) {
        dispatch({
          type: "IS_CONNECTED",
          is_connected: true,
        });
      } else {
        dispatch({
          type: "IS_CONNECTED",
          is_connected: false,
        });
      }
    }
  }, [netInfo]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: sBColor }, style]}>
      {netInfo.isInternetReachable === false && netInfo.type !== "unknown" && (
        <View
          style={{
            backgroundColor: COLORS.red,
            position: "absolute",
            top: ios ? Constants.statusBarHeight : 0,
            left: 0,
            elevation: 1,
            right: 0,
            alignItems: "center",
            justifyContent: "center",
            padding: 8,
            zIndex: 10,
          }}
        >
          <Text style={{ color: COLORS.white }} numberOfLines={1}>
            {__("screenTexts.noInternetText", appSettings.lng)}
          </Text>
        </View>
      )}

      <View style={[styles.view, style]}>{children}</View>
      <StatusBar
        style="light"
        animated={true}
        backgroundColor={sBColor}
        barStyle="light-content"
        showHideTransition="slide"
        hidden={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    display: "flex",
  },
  view: {
    flex: 1,
    display: "flex",
  },
});

export default Screen;
