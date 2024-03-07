import React from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";

// Vector Fonts
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";

//  Custom Components & Variables
import { COLORS } from "../variables/color";
import { useNavigation } from "@react-navigation/native";

const headerLogoURL = require("../assets/logo_header.png");

const TabScreenHeader = ({
  right,
  onRightClick,
  style,
  left,
  onLeftClick,
  rightIcon,
  sideBar,
}) => {
  const navigation = useNavigation();
  return (
    <View style={[styles.container, style]}>
      <Image
        resizeMode="contain"
        source={headerLogoURL}
        style={{ height: 40, width: 160, resizeMode: "contain" }}
      />
      {right && (
        <TouchableOpacity style={styles.headerRight} onPress={onRightClick}>
          <FontAwesome name={rightIcon} size={20} color={COLORS.white} />
        </TouchableOpacity>
      )}
      {left && !sideBar && (
        <TouchableOpacity style={styles.headerLeft} onPress={onLeftClick}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}
      {sideBar && (
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => navigation.openDrawer()}
        >
          <MaterialIcons name="menu" size={24} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerLeft: {
    position: "absolute",
    left: "2%",
  },
  headerRight: {
    position: "absolute",
    right: "6%",
  },
});

export default TabScreenHeader;
