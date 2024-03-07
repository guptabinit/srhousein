import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  Linking,
} from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { COLORS } from "../variables/color";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getDrawerAccountOptionsData,
  getDrawerSupportOptionsData,
  __,
} from "../language/stringPicker";
import { useStateValue } from "../StateProvider";
import DrawerOption from "../components/DrawerOption";

const { width: wWidth } = Dimensions.get("window");
const DrawerScreen = (props) => {
  const [{ appSettings, user }] = useStateValue();
  const [accountOptions, setAccountOptions] = useState(
    getDrawerAccountOptionsData(appSettings.lng)
  );
  const [supportOptions, setSupportOptions] = useState(
    getDrawerSupportOptionsData(appSettings.lng)
  );

  useEffect(() => {
    setAccountOptions(getDrawerAccountOptionsData(appSettings.lng));
    setSupportOptions(getDrawerSupportOptionsData(appSettings.lng));
  }, [appSettings.lng]);

  //   const rtlText = rtl_support && {
  //     writingDirection: "rtl",
  //     paddingEnd: 10,
  //   };
  //   const rtlView = rtl_support && {
  //     flexDirection: "row-reverse",
  //   };

  const handleExternalLinkPress = () => {
    const externalUrl = __("drawerScreenTexts.link", appSettings.lng);
    if (!externalUrl) {
      return;
    }
    Linking.openURL(externalUrl);
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.white,
            // paddingBottom: 50,
            marginTop: -4,
          }}
        >
          <View style={styles.headerSectionWrap}>
            <View style={styles.closeBtnWrap}>
              <TouchableWithoutFeedback
                onPress={() => props.navigation.closeDrawer()}
              >
                <MaterialCommunityIcons
                  name="close-thick"
                  size={24}
                  color={COLORS.white}
                />
              </TouchableWithoutFeedback>
            </View>
            <View style={styles.headerBgWrap}>
              <Image
                source={require("../assets/drawer_header.png")}
                style={styles.headerBg}
              />
            </View>
          </View>
          <View style={styles.drawerContentWrap}>
            <View style={styles.accountSectionWrap}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>
                  {__("drawerScreenTexts.accountTitle", appSettings.lng)}
                </Text>
              </View>
              <View style={styles.sectionBottom} />
              <View style={styles.sectionContentWrap}>
                {accountOptions.map((_option) => (
                  <DrawerOption
                    key={`${_option.id}`}
                    uri={_option.assetUri}
                    title={_option.title}
                    onPress={() => props.navigation.navigate(_option.routeName)}
                  />
                ))}
              </View>
            </View>
            <View style={styles.legalSectionWrap}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>
                  {__("drawerScreenTexts.supportTitle", appSettings.lng)}
                </Text>
              </View>
              <View style={styles.sectionBottom} />
              <View style={styles.sectionContentWrap}>
                {supportOptions.map((_option) => (
                  <DrawerOption
                    key={`${_option.id}`}
                    uri={_option.assetUri}
                    title={_option.title}
                    onPress={() => props.navigation.navigate(_option.routeName)}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </DrawerContentScrollView>
      <View style={styles.footerSectionWrap}>
        <View style={styles.footerContentWrap}>
          <Text style={styles.copyrightText}>
            {__("drawerScreenTexts.copyrightText", appSettings.lng)}{" "}
            <Text style={styles.link} onPress={handleExternalLinkPress}>
              {__("drawerScreenTexts.linkText", appSettings.lng)}
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  closeBtnWrap: {
    position: "absolute",
    top: "6%",
    left: "3%",
    zIndex: 1,
  },
  container: { flex: 1 },
  copyrightText: {
    color: COLORS.gray,
  },
  drawerContentWrap: {
    paddingHorizontal: "3%",
  },
  footerSectionWrap: {
    paddingHorizontal: "3%",
    position: "absolute",
    bottom: 0,
    paddingBottom: 15,
  },
  headerBg: {
    width: "100%",
    resizeMode: "contain",
    // height: wWidth * 0.35,
  },
  headerBgWrap: {
    width: "100%",
    backgroundColor: COLORS.primary,
    height: wWidth * 0.35,
    overflow: "hidden",
    alignItems: "center",
    // justifyContent: "center",
  },
  link: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  sectionBottom: {
    height: 1,
    backgroundColor: COLORS.border_light,
    marginVertical: 10,
  },
  sectionTitleWrap: {
    paddingTop: 20,
  },
});

export default DrawerScreen;
