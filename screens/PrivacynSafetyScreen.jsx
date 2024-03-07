import { MaterialCommunityIcons, SimpleLineIcons } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { __ } from "../language/stringPicker";
import { routes } from "../navigation/routes";
import { useStateValue } from "../StateProvider";
import { COLORS } from "../variables/color";

const PrivacynSafetyScreen = ({ navigation }) => {
  const [{ user, auth_token, config, ios, appSettings, rtl_support }] =
    useStateValue();
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };
  const onHiddenListingsClick = () => {
    navigation.navigate(routes.hiddenListingsScreen);
  };
  const onBlockedUsersClick = () => {
    navigation.navigate(routes.blockedUsersScreen);
  };
  return (
    <View style={styles.container}>
      <View style={styles.optionWrapper}>
        <Pressable onPress={onHiddenListingsClick}>
          <View style={[styles.optionButtonWrap, rtlView]}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name="block-helper"
                size={18}
                color={COLORS.white}
              />
            </View>
            <View style={styles.btnTxtWrap}>
              <Text style={[styles.btnTxt, rtlText]}>
                {__("safetyScreenTexts.hiddenListingsBtn", appSettings.lng)}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
      <View style={styles.optionWrapper}>
        <Pressable onPress={onBlockedUsersClick}>
          <View style={[styles.optionButtonWrap, rtlView]}>
            <View style={styles.iconWrap}>
              <SimpleLineIcons
                name="user-unfollow"
                size={18}
                color={COLORS.white}
              />
            </View>
            <View style={styles.btnTxtWrap}>
              <Text style={[styles.btnTxt, rtlText]}>
                {__("safetyScreenTexts.blockedUsersBtn", appSettings.lng)}
              </Text>
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: "3%",
    paddingVertical: 10,
  },
  optionButtonWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: COLORS.button.active,
    justifyContent: "center",
    marginVertical: 10,
    borderRadius: 6,
  },
  btnTxtWrap: {
    paddingHorizontal: 5,
  },
  btnTxt: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default PrivacynSafetyScreen;
