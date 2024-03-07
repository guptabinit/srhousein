/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";

// External Libraries
import ReactNativeZoomableView from "@openspacelabs/react-native-zoomable-view/src/ReactNativeZoomableView";

// Vector Icons
import { FontAwesome } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";

// Custom Components & Functions
import { COLORS } from "../variables/color";
import ProfileData from "../components/ProfileData";
import { useStateValue } from "../StateProvider";
import api, { setAuthToken, removeAuthToken } from "../api/client";
import AppSeparator from "../components/AppSeparator";
import FlashNotification from "../components/FlashNotification";
import { __ } from "../language/stringPicker";
import { routes } from "../navigation/routes";
import { decodeString } from "../helper/helper";
import authStorage from "../app/auth/authStorage";
import {
  CommonActions,
  useFocusEffect,
  useIsFocused,
} from "@react-navigation/native";
import { firebaseConfig } from "../app/services/firebaseConfig";

const { width: deviceWidth, height: deviceHeight } = Dimensions.get("window");
const MyProfileScreen = ({ navigation }) => {
  const [
    { auth_token, user, is_connected, appSettings, rtl_support, ios, config },
    dispatch,
  ] = useStateValue();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState();
  const [imageViewer, setImageViewer] = useState(false);
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();
  const isFocused = useIsFocused();

  const handleError = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setFlashNotificationMessage();
    }, 1200);
  };
  useEffect(() => {
    setAuthToken(auth_token);
    api.get("my").then((res) => {
      if (isFocused) {
        if (res.ok) {
          dispatch({
            type: "SET_AUTH_DATA",
            data: { user: res.data },
          });
          setLoading(false);
          removeAuthToken();
        } else {
          // TODO handle error && add retry button on error

          setErrorMessage(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("myProfileScreenTexts.customResponseError", appSettings.lng)
          );
          handleError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("myProfileScreenTexts.customResponseError", appSettings.lng)
          );
          setLoading(false);
          removeAuthToken();
        }
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      setAuthToken(auth_token);
      api.get("my").then((res) => {
        if (useIsFocused) {
          if (res.ok) {
            dispatch({
              type: "SET_AUTH_DATA",
              data: { user: res.data },
            });
            setLoading(false);
            removeAuthToken();
          } else {
            // TODO handle error && add retry button on error

            setErrorMessage(
              res?.data?.error_message ||
                res?.data?.error ||
                res?.problem ||
                __("myProfileScreenTexts.customResponseError", appSettings.lng)
            );
            handleError(
              res?.data?.error_message ||
                res?.data?.error ||
                res?.problem ||
                __("myProfileScreenTexts.customResponseError", appSettings.lng)
            );
            setLoading(false);
            removeAuthToken();
          }
        }
      });
    }, [])
  );

  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "center",
  };
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  const onEditPress = () => {
    if (config?.verification && !user?.phone_verified) {
      alert(__("myProfileScreenTexts.phoneVerifyAlert", appSettings.lng));
    } else {
      navigation.navigate(routes.editPersonalDetailScreen, {
        data: user,
      });
    }
  };

  const handleLocationTaxonomy = (locations) => {
    if (!locations) return;
    let result = "";
    for (let i = 0; i < locations.length; i++) {
      if (result.length < 1) {
        result = locations[i].name;
      } else {
        result = result + `, ${locations[i].name}`;
      }
    }
    return result;
  };

  const handleImageViewer = () => {
    if (!user.pp_thumb_url) return;
    setImageViewer(!imageViewer);
  };

  const getName = () => {
    if (user?.first_name) {
      return decodeString([user.first_name, user.last_name].join(" "));
    } else return user.username;
  };

  const handleUserDeletionAlert = () => {
    Alert.alert(
      __("myProfileScreenTexts.deleteAccount.title", appSettings.lng),
      __("myProfileScreenTexts.deleteAccount.message1", appSettings.lng),
      [
        {
          text: __(
            "myProfileScreenTexts.deleteAccount.cancelBtn",
            appSettings.lng
          ),
        },
        {
          text: __(
            "myProfileScreenTexts.deleteAccount.deleteBtn",
            appSettings.lng
          ),
          onPress: handleUserDeletionConfirmationAlert,
        },
      ]
    );
  };

  const handleUserDeletionConfirmationAlert = () => {
    Alert.alert(
      __("myProfileScreenTexts.deleteAccount.title", appSettings.lng),
      __("myProfileScreenTexts.deleteAccount.message2", appSettings.lng),
      [
        {
          text: __(
            "myProfileScreenTexts.deleteAccount.cancelBtn",
            appSettings.lng
          ),
        },
        {
          text: __(
            "myProfileScreenTexts.deleteAccount.confirmBtn",
            appSettings.lng
          ),
          onPress: handleUserDeletionCall,
        },
      ]
    );
  };
  const handleUserDeletionCall = () => {
    setLoading(true);
    setAuthToken(auth_token);
    api.post("account-delete").then((res) => {
      if (res.ok) {
        dispatch({
          type: "SET_AUTH_DATA",
          data: { user: null, auth_token: null },
        });
        removeAuthToken();
        authStorage.removeUser();
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: routes.drawerNavigator }],
          })
        );
      } else {
        // TODO handle error && add retry button on error

        setErrorMessage(
          res?.data?.error_message ||
            res?.data?.error ||
            res?.problem ||
            __("myProfileScreenTexts.customResponseError", appSettings.lng)
        );
        handleError(
          res?.data?.error_message ||
            res?.data?.error ||
            res?.problem ||
            __("myProfileScreenTexts.customResponseError", appSettings.lng)
        );
        removeAuthToken();
        setLoading(false);
      }
    });
  };

  return is_connected ? (
    <>
      {loading ? (
        <View style={styles.loadingWrap}>
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </View>
      ) : (
        <>
          {!imageViewer && (
            <View style={styles.container}>
              <ScrollView>
                <View style={styles.mainWrap}>
                  <View style={styles.titleRow}>
                    <TouchableWithoutFeedback onPress={handleImageViewer}>
                      <View
                        style={{
                          padding: 5,
                          borderWidth: 1,
                          borderColor: COLORS.primary,
                          borderRadius: deviceWidth * 15,
                          marginVertical: 20,
                        }}
                      >
                        <View style={styles.imageWrap}>
                          {user.pp_thumb_url ? (
                            <Image
                              source={{ uri: user.pp_thumb_url }}
                              style={styles.image}
                            />
                          ) : (
                            <FontAwesome
                              name="camera"
                              size={20}
                              color={COLORS.text_gray}
                            />
                          )}
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                    <View
                      style={{
                        width: "100%",
                        alignItems: "center",
                      }}
                    >
                      {(!!user?.username || !!user?.first_name) && (
                        <View style={[styles.phoneWrap, rtlView]}>
                          <Text
                            style={[styles.name, rtlText]}
                            numberOfLines={1}
                          >
                            {getName()}
                          </Text>
                        </View>
                      )}
                      {/* {!!user.phone && (
                        <View style={[styles.phoneWrap, rtlView]}>
                          <View style={{}}>
                            <Text
                              style={{
                                fontSize: 16,
                                color: COLORS.text_medium,
                              }}
                            >
                              {__(
                                "myProfileScreenTexts.profileInfoLabels.phone",
                                appSettings.lng
                              )}
                              {":"}
                            </Text>
                          </View>
                          <View style={{}}>
                            <Text
                              style={[
                                styles.phone,
                                {
                                  marginLeft: rtl_support ? 0 : 5,
                                  marginRight: rtl_support ? 5 : 0,
                                },
                                rtlText,
                              ]}
                              numberOfLines={1}
                            >
                              {user.phone}
                            </Text>
                          </View>
                        </View>
                      )} */}
                    </View>
                  </View>
                  <View
                    style={{
                      paddingTop: 20,
                      flexDirection: rtl_support ? "row-reverse" : "row",
                      alignItems: "center",
                    }}
                  >
                    <View style={styles.view}>
                      <FontAwesome5
                        name="user-alt"
                        size={15}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={{ paddingHorizontal: 5, flex: 1 }}>
                      <Text
                        style={[
                          { fontSize: 15, color: COLORS.primary },
                          rtlTextA,
                        ]}
                      >
                        {__("myProfileScreenTexts.title", appSettings.lng)}
                      </Text>
                    </View>
                  </View>
                  <AppSeparator style={styles.separator} />
                  <View style={styles.detail}>
                    {/* {(!!user.first_name || !!user.last_name) && (
                      <ProfileData
                        label={__(
                          "myProfileScreenTexts.profileInfoLabels.name",
                          appSettings.lng
                        )}
                        value={[user.first_name, user.last_name].join(" ")}
                      />
                    )} */}
                    {!!user.email && (
                      <ProfileData
                        label={__(
                          "myProfileScreenTexts.profileInfoLabels.email",
                          appSettings.lng
                        )}
                        value={user.email}
                      />
                    )}
                    {!!user.phone && (
                      <ProfileData
                        label={__(
                          "myProfileScreenTexts.profileInfoLabels.phone",
                          appSettings.lng
                        )}
                        value={user.phone}
                        phone={true}
                      />
                    )}
                    {!!user.whatsapp_number && (
                      <ProfileData
                        label={__(
                          "myProfileScreenTexts.profileInfoLabels.whatsapp",
                          appSettings.lng
                        )}
                        value={user.whatsapp_number}
                      />
                    )}
                    {!!user.website && (
                      <ProfileData
                        label={__(
                          "myProfileScreenTexts.profileInfoLabels.website",
                          appSettings.lng
                        )}
                        value={user.website}
                      />
                    )}
                    {(!!user.locations.length || !!user.address) && (
                      <ProfileData
                        label={__(
                          "myProfileScreenTexts.profileInfoLabels.address",
                          appSettings.lng
                        )}
                        value={
                          handleLocationTaxonomy(user.locations)
                            ? `${handleLocationTaxonomy(user.locations)}, ${
                                user.zipcode ? user.zipcode + "," : ""
                              } ${user.address}`
                            : `${user.zipcode ? user.zipcode + "," : ""} ${
                                user.address
                              }`
                        }
                      />
                    )}
                    {!user.phone && !!config?.verification?.gateway && (
                      <View
                        style={{
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 20,
                          paddingHorizontal: "3%",
                          marginHorizontal: "3%",
                        }}
                      >
                        <TouchableOpacity
                          style={{
                            backgroundColor: COLORS.button.active,
                            paddingHorizontal: 15,
                            paddingVertical: 8,
                            borderRadius: 3,
                          }}
                          onPress={() =>
                            navigation.navigate(routes.oTPScreen, {
                              source: "profile",
                              // phone: value,
                            })
                          }
                        >
                          <Text style={{ color: COLORS.white }}>
                            {__(
                              "myProfileScreenTexts.addPhoneBtnTitle",
                              appSettings.lng
                            )}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
                <View
                  style={{
                    // alignItems: rtl_support ? "flex-end" : "flex-start",
                    flexDirection: "row",
                    paddingHorizontal: "3%",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                  }}
                >
                  <TouchableOpacity
                    onPress={onEditPress}
                    style={[
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 25,
                        paddingVertical: ios ? 10 : 8,
                        backgroundColor: COLORS.primary,
                        borderRadius: 5,
                        marginVertical: 5,
                      },
                      rtlView,
                    ]}
                  >
                    <FontAwesome5 name="edit" size={16} color={COLORS.white} />
                    <Text
                      style={[
                        {
                          paddingLeft: rtl_support ? 0 : 5,
                          paddingRight: rtl_support ? 5 : 0,
                          fontSize: 15,
                          color: COLORS.white,
                          fontWeight: "bold",
                        },
                        rtlText,
                      ]}
                    >
                      {__("myProfileScreenTexts.editBtn", appSettings.lng)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleUserDeletionAlert}
                    style={[
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 25,
                        paddingVertical: ios ? 10 : 8,
                        backgroundColor: COLORS.button.disabled,
                        borderRadius: 5,
                        marginVertical: 5,
                      },
                      rtlView,
                    ]}
                  >
                    <FontAwesome5
                      name="trash-alt"
                      size={16}
                      color={COLORS.white}
                    />
                    <Text
                      style={[
                        {
                          paddingLeft: rtl_support ? 0 : 5,
                          paddingRight: rtl_support ? 5 : 0,
                          fontSize: 15,
                          color: COLORS.white,
                          fontWeight: "bold",
                        },
                        rtlText,
                      ]}
                    >
                      {__("myProfileScreenTexts.deleteBtn", appSettings.lng)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
          {imageViewer && !!user.pp_thumb_url && (
            <View style={styles.imageViewerWrap}>
              <TouchableOpacity
                style={styles.imageViewerCloseButton}
                onPress={handleImageViewer}
              >
                <FontAwesome5 name="times" size={20} color={COLORS.red} />
              </TouchableOpacity>

              <View style={styles.imageViewer}>
                <ReactNativeZoomableView
                  maxZoom={1.5}
                  minZoom={1}
                  zoomStep={0.5}
                  initialZoom={1}
                  bindToBorders={true}
                  style={{
                    padding: 10,
                    backgroundColor: COLORS.bg_dark,
                  }}
                >
                  <Image
                    style={{
                      width: deviceWidth,
                      height: deviceHeight,
                      resizeMode: "contain",
                    }}
                    source={{
                      uri: user.pp_thumb_url,
                    }}
                  />
                </ReactNativeZoomableView>
              </View>
            </View>
          )}
        </>
      )}
      <FlashNotification
        falshShow={flashNotification}
        flashMessage={flashNotificationMessage}
      />
    </>
  ) : (
    <View style={styles.noInternet}>
      <FontAwesome5
        name="exclamation-circle"
        size={24}
        color={COLORS.primary}
      />
      <Text style={styles.text}>
        {__("myProfileScreenTexts.noInternet", appSettings.lng)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  image: {
    height: deviceWidth * 0.22,
    width: deviceWidth * 0.22,
    resizeMode: "cover",
  },
  imageViewer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerCloseButton: {
    position: "absolute",
    right: 15,
    top: 15,
    zIndex: 10,
    height: 40,
    width: 40,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  imageViewerWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    width: "100%",
    height: "100%",
    flex: 1,
  },
  imageWrap: {
    height: deviceWidth * 0.22,
    width: deviceWidth * 0.22,
    borderRadius: deviceWidth * 0.11,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg_dark,
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
  },
  loadingWrap: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  mainWrap: {
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: "3%",
  },
  name: {
    fontSize: 20,
    color: COLORS.text_dark,
    fontWeight: "bold",
  },
  noInternet: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  phone: {
    fontSize: 15,
    color: COLORS.text_medium,
  },
  phoneWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  separator: {
    width: "100%",
    backgroundColor: COLORS.border_light,
    marginVertical: 15,
  },
  titleRow: {
    alignItems: "center",
    width: "100%",
  },
});

export default MyProfileScreen;
