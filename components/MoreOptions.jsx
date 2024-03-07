import React from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useStateValue } from "../StateProvider";

// Custom Components & Constants
import { COLORS } from "../variables/color";

const MoreOptions = ({ title, detail, routeName }) => {
  const navigation = useNavigation();
  const [{ rtl_support, ios }] = useStateValue();

  const rtlText = rtl_support && {
    writingDirection: "rtl",
    textAlign: ios ? "justify" : "right",
  };
  return (
    <TouchableWithoutFeedback onPress={() => navigation.navigate(routeName)}>
      <View style={styles.container}>
        <View style={styles.right}>
          <Text style={[styles.title, rtlText]}>{title}</Text>
          <Text style={[styles.detail, rtlText]} numberOfLines={3}>
            {detail}
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: "3%",
  },
  detail: {
    fontSize: 14,
    color: COLORS.text_gray,
    textAlign: "justify",
    lineHeight: 22,
  },
  image: {
    height: 40,
    width: 40,
    resizeMode: "cover",
  },
  imageWrap: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    color: "#4D4B4B",
    fontWeight: "bold",
    marginBottom: 5,
  },
  right: {
    flex: 1,
  },
  separator: {
    backgroundColor: COLORS.bg_dark,
    width: "100%",
  },
});

export default MoreOptions;
