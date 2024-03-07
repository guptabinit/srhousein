import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  ActivityIndicator,
  Dimensions,
} from "react-native";

// Vector Icons
import {
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome,
  Fontisto,
} from "@expo/vector-icons";

// Custom Components & Functions
import AppSeparator from "../components/AppSeparator";
import { COLORS } from "../variables/color";
import authStorage from "../app/auth/authStorage";
import { useStateValue } from "../StateProvider";
import { getRelativeTimeConfig, __ } from "../language/stringPicker";
import settingsStorage from "../app/settings/settingsStorage";
import api, {
  removeAuthToken,
  setAuthToken,
  setCurrencyLocale,
  setLocale,
} from "../api/client";
import rtlSupoortedLng from "../language/rtlSupoortedLng.json";
import { listViewConfig } from "../app/services/listViewConfig";
import ListPicker from "../components/ListPicker";
import moment from "moment";
import "moment/locale/en-gb";
import { routes } from "../navigation/routes";
import { decodeString } from "../helper/helper";
import { admobConfig } from "../app/services/adMobConfig";
import AdmobBanner from "../components/AdmobBanner";
const languages = require("../language/languages.json");

const { height: windowHeight } = Dimensions.get("window");
const SettingsScreen = ({ navigation }) => {
  const [
    { user, appSettings, config, rtl_support, push_token, auth_token, ios },
    dispatch,
  ] = useStateValue();
  const [notification, setNotifiaction] = useState(appSettings.notifications);
  const [loggingOut, setLoggingOut] = useState(false);
  const [langArr, setLangArr] = useState([]);
  const [langloading, setLangLoading] = useState(true);
  const [langPicker, setLangPicker] = useState(false);
  const [currencyPicker, setCurrencyPicker] = useState(false);
  const [admobError, setAdmobError] = useState(false);

  useEffect(() => {
    if (Object.keys(languages).length > 1) {
      let tempLangArr = [];
      Object.keys(languages).map(
        (_key, ind) => (tempLangArr[ind] = { id: _key, name: languages[_key] })
      );
      setLangArr([...tempLangArr]);
      setLangLoading(false);
    }
  }, []);

  const handleLanguageChange = (language) => {
    if (appSettings.lng === language.id) {
      setLangPicker(false);
      return true;
    }
    setLoggingOut(true);
    setLocale(language.id);
    const tempSettings = {
      ...appSettings,
      lng: language.id,
    };

    dispatch({
      type: "SET_SETTINGS",
      appSettings: tempSettings,
    });

    if (!rtl_support) {
      if (rtlSupoortedLng.includes(language.id)) {
        dispatch({
          type: "SET_RTL_SUPPORT",
          rtl_support: true,
        });
      }
    } else {
      if (!rtlSupoortedLng.includes(language.id)) {
        dispatch({
          type: "SET_RTL_SUPPORT",
          rtl_support: false,
        });
      }
    }

    settingsStorage.storeAppSettings(JSON.stringify(tempSettings));
    const relativeTime = getRelativeTimeConfig(appSettings.lng);
    moment.updateLocale("en-gb", {
      relativeTime: relativeTime,
    });
    setLangPicker(false);
    setTimeout(() => {
      navigation.replace(routes.drawerNavigator);
    }, 1000);
  };
  const handleCurrencyChange = (currency) => {
    if (appSettings.dynamic_currency === currency.id) {
      setCurrencyPicker(false);
      return true;
    }
    setLoggingOut(true);
    setCurrencyLocale(currency.id);
    const tempSettings = {
      ...appSettings,
      dynamic_currency: currency.id,
    };

    dispatch({
      type: "SET_SETTINGS",
      appSettings: tempSettings,
    });
    settingsStorage.storeAppSettings(JSON.stringify(tempSettings));
    setCurrencyPicker(false);
    setTimeout(() => {
      navigation.replace(routes.drawerNavigator);
    }, 1500);
  };

  const toggleSwitch = (type) => {
    setLoggingOut(true);
    const temparr = notification?.includes(type)
      ? [...notification.filter((_noti) => _noti !== type)]
      : [...notification, type];
    setNotifiaction(temparr);

    const tempSettings = {
      ...appSettings,
      notifications: [...temparr],
    };

    dispatch({
      type: "SET_SETTINGS",
      appSettings: tempSettings,
    });
    settingsStorage.storeAppSettings(JSON.stringify(tempSettings));
    handlePushRegister(temparr);
  };

  const handlePushRegister = (data) => {
    if (user) {
      setAuthToken(auth_token);
    }
    let nCon = [];
    if (data?.length) {
      data.map((_item) => {
        if (config.pn_events.includes(_item)) {
          nCon.push(_item);
        }
      });
    }

    api
      .post("push-notification/register", {
        push_token: push_token,
        events: nCon,
      })
      .then((res) => {
        if (!res?.ok) {
          console.log(
            __("alerts.notificationRegistrationFail", appSettings.lng),
            res.data
          );
        }
      })
      .then(() => {
        if (user) {
          removeAuthToken();
        }
        setLoggingOut(false);
      });
  };

  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };

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
      })
      .then(() => {
        removeAuthToken();
        setLoggingOut(false);
      });
  };

  const toggleView = (val) => {
    setLoggingOut(true);

    const tempSettings = {
      ...appSettings,
      listView: !val,
    };
    dispatch({
      type: "SET_SETTINGS",
      appSettings: tempSettings,
    });
    settingsStorage.storeAppSettings(JSON.stringify(tempSettings));
    setTimeout(() => {
      setLoggingOut(false);
    }, 1000);
  };

  const getCurrencyName = () => {
    const temparr = config.multiCurrency.currencyList.filter(
      (cur) => cur.id === appSettings.dynamic_currency
    );
    return temparr.length
      ? temparr[0].id + "(" + decodeString(temparr[0].symbol) + ")"
      : "";
  };

  const onAdmobError = (error) => {
    setAdmobError(true);
  };

  return (
    <ScrollView style={styles.container}>
      <View
        style={{
          paddingBottom: admobConfig?.admobEnabled ? 115 : 30,
          minHeight: windowHeight - 100,
        }}
      >
        <View style={styles.contentWrapper}>
          {/* Language Setting */}
          {Object.keys(languages).length > 1 && (
            <View
              style={[
                styles.notiWrapper,
                {
                  flexDirection: rtl_support ? "row-reverse" : "row",
                  alignItems: "center",
                },
              ]}
            >
              <View style={styles.view}>
                <Ionicons name="language" size={20} color={COLORS.primary} />
              </View>
              <View
                style={{
                  flex: 1,
                  alignItems: rtl_support ? "flex-end" : "flex-start",
                }}
              >
                <Text style={[styles.notiTitle, rtlText]}>
                  {__("settingsScreenTexts.languageTitle", appSettings.lng)}
                </Text>
              </View>
              {langloading ? (
                <View style={{ flex: 1 }}>
                  <ActivityIndicator size={"small"} color={COLORS.primary} />
                </View>
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginVertical: 15,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      borderRadius: 5,
                      borderWidth: 1,
                      borderColor: COLORS.border_light,
                      paddingHorizontal: 15,
                      paddingVertical: 8,
                      flexDirection: rtl_support ? "row-reverse" : "row",
                      alignItems: "center",
                    }}
                    onPress={() => setLangPicker(true)}
                  >
                    <Text style={{ paddingHorizontal: 5 }}>
                      {languages[appSettings.lng]}
                    </Text>
                    <View style={{ paddingHorizontal: 5 }}>
                      <FontAwesome
                        name="caret-down"
                        size={15}
                        color={COLORS.gray}
                      />
                    </View>
                  </TouchableOpacity>
                  <ListPicker
                    pickerVisible={langPicker}
                    data={langArr}
                    onClick={handleLanguageChange}
                    overlayClick={() => setLangPicker(false)}
                    selected={appSettings?.lng || null}
                    pickerLabel={__(
                      "settingsScreenTexts.languageTitle",
                      appSettings.lng
                    )}
                    centeredContent={true}
                  />
                </View>
              )}
            </View>
          )}

          {config?.multiCurrency?.type === "dynamic" &&
            config?.multiCurrency?.enable_selection === true && (
              <View
                style={{
                  flexDirection: rtl_support ? "row-reverse" : "row",
                  alignItems: "center",
                  paddingHorizontal: "3%",
                  marginBottom: 5,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    flexDirection: "row",
                  }}
                >
                  <Fontisto
                    name="money-symbol"
                    size={24}
                    color={COLORS.primary}
                  />
                  <Text
                    style={[
                      {
                        fontSize: 20,
                        color: COLORS.primary,
                        paddingHorizontal: 5,
                      },
                      rtlText,
                    ]}
                  >
                    {__("settingsScreenTexts.currencyTitle", appSettings.lng)}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginVertical: 5,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      borderRadius: 5,
                      paddingHorizontal: 15,
                      paddingVertical: 8,
                      flexDirection: rtl_support ? "row-reverse" : "row",
                      alignItems: "center",
                      backgroundColor: COLORS.white,
                      borderWidth: 1,
                      borderColor: COLORS.border_light,
                    }}
                    onPress={() => setCurrencyPicker(true)}
                  >
                    {appSettings?.dynamic_currency ? (
                      <Text style={{ paddingHorizontal: 5 }}>
                        {getCurrencyName()}
                      </Text>
                    ) : (
                      <Text style={{ paddingHorizontal: 5 }}>
                        {__("settingsScreenTexts.select", appSettings.lng)}
                      </Text>
                    )}
                    <View style={{ paddingHorizontal: 5 }}>
                      <FontAwesome
                        name="caret-down"
                        size={15}
                        color={COLORS.gray}
                      />
                    </View>
                  </TouchableOpacity>
                  <ListPicker
                    pickerVisible={currencyPicker}
                    data={config.multiCurrency.currencyList}
                    onClick={handleCurrencyChange}
                    overlayClick={() => setCurrencyPicker(false)}
                    selected={
                      appSettings?.dynamic_currency
                        ? { id: appSettings.dynamic_currency }
                        : null
                    }
                    pickerType="currency"
                    pickerLabel={__(
                      "settingsScreenTexts.currencyTitle",
                      appSettings.lng
                    )}
                  />
                </View>
              </View>
            )}
          {!!config?.pn_events?.length && (
            <View style={styles.notificationSection}>
              <View style={styles.notiWrapper}>
                <View
                  style={{
                    flexDirection: rtl_support ? "row-reverse" : "row",
                    alignItems: "center",
                    // justifyContent: rtl_support ? "flex-end" : "flex-start",
                  }}
                >
                  <View>
                    <MaterialCommunityIcons
                      name="bell-ring"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={[styles.notiTitle, rtlTextA]}>
                    {__(
                      "settingsScreenTexts.notificationTitle",
                      appSettings.lng
                    )}
                  </Text>
                </View>
                <AppSeparator style={styles.separator} />
                {config?.pn_events?.includes("news_letter") && (
                  <View
                    style={[
                      styles.notiSetWrap,
                      { paddingVertical: ios ? 7 : 0 },
                      rtlView,
                    ]}
                  >
                    <View style={styles.notisetTtlWrap}>
                      <Text style={[styles.notisetTtl, rtlTextA]}>
                        {__(
                          "settingsScreenTexts.newsletterNotiTitle",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.notiSetBtnWrap}>
                      <Switch
                        trackColor={{
                          false: COLORS.gray,
                          true: COLORS.primary,
                        }}
                        thumbColor={COLORS.white}
                        onValueChange={() => toggleSwitch("news_letter")}
                        value={notification.includes("news_letter")}
                      />
                    </View>
                  </View>
                )}
                {config?.pn_events?.includes("listing_approved") && (
                  <View
                    style={[
                      styles.notiSetWrap,
                      { paddingVertical: ios ? 7 : 0 },
                      rtlView,
                    ]}
                  >
                    <View style={styles.notisetTtlWrap}>
                      <Text style={[styles.notisetTtl, rtlTextA]}>
                        {__(
                          "settingsScreenTexts.ListingApprovalNotiTitle",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.notiSetBtnWrap}>
                      <Switch
                        trackColor={{
                          false: COLORS.gray,
                          true: COLORS.primary,
                        }}
                        thumbColor={COLORS.white}
                        onValueChange={() => toggleSwitch("listing_approved")}
                        value={notification.includes("listing_approved")}
                      />
                    </View>
                  </View>
                )}
                {config?.pn_events?.includes("chat") && (
                  <View
                    style={[
                      styles.notiSetWrap,
                      { paddingVertical: ios ? 7 : 0 },
                      rtlView,
                    ]}
                  >
                    <View style={styles.notisetTtlWrap}>
                      <Text style={[styles.notisetTtl, rtlTextA]}>
                        {__(
                          "settingsScreenTexts.messageNotiTitle",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.notiSetBtnWrap}>
                      <Switch
                        trackColor={{
                          false: COLORS.gray,
                          true: COLORS.primary,
                        }}
                        thumbColor={COLORS.white}
                        onValueChange={() => toggleSwitch("chat")}
                        value={notification.includes("chat")}
                      />
                    </View>
                  </View>
                )}

                {config?.pn_events?.includes("listing_expired") && (
                  <View
                    style={[
                      styles.notiSetWrap,
                      { paddingVertical: ios ? 7 : 0 },
                      rtlView,
                    ]}
                  >
                    <View style={styles.notisetTtlWrap}>
                      <Text style={[styles.notisetTtl, rtlTextA]}>
                        {__(
                          "settingsScreenTexts.expiredListingNotification",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.notiSetBtnWrap}>
                      <Switch
                        trackColor={{
                          false: COLORS.gray,
                          true: COLORS.primary,
                        }}
                        thumbColor={COLORS.white}
                        onValueChange={() => toggleSwitch("listing_expired")}
                        value={notification.includes("listing_expired")}
                      />
                    </View>
                  </View>
                )}
                {!!user?.isAdmin && (
                  <>
                    {config?.pn_events?.includes("listing_created") && (
                      <View
                        style={[
                          styles.notiSetWrap,
                          { paddingVertical: ios ? 7 : 0 },
                          rtlView,
                        ]}
                      >
                        <View style={styles.notisetTtlWrap}>
                          <Text style={[styles.notisetTtl, rtlTextA]}>
                            {__(
                              "settingsScreenTexts.onlyAdmin.newListing",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View style={styles.notiSetBtnWrap}>
                          <Switch
                            trackColor={{
                              false: COLORS.gray,
                              true: COLORS.primary,
                            }}
                            thumbColor={COLORS.white}
                            onValueChange={() =>
                              toggleSwitch("listing_created")
                            }
                            value={notification.includes("listing_created")}
                          />
                        </View>
                      </View>
                    )}
                    {config?.pn_events?.includes("order_created") && (
                      <View
                        style={[
                          styles.notiSetWrap,
                          { paddingVertical: ios ? 7 : 0 },
                          rtlView,
                        ]}
                      >
                        <View style={styles.notisetTtlWrap}>
                          <Text style={[styles.notisetTtl, rtlTextA]}>
                            {__(
                              "settingsScreenTexts.onlyAdmin.newOrder",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View style={styles.notiSetBtnWrap}>
                          <Switch
                            trackColor={{
                              false: COLORS.gray,
                              true: COLORS.primary,
                            }}
                            thumbColor={COLORS.white}
                            onValueChange={() => toggleSwitch("order_created")}
                            value={notification.includes("order_created")}
                          />
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            </View>
          )}

          {listViewConfig?.enableUserControl && (
            <View style={styles.notificationSection}>
              <View style={[styles.notiWrapper]}>
                <View
                  style={{
                    flexDirection: rtl_support ? "row-reverse" : "row",
                    alignItems: "center",
                    // justifyContent: rtl_support ? "flex-end" : "flex-start",
                  }}
                >
                  <View>
                    <MaterialIcons
                      name="featured-play-list"
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text
                    style={[
                      { paddingHorizontal: 5 },
                      styles.notiTitle,
                      rtlTextA,
                    ]}
                  >
                    {__("settingsScreenTexts.viewStyleTitle", appSettings.lng)}
                  </Text>
                </View>
                <AppSeparator style={styles.separator} />
                <View
                  style={[
                    styles.notiSetWrap,
                    { paddingVertical: ios ? 7 : 0 },
                    rtlView,
                  ]}
                >
                  <View style={styles.notisetTtlWrap}>
                    <Text style={[styles.notisetTtl, rtlTextA]}>
                      {__("settingsScreenTexts.listView", appSettings.lng)}
                    </Text>
                  </View>
                  <View style={styles.notiSetBtnWrap}>
                    <Switch
                      trackColor={{
                        false: COLORS.gray,
                        true: COLORS.primary,
                      }}
                      thumbColor={COLORS.white}
                      onValueChange={() => toggleView(appSettings.listView)}
                      value={appSettings.listView}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
        {user && (
          <View style={[styles.contentWrapper, { paddingHorizontal: "3%" }]}>
            <TouchableOpacity
              style={[styles.logOutWrap, rtlView]}
              onPress={handleLogout}
            >
              <FontAwesome5 name="power-off" size={16} color="#F65D71" />
              <Text
                style={[
                  styles.logOutTitle,
                  rtlText,
                  { paddingEnd: rtl_support ? 10 : 0, color: "#F65D71" },
                ]}
              >
                {__("settingsScreenTexts.logoutbuttonTitle", appSettings.lng)}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Admob banner Component */}
        {admobConfig?.admobEnabled &&
          admobConfig.settingsScreen &&
          !admobError && (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                height: 100,
                marginTop: 20,
                position: "absolute",
                bottom: 0,
                width: "100%",
              }}
            >
              <AdmobBanner onError={onAdmobError} />
            </View>
          )}
      </View>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  btnCommon: {
    width: "50%",
    paddingVertical: 9,
    borderRadius: 0,
  },
  btninActive: {
    backgroundColor: COLORS.white,
  },
  btnTextinActive: {
    color: COLORS.text_gray,
  },
  btnTextCommon: {
    color: COLORS.white,
  },
  changeDetailTitle: {
    padding: "3%",
    fontWeight: "bold",
  },
  changePassTitle: {
    padding: "3%",
    fontWeight: "bold",
  },

  container: {
    backgroundColor: COLORS.white,
  },
  contentWrapper: {
    backgroundColor: COLORS.white,
  },

  form: {
    paddingHorizontal: "3%",
    paddingTop: 10,
    paddingBottom: 20,
  },

  formSeparator: {
    backgroundColor: COLORS.gray,
    width: "100%",
    marginBottom: 10,
  },
  label: {
    color: COLORS.text_gray,
  },
  languageTitle: {
    fontSize: 20,
  },
  languageTitle2: {
    padding: "3%",
    fontWeight: "bold",
  },
  langButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  languageSupport: {
    padding: "3%",
  },
  languageSupport2: {
    paddingBottom: 10,
  },
  logOutWrap: {
    flexDirection: "row",
    paddingHorizontal: "5%",
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "#FFF1F3",
    justifyContent: "center",
    borderRadius: 5,
  },
  logOutTitle: {
    fontWeight: "bold",
    paddingLeft: 10,
  },
  notiSetBtnWrap: {
    flex: 1.5,
  },
  notisetTtl: { fontSize: 14, color: COLORS.text_medium, fontWeight: "bold" },
  notisetTtlWrap: {
    flex: 3.5,
  },
  notiSetWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  notiSetBtnWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  notiTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
    paddingHorizontal: 5,
  },
  notiWrapper: {
    padding: "3%",
  },
  pickerWrap: {
    paddingHorizontal: "1%",
    paddingTop: 10,
  },
  screenTitle: {
    padding: "3%",
    fontWeight: "bold",
  },

  separator: {
    width: "100%",
    backgroundColor: COLORS.separator_light,
    marginVertical: 10,
  },
  toggleSwitch: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  updateButton: {
    width: "100%",
    borderRadius: 0,
    paddingVertical: 10,
  },
});

export default SettingsScreen;
