import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { COLORS } from "../variables/color";
import { __ } from "../language/stringPicker";
import { useStateValue } from "../StateProvider";

const HiddenListingCard = ({ item, onUnBlock }) => {
  const [{ appSettings, rtl_support }] = useStateValue();

  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const onUnHide = () => {
    onUnBlock(item.id);
  };
  return (
    <View style={styles.container}>
      <View style={styles.titleWrap}>
        <Text style={[styles.title, rtlText]}>{item.title}</Text>
      </View>
      <View style={styles.btnWrap}>
        <Pressable style={styles.btn} onPress={onUnHide}>
          <Text style={[styles.btnTitle, rtlText]}>
            {__("hiddenListingsTexts.unBlockListingBtnTitle", appSettings.lng)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor: COLORS.button.active,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnTitle: {
    fontWeight: "bold",
    color: COLORS.white,
  },
  btnWrap: {
    marginBottom: 10,
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
  },
  titleWrap: {
    paddingVertical: 10,
    alignItems: "center",
  },
  container: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.bg_dark,
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 5,
    elevation: 3,
    paddingHorizontal: "3%",
    marginHorizontal: "3%",
    shadowColor: COLORS.black,
    shadowRadius: 3,
    shadowOpacity: 0.2,
    shadowOffset: {
      height: 2,
      width: 2,
    },
  },
});

export default HiddenListingCard;
