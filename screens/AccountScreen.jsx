import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";

// Custom Components & Constants
import { COLORS } from "../variables/color";
import Option from "../components/Option";
import AppButton from "../components/AppButton";
import authStorage from "../app/auth/authStorage";
import FlashNotification from "../components/FlashNotification";
import { useStateValue } from "../StateProvider";
import { __, getAccountOptionsData } from "../language/stringPicker";
import { routes } from "../navigation/routes";
import api, { removeAuthToken, setAuthToken } from "../api/client";
import { FontAwesome } from "@expo/vector-icons";

const { height: screenHeight, width: screenWidth } = Dimensions.get("screen");
const AccountScreen = ({ navigation }) => {
  const [{ user, appSettings, rtl_support, auth_token, push_token }, dispatch] =
    useStateValue();
  const [flashNotification, setFlashNotification] = useState(false);
  const [options, setOptions] = useState(
    getAccountOptionsData(appSettings.lng)
  );

  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setOptions(getAccountOptionsData(appSettings.lng));
  }, [appSettings.lng]);

  const handleLogout = () => {
    setLoggingOut(true);
    if (user) {
      setAuthToken(auth_token);
    }
    api
      .post("logout", { push_token: push_token })
      .then((res) => {
        dispatch({
          type: "SET_AUTH_DATA",
          data: {
            user: null,
            auth_token: null,
          },
        });
        authStorage.removeUser();
        // if (res?.ok) {
        //   dispatch({
        //     type: "SET_AUTH_DATA",
        //     data: {
        //       user: null,
        //       auth_token: null,
        //     },
        //   });
        //   authStorage.removeUser();
        // } else {
        //   Alert.alert(
        //     "Logout failed!",
        //     res?.data?.error_message || res?.data?.error || res?.problem,
        //     [{ text: "Ok" }]
        //   );
        // }
      })
      .then(() => {
        removeAuthToken(), setLoggingOut(false);
      });
  };

  // external event on mount
  useEffect(() => {
    dispatch({
      type: "SET_NEW_LISTING_SCREEN",
      newListingScreen: false,
    });
    // dispatch({
    //   type: "SET_SBCOLOR",
    //   sBColor: COLORS.accountSB_bg,
    // });
    // return () => {
    //   dispatch({
    //     type: "SET_SBCOLOR",
    //     sBColor: COLORS.primary,
    //   });
    // };
  }, []);

  const getUsername = () => {
    if (!!user.first_name || !!user.last_name) {
      return [user.first_name, user.last_name].join(" ");
    } else {
      return user.username;
    }
  };
  const getUserAddress = () => {
    if (user?.address || user?.locations?.length) {
      return user.address || user.locations.map((_ul) => _ul.name).join(", ");
    } else {
      return null;
    }
  };

  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  return (
    <View style={styles.container}>
      {/* Screen Header */}
      <View
        style={[
          styles.screenHeader,
          {
            // top: user ? -30 : 0,
            height: user ? screenHeight * 0.2 - 30 : screenHeight * 0.2,
            overflow: "hidden",
          },
        ]}
      >
        <View style={styles.headerImageWrap}>
          <Image
            source={require("../assets/account_header.png")}
            style={styles.accountHeaderImage}
          />
        </View>
        {!user && (
          <View style={styles.headerLogoWrap}>
            <Image
              source={require("../assets/account_logo.png")}
              style={styles.accountLogoImage}
            />
          </View>
        )}
        {/* UserName Component */}
        {user && (
          <View
            style={[
              styles.userContainer,
              rtl_support ? { right: "3%" } : { left: "3%" },
              rtlView,
              { bottom: user ? "10%" : "5%" },
            ]}
          >
            <View style={styles.userImageWrap}>
              {user?.pp_thumb_url ? (
                <Image
                  source={{ uri: user.pp_thumb_url }}
                  style={styles.userImage}
                />
              ) : (
                <FontAwesome name="user" size={24} color={COLORS.gray} />
              )}
            </View>
            <View style={styles.userInfoWrap}>
              <View style={styles.userNameContainer}>
                <Text style={[styles.userNameText, rtlTextA]}>
                  {getUsername()}
                </Text>
              </View>
              {!!getUserAddress() && (
                <View style={styles.userAddressWrap}>
                  <Text style={[styles.userAddressText, rtlTextA]}>
                    {getUserAddress()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* User logged out component */}
      {!user && (
        <>
          <View style={styles.accountBgWrap}>
            <Image
              source={require("../assets/account_bg.png")}
              style={styles.accountBgImage}
            />
          </View>

          <View style={styles.loginNoticeWrap}>
            <Text style={styles.loginNotice}>
              {__("accountScreenTexts.loginNotice", appSettings.lng)}
            </Text>
          </View>
          <View style={styles.loginWrap}>
            <AppButton
              title={__("accountScreenTexts.loginButtonText", appSettings.lng)}
              style={styles.loginButton}
              onPress={() => navigation.navigate(routes.loginScreen)}
              textStyle={rtlText}
            />
          </View>
        </>
      )}
      {/* Account Options Flatlist */}

      {user && (
        <View style={styles.optionsContainer}>
          <ScrollView>
            {options.map((item, index) => (
              <Option
                key={item.id}
                title={item.title}
                onPress={() => navigation.navigate(item.routeName)}
                uri={item.assetUri}
                item={item}
              />
            ))}
            {user && (
              <View style={styles.logOutWrap}>
                <Option
                  title={__(
                    "accountScreenTexts.logOutButtonText",
                    appSettings.lng
                  )}
                  icon="power-off"
                  onPress={() => handleLogout()}
                  uri={require("../assets/log_out.png")}
                  item={{
                    id: "log_out",
                  }}
                />
              </View>
            )}
          </ScrollView>
        </View>
      )}
      {/* Flash Notification */}
      <FlashNotification
        falshShow={flashNotification}
        flashMessage={__("accountScreenTexts.successMessage", appSettings.lng)}
      />
      <Modal animationType="slide" transparent={true} visible={loggingOut}>
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.black,
            opacity: 0.3,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  accountBgImage: {
    resizeMode: "contain",
    height: "70%",
  },
  accountBgWrap: {
    height: screenHeight * 0.28,
    alignItems: "center",
    justifyContent: "center",
  },
  accountHeaderImage: {
    // height: screenHeight * 0.15,
    width: screenWidth,
    resizeMode: "contain",
  },
  accountLogoImage: {
    height: "100%",
    resizeMode: "contain",
    width: "100%",
  },
  container: {
    backgroundColor: COLORS.bg_light,
    flex: 1,
  },
  headerImageWrap: {},
  headerLogoWrap: {
    width: "30%",
    height: screenHeight * 0.08,
    position: "absolute",
    top: "45%",
    left: "50%",
    transform: [{ translateX: -(screenWidth * 0.3) / 2 }],
  },
  headerMain: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  headerWrap: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: "3%",
    flexDirection: "row",
    height: 50,
    alignItems: "center",
    justifyContent: "space-between",
  },
  loginButton: {
    paddingVertical: 10,
    borderRadius: 3,
  },
  loginNotice: {
    fontWeight: "bold",
    fontSize: 18,
  },
  loginNoticeWrap: {
    alignItems: "center",
    paddingHorizontal: screenWidth * 0.03,
  },
  loginWrap: {
    flexDirection: "row",
    paddingHorizontal: "3%",
    marginVertical: 40,
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  logOutWrap: {
    paddingBottom: 50,
  },
  optionsContainer: {
    flex: 1,
  },
  screenHeader: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accountSB_bg,
  },
  userAddressText: {
    fontSize: 14,
    color: COLORS.text_gray,
    paddingHorizontal: 15,
  },
  userContainer: {
    position: "absolute",

    flexDirection: "row",
    alignItems: "center",
  },
  userImage: {
    height: "100%",
    width: "100%",
    resizeMode: "contain",
  },
  userImageWrap: {
    height: screenHeight * 0.08,
    width: screenHeight * 0.08,
    borderRadius: screenHeight * 0.04,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  userNameContainer: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  userNameText: {
    fontSize: 20,
    color: COLORS.text_dark,
    fontWeight: "bold",
  },
});

export default AccountScreen;
