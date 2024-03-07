import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated,
  Modal,
  Alert,
} from "react-native";
import { COLORS } from "../variables/color";
import AppSeparator from "../components/AppSeparator";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";
import { routes } from "../navigation/routes";
import { AntDesign } from "@expo/vector-icons";
import api, { removeAuthToken, setAuthToken } from "../api/client";
import { useIsFocused } from "@react-navigation/native";
import AppTextButton from "../components/AppTextButton";
import SmallButton from "../components/SmallButton";
import AppButton from "../components/AppButton";
import {
  CardField,
  StripeProvider,
  createPaymentMethod,
  useConfirmSetupIntent,
} from "@stripe/stripe-react-native";
import FlashNotification from "../components/FlashNotification";

const { width: screenWidth, height: screenHeight } = Dimensions.get("screen");
const MyMembershipScreen = ({ navigation }) => {
  const [{ appSettings, auth_token, config, rtl_support, user }] =
    useStateValue();
  const [loading, setLoading] = useState(true);
  const [tempUser, setTempUser] = useState();
  const [selectedSubId, setSelectedSubId] = useState(null);
  const [overlay, setOverlay] = useState(false);
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();
  const [cardData, setCardData] = useState(null);
  const isFocused = useIsFocused();
  const ref = useRef(null);
  const { confirmSetupIntent, loading: intentLoading } =
    useConfirmSetupIntent();

  useEffect(() => {
    getMyMembershipStatus();
  }, []);

  useEffect(() => {
    if (selectedSubId) {
      makeVisible();
    }
    return () => {};
  }, [selectedSubId]);

  const areaHeight = new Animated.Value(0);
  const areaOpacity = new Animated.Value(0);

  const makeVisible = () => {
    Animated.timing(areaHeight, {
      toValue: 700,
      duration: 500,
      useNativeDriver: false,
    }).start();
    Animated.timing(areaOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
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
  const getMyMembershipStatus = () => {
    setAuthToken(auth_token);
    api
      .get("my")
      .then((res) => {
        if (isFocused) {
          if (res.ok) {
            setTempUser(res?.data);
          } else {
            // TODO handle error
          }
        }
      })
      .then(() => {
        removeAuthToken();
        setLoading(false);
      });
  };

  const getUser = (tempUser) => {
    if (!tempUser) return null;
    if (tempUser.first_name) {
      return tempUser.first_name + " " + tempUser.last_name;
    }
    return tempUser.username;
  };

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

  const onSubCancel = (subId) => {
    Alert.alert(
      "",
      __(
        "myMembershipScreenTexts.subscriptionCancelConfirmation",
        appSettings.lng
      ),
      [
        {
          text: __("myMembershipScreenTexts.cancelBtnTitle", appSettings.lng),
        },
        {
          text: __("myMembershipScreenTexts.confirmBtnTitle", appSettings.lng),
          onPress: () => confirmSubCancellation(subId),
        },
      ]
    );
  };

  const confirmSubCancellation = (subId) => {
    setOverlay(true);
    setAuthToken(auth_token);
    api
      .delete(`subscription/${subId}`)
      .then((res) => {
        if (res.ok) {
          setLoading(true);
          getMyMembershipStatus();
        } else {
          handleError(res?.data?.message || res?.data?.error || res?.problem);
        }
      })
      .finally(() => {
        removeAuthToken();
        setOverlay(false);
      });
  };

  const onSubPMUpdate = (sub) => {
    if (selectedSubId === sub.id) {
      ref.current.blur();
      setOverlay(true);
      if (sub.gateway.id === "stripe") {
        updateStripePM(sub.id);
      } else {
        updateAuthorizenetPm(sub.id);
      }
    } else {
      setCardData(null);
      setSelectedSubId(sub.id);
      return;
    }
  };
  const updateAuthorizenetPm = (subId) => {
    setAuthToken(auth_token);
    api
      .post("subscription/update-pm", {
        id: subId,
        card_number: cardData.number,
        card_expiry: cardData.expiryMonth + "-" + cardData.expiryYear,
        card_cvc: cardData.cvc,
      })
      .then((res) => {
        if (res.ok) {
          setSelectedSubId();
          setCardData(null);
          handleError(
            __(
              "myMembershipScreenTexts.paymentMethodUpdateSuccessMessage",
              appSettings.lng
            )
          );
          setLoading(true);
          getMyMembershipStatus();
        } else {
          handleError(res?.data?.message || res?.data?.error || res?.problem);
        }
      })
      .finally(() => {
        removeAuthToken();
        setOverlay(false);
      });
  };
  const updateStripePM = async (subId) => {
    const { error, paymentMethod } = await createPaymentMethod({
      paymentMethodType: "Card",
      type: "card",
      card: cardData,
      billing_details: {
        name: [user.first_name, user.last_name].join(" "),
        email: user.email,
      },
    });
    if (error) {
      setOverlay(false);
      alert(error.message);
      return;
    }
    setAuthToken(auth_token);
    api
      .post("subscription/update-pm", {
        id: subId,
        stripe_pm_id: paymentMethod?.id || "",
      })
      .then((res) => {
        if (res.ok) {
          setSelectedSubId();
          setCardData(null);
          handleError(
            __(
              "myMembershipScreenTexts.paymentMethodUpdateSuccessMessage",
              appSettings.lng
            )
          );
          setLoading(true);
          getMyMembershipStatus();
        } else {
          handleError(res?.data?.message || res?.data?.error || res?.problem);
        }
      })
      .finally(() => {
        removeAuthToken();
        setOverlay(false);
      });
  };

  const updateCard = (cardInfo) => {
    setCardData(cardInfo);
  };

  const onHide = () => {
    setSelectedSubId(null);
    setCardData(null);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ width: "100%" }}
          keyboardShouldPersistTaps="never"
        >
          <View
            style={tempUser?.membership ? styles.mainWrap_2 : styles.mainWrap}
          >
            <View style={styles.detailWrap}>
              <View
                style={[
                  styles.memberInfoWrap,
                  { alignItems: rtl_support ? "flex-end" : "flex-start" },
                ]}
              >
                <View style={styles.nameWrap}>
                  <Text style={[styles.name, rtlText]}>
                    {getUser(tempUser)}
                  </Text>
                </View>
                {rtl_support ? (
                  <View style={styles.emailWrap}>
                    <Text style={styles.emailLabel}>
                      {tempUser.email}
                      <Text style={{ fontWeight: "bold" }}>
                        {__(
                          "myMembershipScreenTexts.emailLabel",
                          appSettings.lng
                        )}{" "}
                      </Text>
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emailWrap}>
                    <Text style={[styles.emailLabel, { fontWeight: "bold" }]}>
                      {__(
                        "myMembershipScreenTexts.emailLabel",
                        appSettings.lng
                      )}{" "}
                      <Text style={{ fontWeight: "normal" }}>
                        {tempUser.email}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
              <AppSeparator style={styles.separator} />
              {!!config?.subscription &&
                tempUser?.subscriptions?.length > 0 && (
                  <View
                    style={[
                      styles.reportHeaderWrap,
                      {
                        alignItems: rtl_support ? "flex-end" : "flex-start",
                      },
                    ]}
                  >
                    <View
                      style={{
                        backgroundColor: COLORS.bg_primary,
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        borderRadius: 3,
                        marginVertical: 5,
                      }}
                    >
                      <Text style={[styles.reportHeader, rtlText]}>
                        {__(
                          "myMembershipScreenTexts.subscriptionReportTitle",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    {tempUser.subscriptions.map((sub) => (
                      <View style={{ width: "100%" }} key={sub.id}>
                        <View style={[styles.reportRow, rtlView]}>
                          <View
                            style={[
                              styles.reportLeft,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.reportLabel, rtlTextA]}>
                              {__(
                                "myMembershipScreenTexts.subscriptionNameLabel",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <View style={styles.reportRight}>
                            <Text style={[styles.reportValue, rtlTextA]}>
                              {sub.name}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.reportRow, rtlView]}>
                          <View
                            style={[
                              styles.reportLeft,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.reportLabel, rtlTextA]}>
                              {__(
                                "myMembershipScreenTexts.subscriptionMethodLabel",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <View style={styles.reportRight}>
                            <Text style={[styles.reportValue, rtlTextA]}>
                              {sub.gateway.title}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.reportRow, rtlView]}>
                          <View
                            style={[
                              styles.reportLeft,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.reportLabel, rtlTextA]}>
                              {__(
                                "myMembershipScreenTexts.subscriptionStatusLabel",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <View style={styles.reportRight}>
                            <Text style={[styles.reportValue, rtlTextA]}>
                              {__(
                                sub?.status
                                  ? "myMembershipScreenTexts.active"
                                  : "myMembershipScreenTexts.expired",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                        </View>
                        {sub?.cc && (
                          <View
                            style={[
                              styles.reportRowLast,
                              rtlView,
                              { paddingVertical: 12 },
                            ]}
                          >
                            <Text style={[styles.reportValue, rtlTextA]}>
                              {sub.cc.type}
                              {"  "}
                              {`****${sub.cc.last4} (${sub.cc.expiry}) `}
                            </Text>
                            {selectedSubId !== sub.id && sub?.gateway && (
                              <AppTextButton
                                style={{ zIndex: 100 }}
                                title={__(
                                  "myMembershipScreenTexts.subscriptionPMUpdateBtnTitle",
                                  appSettings.lng
                                )}
                                onPress={() => onSubPMUpdate(sub)}
                                textStyle={{ textDecorationLine: "underline" }}
                                disabled={
                                  selectedSubId === sub.id &&
                                  !cardData?.complete
                                }
                              />
                            )}
                          </View>
                        )}
                        {selectedSubId === sub.id && sub?.gateway && (
                          <Animated.View
                            style={{
                              maxHeight: areaHeight,
                              opacity: areaOpacity,
                              marginVertical: 10,
                              paddingBottom: 5,
                            }}
                          >
                            <View
                              style={{
                                backgroundColor: COLORS.bg_dark,
                                marginBottom: 10,
                              }}
                            >
                              <StripeProvider
                                publishableKey={
                                  sub?.gateway?.key &&
                                  sub?.gateway?.id === "stripe"
                                    ? sub.gateway.key
                                    : "pk_test_51J2sdOGisFrTT10P188P3x8J5YiFn4eOEvMvo6SbVEgBDqZA9RYFUP5fNCQ0x9fjjoUt5KAhlQzvG7jYuN9mVeHO00SfVsayzv"
                                }
                              >
                                <CardField
                                  key="done"
                                  onBlur={() => console.log("blur")}
                                  ref={ref}
                                  dangerouslyGetFullCardDetails={
                                    sub?.gateway?.id === "authorizenet"
                                  }
                                  postalCodeEnabled={false}
                                  placeholder={{
                                    number: "4242 4242 4242 4242",
                                  }}
                                  cardStyle={{
                                    backgroundColor: "#E5E5E5",
                                    textColor: "#000000",
                                    fontSize: 15,
                                  }}
                                  style={{
                                    height: 35,
                                    marginVertical: 1,
                                    marginHorizontal: 1,
                                    borderWidth: 1,
                                    borderColor: COLORS.border_light,
                                    borderRadius: 3,
                                  }}
                                  onCardChange={updateCard}
                                />
                              </StripeProvider>
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingHorizontal: "2%",
                                paddingTop: 5,
                              }}
                            >
                              <SmallButton
                                disabled={
                                  selectedSubId === sub.id &&
                                  !cardData?.complete
                                }
                                style={{
                                  paddingVertical: 5,
                                  paddingHorizontal: 15,
                                }}
                                textStyle={{ fontSize: 12 }}
                                title={__(
                                  "myMembershipScreenTexts.subscriptionPMUpdateBtnTitle",
                                  appSettings.lng
                                )}
                                onPress={() => onSubPMUpdate(sub)}
                              />
                              <SmallButton
                                disabled={!sub?.status}
                                style={{
                                  paddingVertical: 5,
                                  paddingHorizontal: 15,
                                }}
                                textStyle={{ fontSize: 12 }}
                                title={__(
                                  "myMembershipScreenTexts.hideCardElementBtnTitle",
                                  appSettings.lng
                                )}
                                onPress={onHide}
                              />
                            </View>
                          </Animated.View>
                        )}
                        <View style={{ paddingHorizontal: "2%" }}>
                          {sub?.status && (
                            <AppButton
                              disabled={!sub?.status}
                              style={{
                                paddingVertical: 5,
                                paddingHorizontal: 15,
                              }}
                              textStyle={{ fontSize: 12 }}
                              title={__(
                                "myMembershipScreenTexts.subscriptionCancelBtnTitle",
                                appSettings.lng
                              )}
                              onPress={() => onSubCancel(sub.id)}
                            />
                          )}
                        </View>
                        <AppSeparator style={styles.separator} />
                      </View>
                    ))}
                  </View>
                )}

              {tempUser?.membership ? (
                <View style={styles.membershipReportWrap}>
                  <View
                    style={[
                      styles.reportHeaderWrap,
                      { alignItems: rtl_support ? "flex-end" : "flex-start" },
                    ]}
                  >
                    <View
                      style={{
                        backgroundColor: COLORS.bg_primary,
                        paddingVertical: 5,
                        paddingHorizontal: 10,
                        borderRadius: 3,
                        marginVertical: 5,
                      }}
                    >
                      <Text style={[styles.reportHeader, rtlText]}>
                        {__(
                          "myMembershipScreenTexts.membershipDetailHeader",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.reportRow, rtlView]}>
                    <View
                      style={[
                        styles.reportLeft,
                        {
                          alignItems: rtl_support ? "flex-end" : "flex-start",
                        },
                      ]}
                    >
                      <Text style={[styles.reportLabel, rtlTextA]}>
                        {__(
                          "myMembershipScreenTexts.membershipStatusLabel",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.reportRight}>
                      <Text style={[styles.reportValue, rtlTextA]}>
                        {__(
                          tempUser?.membership?.is_expired
                            ? "myMembershipScreenTexts.expired"
                            : "myMembershipScreenTexts.active",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.reportRow, rtlView]}>
                    <View
                      style={[
                        styles.reportLeft,
                        {
                          alignItems: rtl_support ? "flex-end" : "flex-start",
                        },
                      ]}
                    >
                      <Text style={[styles.reportLabel, rtlTextA]}>
                        {__(
                          "myMembershipScreenTexts.membershipValidityLabel",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.reportRight}>
                      <Text style={[styles.reportValue, rtlTextA]}>
                        {__(
                          tempUser?.membership?.is_expired
                            ? "myMembershipScreenTexts.expiredOn"
                            : "myMembershipScreenTexts.till",
                          appSettings.lng
                        )}{" "}
                        {tempUser?.membership?.expired_at}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.reportRow, rtlView]}>
                    <View
                      style={[
                        styles.reportLeft,
                        {
                          alignItems: rtl_support ? "flex-end" : "flex-start",
                        },
                      ]}
                    >
                      <Text style={[styles.reportLabel, rtlTextA]}>
                        {__(
                          "myMembershipScreenTexts.remainingAdsLabel",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.reportRight}>
                      <Text style={[styles.reportValue, rtlTextA]}>
                        {tempUser?.membership?.remaining_ads}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.reportRow,
                      {
                        borderBottomWidth:
                          tempUser?.membership?.free_ads !== undefined ? 1 : 0,
                      },
                      rtlView,
                    ]}
                  >
                    <View
                      style={[
                        styles.reportLeft,
                        {
                          alignItems: rtl_support ? "flex-end" : "flex-start",
                        },
                      ]}
                    >
                      <Text style={[styles.reportLabel, rtlTextA]}>
                        {__(
                          "myMembershipScreenTexts.postedAdsLabel",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.reportRight}>
                      <Text style={[styles.reportValue, rtlTextA]}>
                        {tempUser?.membership?.posted_ads}
                      </Text>
                    </View>
                  </View>
                  {tempUser?.membership?.free_ads !== undefined && (
                    <View
                      style={[
                        styles.reportRow,
                        { borderBottomWidth: 0 },
                        rtlView,
                      ]}
                    >
                      <View
                        style={[
                          styles.reportLeft,
                          {
                            alignItems: rtl_support ? "flex-end" : "flex-start",
                          },
                        ]}
                      >
                        <Text style={[styles.reportLabel, rtlTextA]}>
                          {__(
                            "myMembershipScreenTexts.freeAdsLabel",
                            appSettings.lng
                          )}
                        </Text>
                      </View>
                      <View style={styles.reportRight}>
                        <Text style={[styles.reportValue, rtlTextA]}>
                          {tempUser?.membership?.free_ads}
                        </Text>
                      </View>
                    </View>
                  )}
                  {tempUser?.membership?.promotions && (
                    <View style={styles.promotionsWrap}>
                      <View style={[styles.promotionHeaderRow, rtlView]}>
                        <View style={styles.promotionHeaderContent}>
                          <Text style={styles.promotionHeaderText}>
                            {__(
                              "myMembershipScreenTexts.promotions",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.promotionHeaderContent,
                            {
                              borderColor: COLORS.border_light,
                              borderLeftWidth: 1,
                              borderRightWidth: 1,
                            },
                          ]}
                        >
                          <Text style={styles.promotionHeaderText}>
                            {__(
                              "myMembershipScreenTexts.remainingAdsTableLabel",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View style={styles.promotionHeaderContent}>
                          {rtl_support ? (
                            <Text
                              style={styles.promotionHeaderText}
                              numberOfLines={1}
                            >
                              (
                              {__(
                                "myMembershipScreenTexts.validityUnit",
                                appSettings.lng
                              )}
                              ){" "}
                              {__(
                                "myMembershipScreenTexts.membershipValidityTableLabel",
                                appSettings.lng
                              )}
                            </Text>
                          ) : (
                            <Text
                              style={styles.promotionHeaderText}
                              numberOfLines={1}
                            >
                              {__(
                                "myMembershipScreenTexts.membershipValidityTableLabel",
                                appSettings.lng
                              )}{" "}
                              (
                              {__(
                                "myMembershipScreenTexts.validityUnit",
                                appSettings.lng
                              )}
                              )
                            </Text>
                          )}
                        </View>
                      </View>
                      {!!tempUser?.membership?.promotions &&
                        Object.keys(tempUser.membership.promotions).map(
                          (promo, index, arr) => (
                            <View
                              style={[
                                styles.promotionRow,
                                {
                                  borderBottomWidth:
                                    arr.length - 1 === index ? 0 : 1,
                                },
                                rtlView,
                              ]}
                              key={index}
                            >
                              <View
                                style={[
                                  styles.promotionLabelWrap,
                                  styles.promotionContent,
                                ]}
                              >
                                <Text
                                  style={styles.promotionLabel}
                                  numberOfLines={1}
                                >
                                  {__(`promotions.${promo}`, appSettings.lng)}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.promotionValueWrap,
                                  styles.promotionContent,
                                ]}
                              >
                                <Text
                                  style={styles.promotionValue}
                                  numberOfLines={1}
                                >
                                  {tempUser.membership.promotions[promo].ads}
                                </Text>
                              </View>
                              <View
                                style={[
                                  styles.promotionDurationWrap,
                                  styles.promotionContent,
                                ]}
                              >
                                <Text
                                  style={styles.promotionDuration}
                                  numberOfLines={1}
                                >
                                  {
                                    tempUser.membership.promotions[promo]
                                      .validate
                                  }
                                </Text>
                              </View>
                            </View>
                          )
                        )}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noMembershipWrap}>
                  <View style={styles.bgImgWrap}>
                    <Image
                      source={require("../assets/membership_bg.png")}
                      style={styles.bgImg}
                    />
                  </View>
                  <View style={styles.titleWrap}>
                    <Text style={[styles.title, rtlText]}>
                      {__("myMembershipScreenTexts.title", appSettings.lng)}
                    </Text>
                  </View>
                  <View style={styles.membershipTextWrap}>
                    <Text style={[styles.membershipText, rtlText]}>
                      {__(
                        "myMembershipScreenTexts.membershipText",
                        appSettings.lng
                      )}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          <View style={styles.buttonWrap}>
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() =>
                navigation.navigate(routes.membershipsScreen, {
                  isMember: tempUser?.membership ? true : false,
                })
              }
            >
              <Text
                style={[styles.showMoreButtonText, rtlText]}
                numberOfLines={1}
              >
                {__(
                  tempUser?.membership
                    ? "myMembershipScreenTexts.upgradeMembershipPackageButtonTitle"
                    : "myMembershipScreenTexts.showMembershipPackageButtonTitle",
                  appSettings.lng
                )}
              </Text>
              <View style={styles.iconWrap}>
                <AntDesign name="arrowright" size={18} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      <Modal animationType="slide" transparent={true} visible={overlay}>
        <View style={styles.overlay}>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: COLORS.gray,
              opacity: 0.3,
            }}
          />
          <ActivityIndicator size={"large"} color={COLORS.primary} />
        </View>
      </Modal>
      {/* Flash Notification Component */}
      <FlashNotification
        falshShow={flashNotification}
        flashMessage={flashNotificationMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  bgImg: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  bgImgWrap: {
    width: screenWidth * 0.5,
    height: screenWidth * 0.5 * 0.85,
    marginBottom: screenHeight * 0.03,
  },
  button: {
    width: "100%",
    paddingVertical: 6,
    borderRadius: 3,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "500",
  },
  buttonWrap: {
    marginHorizontal: "8%",
  },
  container: {
    backgroundColor: "#F8F8F8",
    flex: 1,
  },
  email: {
    fontSize: 14,
    fontWeight: "normal",
    color: COLORS.text_dark,
  },
  emailLabel: {
    color: COLORS.text_gray,
  },
  iconWrap: {
    marginLeft: 5,
    marginTop: 2,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mainWrap: {
    paddingHorizontal: "4%",
    paddingTop: screenHeight * 0.1,
  },
  mainWrap_2: {
    paddingHorizontal: "4%",
    paddingVertical: "4%",
    backgroundColor: COLORS.white,
    borderRadius: 5,
    elevation: 5,
    margin: "4%",
    shadowColor: COLORS.black,
    shadowOpacity: 0.2,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowRadius: 5,
  },
  detailWrap: {
    width: "100%",
  },
  membershipText: {
    fontSize: 16,
    color: COLORS.text_gray,
    marginBottom: 5,
    lineHeight: 22,
    textAlign: "center",
  },
  membershipTextWrap: {
    alignItems: "center",
    paddingVertical: 10,
  },
  name: {
    fontWeight: "bold",
    color: COLORS.text_dark,
    fontSize: 16,
  },
  nameWrap: {
    marginBottom: 5,
  },
  noMembershipWrap: {
    alignItems: "center",
  },
  promotionContent: {
    flex: 1,
    padding: 5,
    alignItems: "center",
  },
  promotionDuration: {
    fontWeight: "bold",
  },
  promotionHeaderContent: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
    backgroundColor: COLORS.bg_dark,
  },
  promotionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_light,
  },
  promotionHeaderText: {
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  promotionLabel: {
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  promotionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_light,
  },
  promotionValue: {
    fontWeight: "bold",
  },
  promotionValueWrap: {
    borderColor: COLORS.border_light,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  promotionsWrap: {
    borderWidth: 1,
    borderColor: COLORS.border_light,
    marginTop: 15,
  },
  reportHeader: {
    fontWeight: "bold",
    color: COLORS.primary,
  },
  reportLabel: {
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  reportLeft: {
    flex: Platform.OS === "ios" ? 1.5 : 1.2,
  },
  reportRight: { flex: 2 },
  reportRow: {
    flexDirection: "row",
    paddingVertical: Platform.OS === "ios" ? 9 : 7,
    borderBottomWidth: 0.8,
    borderBottomColor: COLORS.border_light,
  },
  reportRowLast: {
    flexDirection: "row",
    paddingVertical: Platform.OS === "ios" ? 9 : 7,
  },
  reportValue: {
    color: COLORS.text_gray,
  },
  separator: {
    width: "100%",
    marginVertical: 15,
  },
  showMoreButton: {
    backgroundColor: COLORS.button.active,
    borderRadius: 3,
    marginVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
  },
  showMoreButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
  title: {
    fontSize: 20,
    color: COLORS.text_dark,
    paddingHorizontal: 10,
    fontWeight: "bold",
  },
  titleWrap: {
    alignItems: "center",
    paddingVertical: 10,
  },
});

export default MyMembershipScreen;
