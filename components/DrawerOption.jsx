import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useStateValue } from "../StateProvider";
import { COLORS } from "../variables/color";

const DrawerOption = ({ onPress, uri, title }) => {
  const [{ rtl_support }] = useStateValue();
  const rtlText = rtl_support && {
    writingDirection: "rtl",
    paddingEnd: 10,
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress}>
        <View style={styles.option}>
          {uri && (
            <View
              style={{
                height: 20,
                width: 20,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <Image
                source={uri}
                style={{
                  height: "100%",
                  width: "100%",
                  resizeMode: "contain",
                }}
              />
            </View>
          )}
          <View
            style={{
              flex: 1,
              height: "100%",
            }}
          >
            <Text style={[styles.optionTitle, rtlText]}>{title}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  option: {
    flexDirection: "row",
    paddingVertical: 10,
    marginHorizontal: 3,
    // paddingHorizontal: "2.3%",
    alignItems: "center",
  },
  optionTitle: {
    fontWeight: "bold",
    color: COLORS.text_gray,
    paddingLeft: 10,
    fontSize: 15,
  },
});

export default DrawerOption;
