import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import api, { removeAuthToken, setAuthToken } from "../api/client";
import { decodeString, getPrice } from "../helper/helper";
import { useStateValue } from "../StateProvider";
import { AntDesign } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { __ } from "../language/stringPicker";
import { COLORS } from "../variables/color";
import authStorage from "../app/auth/authStorage";
import AppTextButton from "../components/AppTextButton";
import { routes } from "../navigation/routes";

const PromoteScreen = ({ navigation, route }) => {
  const [{ auth_token, config, appSettings, user, rtl_support }, dispatch] =
    useStateValue();
  const [loading, setLoading] = useState(true);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [myMembership, setMyMembership] = useState(null);
  const [plans, setPlans] = useState(null);
  const [membershipOpened, setMembershipOpened] = useState(true);
  const [plansOpened, setPlansOpened] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPromotions, setSelectedPromotions] = useState([]);
  const [promotionError, setPromotionError] = useState();
  const [promotionData, setPromotionData] = useState();
  const [zeroPayment, setZeroPayment] = useState(false);

  useEffect(() => {
    getMyMembershipStatus();
  }, []);

  const getPromotionPlans = () => {
    api
      .get("plans")
      .then((res) => {
        if (res.ok) {
          setPlans(res.data);
        } else {
          // TODO handle error
        }
      })
      .then(() => {
        if (loading) {
          setLoading(false);
        }
      });
  };

  const getMyMembershipStatus = () => {
    setAuthToken(auth_token);
    api
      .get("my")
      .then((res) => {
        if (res.ok) {
          if (!!res?.data?.membership) {
            setMyMembership(res.data.membership);
            dispatch({
              type: "SET_AUTH_DATA",
              data: {
                user: res.data,
                auth_token: auth_token,
              },
            });
            const tempSecureUser = { user: res.data, jwt_token: auth_token };
            authStorage.storeUser(JSON.stringify(tempSecureUser));
            if (res.data.membership.is_expired === true) {
              setPlansOpened(true);
              setMembershipOpened(false);
            } else {
              setPlansOpened(false);
            }
          } else {
            setMembershipOpened(false);
          }
        } else {
          // TODO handle error
        }
      })
      .then(() => {
        removeAuthToken();
        getPromotionPlans();
      });
  };

  const handlePlanSelection = (plan) => {
    if (parseFloat(plan?.price) + 0 === 0) {
      setZeroPayment(true);
    } else {
      setZeroPayment(false);
    }
    setSelectedPlan(plan);
  };

  const handlePromotionSelections = (feature) => {
    let tempArr = [];
    if (selectedPromotions.includes(feature)) {
      tempArr = selectedPromotions.filter((_promo) => _promo !== feature);
    } else {
      tempArr = Array.from(new Set([...selectedPromotions, feature]));
    }
    setSelectedPromotions(tempArr);
  };

  const handleMembershipHeaderClick = () => {
    setMembershipOpened((prevMO) => !prevMO);
    setPlansOpened((prevPO) => !prevPO);
  };

  const handlePlansHeaderClick = () => {
    if (!myMembership || myMembership?.is_expired === true) {
      return;
    }
    setPlansOpened((prevPO) => !prevPO);
    setMembershipOpened((prevMO) => !prevMO);
  };

  const handlePromotion = () => {
    if (promotionError) {
      setPromotionError();
    }
    setPromotionLoading(true);
    setModalVisible(true);
    const args = {
      type: "promotion",
      promotion_type: "membership",
      listing_id: route?.params?.id,
      membership_promotions: [...selectedPromotions],
    };
    handlePromotionCheckout(args);
  };
  const handlePayment = () => {
    // navigation.navigate(routes.paymentMethodScreen, {
    //   selected: selectedPlan,
    //   type: "promotion",
    //   listingID: route.params.id,
    //   listingTitle: route.params.title,
    // });
    if (zeroPayment) {
      navigation.navigate(routes.zeroPayment, {
        selected: selectedPlan,
        type: "promotion",
        listingID: route.params.id,
        listingTitle: route.params.title,
      });
    } else {
      navigation.navigate(routes.paymentMethodScreen, {
        selected: selectedPlan,
        type: "promotion",
        listingID: route.params.id,
        listingTitle: route.params.title,
      });
    }
  };

  const handlePromotionCheckout = (args) => {
    setAuthToken(auth_token);

    api
      .post("checkout", args)
      .then((res) => {
        if (res.ok) {
          setPromotionData(res.data);
        } else {
          setPromotionError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("paymentMethodScreen.unknownError", appSettings.lng)
          );
          // TODO handle error
        }
      })
      .then(() => {
        removeAuthToken();
        setPromotionLoading(false);
      });
  };

  const handleGoBack = () => {
    setModalVisible(false);
    navigation.goBack();
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
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {myMembership?.is_expired === false && (
              <View
                style={[
                  styles.membershipPromotionWrap,
                  {
                    paddingBottom: membershipOpened ? 10 : 0,
                  },
                ]}
              >
                <TouchableWithoutFeedback onPress={handleMembershipHeaderClick}>
                  <View
                    style={[
                      styles.headerWrap,
                      {
                        marginBottom: membershipOpened ? 10 : 0,
                        borderBottomLeftRadius: membershipOpened ? 0 : 10,
                        borderBottomRightRadius: membershipOpened ? 0 : 10,
                      },
                      rtlView,
                    ]}
                  >
                    <View style={styles.headerTextWrap}>
                      <Text style={[styles.headerText, rtlText]}>
                        {__(
                          "promoteScreenTexts.membershipPromotions",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.iconWrap}>
                      <AntDesign
                        name={membershipOpened ? "arrowup" : "arrowright"}
                        size={15}
                        color={COLORS.primary}
                      />
                    </View>
                  </View>
                </TouchableWithoutFeedback>
                {membershipOpened && (
                  <View style={styles.promotionTable}>
                    <View style={[styles.tableHeader, rtlView]}>
                      <View style={styles.tableHeaderContentWrap}>
                        <View style={styles.tableHeaderContentInner}>
                          <Text style={[styles.tableHeaderContent, rtlText]}>
                            {__(
                              "promoteScreenTexts.promotions",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.tableHeaderContentWrap,
                          {
                            borderLeftWidth: 1,
                            borderLeftColor: COLORS.border_light,
                            borderRightWidth: 1,
                            borderRightColor: COLORS.border_light,
                          },
                        ]}
                      >
                        <View style={styles.tableHeaderContentInner}>
                          <Text style={[styles.tableHeaderContent, rtlText]}>
                            {__(
                              "promoteScreenTexts.remainingads",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.tableHeaderContentWrap}>
                        <View style={styles.tableHeaderContentInner}>
                          <Text style={[styles.tableHeaderContent, rtlText]}>
                            {__(
                              "promoteScreenTexts.validDuration",
                              appSettings.lng
                            )}
                            <Text style={styles.durationUnit}>
                              {" (#"}
                              {__(
                                "promoteScreenTexts.validPeriodUnit",
                                appSettings.lng
                              )}
                              {")"}
                            </Text>
                          </Text>
                        </View>
                      </View>
                    </View>
                    {Object.keys(myMembership.promotions).map(
                      (item, index, arr) => (
                        <TouchableOpacity
                          onPress={() => handlePromotionSelections(item)}
                          disabled={myMembership.promotions[item].ads < 1}
                          style={[
                            styles.tableRow,
                            {
                              borderBottomWidth: arr.length - 1 > index ? 1 : 0,
                            },
                            rtlView,
                          ]}
                          key={index}
                        >
                          <View
                            style={[
                              styles.tableRowContentWrap,
                              {
                                alignItems: "flex-start",
                                flexDirection: rtl_support
                                  ? "row-reverse"
                                  : "row",
                                alignSelf: "center",
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.chkBoxWrap,
                                {
                                  paddingRight: rtl_support ? 0 : 5,
                                  paddingLeft: rtl_support ? 5 : 0,
                                },
                              ]}
                            >
                              <MaterialCommunityIcons
                                name={
                                  selectedPromotions.includes(item)
                                    ? "checkbox-marked"
                                    : "checkbox-blank-outline"
                                }
                                size={16}
                                color={
                                  selectedPromotions.includes(item)
                                    ? COLORS.primary
                                    : COLORS.text_gray
                                }
                              />
                            </View>
                            <Text
                              style={[styles.tableRowContent, rtlText]}
                              numberOfLines={1}
                            >
                              {__(`promotions.${item}`, appSettings.lng)}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.tableRowContentWrap,
                              {
                                borderLeftWidth: 1,
                                borderLeftColor: COLORS.border_light,
                                borderRightWidth: 1,
                                borderRightColor: COLORS.border_light,
                              },
                            ]}
                          >
                            <Text
                              style={[styles.tableRowContent, rtlText]}
                              numberOfLines={1}
                            >
                              {myMembership.promotions[item].ads}
                            </Text>
                          </View>
                          <View style={styles.tableRowContentWrap}>
                            <Text
                              style={[styles.tableRowContent, rtlText]}
                              numberOfLines={1}
                            >
                              {myMembership.promotions[item].validate}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                )}
              </View>
            )}

            {plans && (
              <View
                style={[
                  styles.promotionPlanWrap,
                  {
                    marginTop: myMembership?.is_expired === false ? 10 : 20,

                    marginHorizontal: "3%",
                  },
                ]}
              >
                <TouchableWithoutFeedback onPress={handlePlansHeaderClick}>
                  <View
                    style={[
                      styles.headerWrap,
                      {
                        marginBottom: plansOpened ? 10 : 0,
                        borderBottomRightRadius: plansOpened ? 0 : 10,
                        borderBottomLeftRadius: plansOpened ? 0 : 10,
                      },
                      rtlView,
                    ]}
                  >
                    <View style={styles.headerTextWrap}>
                      <Text style={[styles.headerText, rtlText]}>
                        {__(
                          "promoteScreenTexts.regularPromotions",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    {myMembership?.is_expired === false && (
                      <View style={styles.iconWrap}>
                        <AntDesign
                          name={plansOpened ? "arrowup" : "arrowright"}
                          size={15}
                          color={COLORS.primary}
                        />
                      </View>
                    )}
                  </View>
                </TouchableWithoutFeedback>

                {plansOpened && (
                  <View style={styles.regularPromotionWrap}>
                    {plans.map((item, index, arr) => (
                      <TouchableWithoutFeedback
                        key={index}
                        onPress={() => handlePlanSelection(item)}
                      >
                        <View style={styles.promotionCardWrap}>
                          <View
                            style={[
                              styles.promotionCardRowWrap,
                              {
                                borderBottomWidth: 1,
                                borderBottomColor: COLORS.border_light,
                              },
                              rtlView,
                            ]}
                          >
                            <View style={{ flex: 3 }} />
                            <View
                              style={[
                                styles.promotionCardRowContentWrap,
                                {
                                  borderColor: COLORS.border_light,
                                  borderLeftWidth: 1,
                                  borderRightWidth: 1,
                                },
                              ]}
                            >
                              <View style={styles.label}>
                                <Text style={[styles.labelText, rtlText]}>
                                  {__(
                                    "promoteScreenTexts.validity",
                                    appSettings.lng
                                  )}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.promotionCardRowContentWrap}>
                              <View style={styles.label}>
                                <Text style={[styles.labelText, rtlText]}>
                                  {__(
                                    "promoteScreenTexts.price",
                                    appSettings.lng
                                  )}
                                </Text>
                              </View>
                            </View>
                          </View>
                          <View style={[styles.promotionCardRowWrap, rtlView]}>
                            <View
                              style={{
                                flex: 3,
                                alignItems: "flex-start",
                              }}
                            >
                              <View style={[styles.titleWrap, rtlView]}>
                                <View
                                  style={[
                                    styles.chkBoxWrap,
                                    { paddingLeft: rtl_support ? 5 : 0 },
                                    { paddingRight: rtl_support ? 0 : 5 },
                                  ]}
                                >
                                  <MaterialCommunityIcons
                                    name={
                                      item?.id === selectedPlan?.id
                                        ? "radiobox-marked"
                                        : "radiobox-blank"
                                    } //radiobox-blank
                                    size={16}
                                    color={COLORS.primary}
                                  />
                                </View>
                                <View
                                  style={{
                                    flex: 1,
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.promotionCardTitle,
                                      rtlTextA,
                                    ]}
                                  >
                                    {decodeString(item.title)}
                                  </Text>
                                </View>
                              </View>
                            </View>
                            <View
                              style={[
                                styles.promotionCardRowContentWrap,
                                {
                                  borderColor: COLORS.border_light,
                                  borderLeftWidth: 1,
                                  height: "100%",
                                  borderRightWidth: 1,
                                },
                              ]}
                            >
                              <View
                                style={{
                                  flex: 1,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Text style={[styles.valueText, rtlText]}>
                                  {item.visible}{" "}
                                  {__(
                                    "promoteScreenTexts.validPeriodUnit",
                                    appSettings.lng
                                  )}
                                </Text>
                              </View>
                            </View>
                            <View style={styles.promotionCardRowContentWrap}>
                              <Text style={[styles.valueText, rtlText]}>
                                {getPrice(
                                  config.payment_currency,
                                  {
                                    pricing_type: "price",
                                    price_type: "",
                                    price: item.price,
                                    max_price: 0,
                                  },
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </TouchableWithoutFeedback>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </View>
      {!loading && (
        <View style={styles.paymentButtonWrap}>
          {membershipOpened && myMembership?.is_expired === false && (
            <TouchableOpacity
              onPress={handlePromotion}
              style={{
                backgroundColor:
                  selectedPromotions.length === 0
                    ? COLORS.button.disabled
                    : COLORS.button.active,
                borderRadius: 3,
                marginVertical: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
              }}
              disabled={selectedPromotions.length === 0}
            >
              <Text style={[styles.buttonText, rtlText]}>
                {__("promoteScreenTexts.confirmPromotion", appSettings.lng)}
              </Text>
              <View style={styles.btnIconWrap}>
                <AntDesign name="arrowright" size={18} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          )}
          {plansOpened && (
            <TouchableOpacity
              onPress={handlePayment}
              style={{
                backgroundColor: !selectedPlan
                  ? COLORS.button.disabled
                  : COLORS.button.active,
                borderRadius: 3,
                marginVertical: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
              }}
              disabled={!selectedPlan}
            >
              <Text style={[styles.buttonText, rtlText]}>
                {__(
                  zeroPayment
                    ? "promoteScreenTexts.checkOut"
                    : "promoteScreenTexts.proceedToPayment",
                  appSettings.lng
                )}
              </Text>
              <View style={styles.btnIconWrap}>
                <AntDesign name="arrowright" size={18} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <View style={styles.modalContentWrap}>
            {promotionLoading ? (
              <View style={styles.promotionLoadingWrap}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <>
                <View style={styles.headerSectionWrap}>
                  <Text style={styles.promotionStatus}>
                    {__(
                      promotionData?.success
                        ? "promoteScreenTexts.success"
                        : "promoteScreenTexts.fail",
                      appSettings.lng
                    )}
                  </Text>
                  {promotionError && (
                    <Text style={styles.promotionError}>{promotionError}</Text>
                  )}
                </View>
                <AppTextButton
                  title={__("promoteScreenTexts.goBackButton", appSettings.lng)}
                  onPress={handleGoBack}
                  style={{ marginVertical: 10 }}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  btnIconWrap: {
    marginLeft: 5,
    marginTop: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
  chkBoxWrap: {},
  container: {
    flex: 1,
    backgroundColor: COLORS.bg_dark,
  },
  description: {
    color: COLORS.text_gray,
  },
  descriptionWrap: {
    padding: 10,
    borderColor: COLORS.border_light,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  durationUnit: {
    fontSize: 12,
  },
  tableHeaderContent: {
    fontWeight: "bold",
    color: COLORS.text_gray,
    textAlign: "center",
  },
  tableHeaderContentInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },

  headerSectionWrap: {
    paddingVertical: 15,
    marginHorizontal: "3%",
    alignItems: "center",
  },
  headerText: {
    fontWeight: "bold",
    color: COLORS.white,
    fontSize: 15,
  },
  headerWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: "3%",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: "space-between",
  },
  iconWrap: {
    height: 20,
    width: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20 / 2,
    backgroundColor: COLORS.white,
  },
  label: {
    flex: 1,
    padding: 5,
    justifyContent: "center",
  },
  listingTitle: {
    fontSize: 17,
    fontWeight: "bold",
  },
  loadingWrap: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  membershipPromotionWrap: {
    marginHorizontal: "3%",
    borderTopWidth: 0,
    marginTop: 15,
    borderRadius: 10,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { height: 0, width: 0 },
    backgroundColor: COLORS.white,
  },

  modalContentWrap: {
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    paddingHorizontal: 15,
    marginHorizontal: "10%",
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { height: 0, width: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.8,
    borderRadius: 10,
  },

  paymentButtonWrap: {
    marginHorizontal: "4%",
    backgroundColor: "transparent",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  promotionCardRowContentWrap: {
    flex: 1,
    alignItems: "center",
  },
  promotionCardRowWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  promotionCardTitle: {
    fontWeight: "bold",
  },
  promotionCardWrap: {
    marginVertical: 10,
    marginHorizontal: "3%",
    borderWidth: 1,
    borderColor: COLORS.border_light,
  },
  promotionPlanWrap: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
  },
  promotionsText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  promotionTable: {
    borderWidth: 1,
    borderRadius: 3,
    borderColor: COLORS.border_light,
    marginHorizontal: "3%",
  },
  regularPromotionWrap: {},
  scrollContainer: {
    paddingBottom: 75,
  },
  tableHeader: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_light,
    flexDirection: "row",
    alignItems: "center",
  },
  tableHeaderContentWrap: {
    padding: 5,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tableRow: {
    borderBottomColor: COLORS.border_light,
    flexDirection: "row",
    alignItems: "center",
  },
  tableRowContent: {
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  tableRowContentWrap: {
    padding: 5,
    flex: 1,
    alignItems: "center",
  },

  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  value: {
    flex: 1,
    padding: 5,
    borderLeftColor: COLORS.border_light,
    borderLeftWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PromoteScreen;
