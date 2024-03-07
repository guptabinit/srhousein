import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import api, { removeAuthToken, setAuthToken } from "../api/client";
import AppButton from "../components/AppButton";
import { decodeString, getPrice } from "../helper/helper";
import { __ } from "../language/stringPicker";
import { useStateValue } from "../StateProvider";
import { COLORS } from "../variables/color";
import moment from "moment";
import { useIsFocused } from "@react-navigation/native";
import { routes } from "../navigation/routes";
import { AntDesign } from "@expo/vector-icons";

const PaymentDetailScreen = ({ route, navigation }) => {
  const [{ auth_token, appSettings, config, ios, rtl_support }] =
    useStateValue();
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState(true);
  const [paymentData, setPaymentData] = useState();
  const [errorMessage, setErrorMessage] = useState();
  const [retry, setRetry] = useState(false);
  const isFocused = useIsFocused();

  // Initial Call
  // useEffect(() => {
  //   getPaymentDetail(route.params.id);
  // }, []);
  useEffect(() => {
    const focusHandler = navigation.addListener("focus", () => {
      getPaymentDetail(route.params.id);
    });
    return focusHandler;
  }, [navigation]);

  // Retry Call
  useEffect(() => {
    getPaymentDetail(route.params.id);
  }, [retry]);

  const getPaymentDetail = (id) => {
    if (errorMessage) {
      setErrorMessage();
    }
    setAuthToken(auth_token);
    api
      .get(`orders/${id}`)
      .then((res) => {
        if (isFocused) {
          if (res.ok) {
            setPaymentData(res.data);
          } else {
            setErrorMessage(
              res?.data?.error_message ||
                res?.data?.error ||
                res?.problem ||
                __("paymentsScreenTexts.unknownError", appSettings.lng)
            );
          }
        }
      })
      .then(() => {
        removeAuthToken();
        setLoading(false);
      });
  };

  const handleRetry = () => {
    setLoading(true);
    setRetry((prevRetry) => !prevRetry);
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

  const onPay = () => {
    navigation.navigate(routes.payScreen, { paymentData: paymentData });
    setLoading(true);
  };

  const handleGoBackToDashboard = () => {
    navigation.pop(4);
  };

  return (
    <View style={styles.container}>
      {route?.params?.header === false && (
        <View style={styles.screenHeaderWrap}>
          <TouchableWithoutFeedback onPress={handleGoBackToDashboard}>
            <View style={styles.headerBackBtnWrap}>
              <AntDesign name="arrowleft" size={20} color={COLORS.white} />
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, rtlText]}>
              {__("screenTitles.paymentDetailScreen", appSettings.lng)}
            </Text>
          </View>
        </View>
      )}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {errorMessage ? (
            <View style={styles.errorWrap}>
              <Text style={[styles.text, rtlText]}>
                {__("paymentDetailScreen.errorNotice", appSettings.lng)}
              </Text>
              <Text style={[styles.text, rtlText]}>
                {__("paymentDetailScreen.originalErrorLabel", appSettings.lng)}{" "}
                {errorMessage}
              </Text>
              <View style={{ width: "50%", marginTop: 30 }}>
                <AppButton
                  title={__("paymentsScreenTexts.retryButton", appSettings.lng)}
                  onPress={handleRetry}
                />
              </View>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollWrap}>
              <View style={styles.headerWrap}>
                <Text style={[styles.id, rtlTextA]}>
                  {__("paymentDetailScreen.invoiceNo", appSettings.lng)}{" "}
                  {paymentData.id}
                </Text>
              </View>

              <View style={{ paddingHorizontal: "3%", paddingBottom: "3%" }}>
                {!!paymentData && (
                  <View
                    style={{
                      backgroundColor: COLORS.white,
                      borderBottomLeftRadius: 10,
                      borderBottomRightRadius: 10,
                      elevation: 0.5,
                      shadowColor: COLORS.gray,
                      shadowOffset: { height: 1, width: 0 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                    }}
                  >
                    {!!paymentData?.method && (
                      <View style={[styles.paymentTableRow, rtlView]}>
                        <View
                          style={[
                            styles.paymentTableLabelWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableLabel, rtlText]}>
                            {__(
                              "paymentMethodScreen.payment.method",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.paymentTableValueWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableValue, rtlText]}>
                            {paymentData.method}
                          </Text>
                        </View>
                      </View>
                    )}

                    {!!paymentData?.coupon?.original && (
                      <View style={[styles.paymentTableRow, rtlView]}>
                        <View
                          style={[
                            styles.paymentTableLabelWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableLabel, rtlText]}>
                            {__(
                              "paymentMethodScreen.payment.originalPrice",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.paymentTableValueWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableValue, rtlText]}>
                            {getPrice(
                              config.payment_currency,
                              {
                                pricing_type: "price",
                                price_type: "",
                                price: paymentData.coupon.original,
                                max_price: 0,
                              },
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                      </View>
                    )}
                    {!!paymentData?.coupon?.discount && (
                      <View style={[styles.paymentTableRow, rtlView]}>
                        <View
                          style={[
                            styles.paymentTableLabelWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableLabel, rtlText]}>
                            {__(
                              "paymentMethodScreen.payment.discount",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.paymentTableValueWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableValue, rtlText]}>
                            {getPrice(
                              config.payment_currency,
                              {
                                pricing_type: "price",
                                price_type: "",
                                price: paymentData.coupon.discount,
                                max_price: 0,
                              },
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                      </View>
                    )}
                    {!!paymentData?.price && (
                      <View style={[styles.paymentTableRow, rtlView]}>
                        <View
                          style={[
                            styles.paymentTableLabelWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableLabel, rtlText]}>
                            {__(
                              "paymentMethodScreen.payment.totalAmount",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.paymentTableValueWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableValue, rtlText]}>
                            {getPrice(
                              config.payment_currency,
                              {
                                pricing_type: "price",
                                price_type: "",
                                price:
                                  config?.coupon &&
                                  paymentData?.coupon?.subtotal
                                    ? paymentData.coupon.subtotal
                                    : paymentData.price,
                                max_price: 0,
                              },
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                      </View>
                    )}
                    {!!paymentData?.created_date &&
                      paymentData.status !== "completed" && (
                        <View style={[styles.paymentTableRow, rtlView]}>
                          <View
                            style={[
                              styles.paymentTableLabelWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableLabel, rtlText]}>
                              {__(
                                "paymentMethodScreen.payment.orderDate",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.paymentTableValueWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableValue, rtlText]}>
                              {moment(
                                paymentData?.created_date,
                                "YYYY-MM-DD H-mm-ss"
                              ).format("MMM Do, YY h:mm: a")}
                            </Text>
                          </View>
                        </View>
                      )}
                    {!!paymentData?.paid_date && (
                      <View style={[styles.paymentTableRow, rtlView]}>
                        <View
                          style={[
                            styles.paymentTableLabelWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableLabel, rtlText]}>
                            {__(
                              "paymentMethodScreen.payment.date",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.paymentTableValueWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableValue, rtlText]}>
                            {moment(
                              paymentData?.paid_date,
                              "YYYY-MM-DD H-mm-ss"
                            ).format("MMM Do, YY h:mm: a")}
                          </Text>
                        </View>
                      </View>
                    )}
                    {!!paymentData?.transaction_id && (
                      <View style={[styles.paymentTableRow, rtlView]}>
                        <View
                          style={[
                            styles.paymentTableLabelWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableLabel, rtlText]}>
                            {__(
                              "paymentMethodScreen.payment.transactionID",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.paymentTableValueWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableValue, rtlText]}>
                            {paymentData.transaction_id}
                          </Text>
                        </View>
                      </View>
                    )}
                    {!!paymentData?.order_key && (
                      <View style={[styles.paymentTableRow, rtlView]}>
                        <View
                          style={[
                            styles.paymentTableLabelWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableLabel, rtlText]}>
                            {__(
                              "paymentMethodScreen.payment.orderKey",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.paymentTableValueWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableValue, rtlText]}>
                            {paymentData.order_key}
                          </Text>
                        </View>
                      </View>
                    )}

                    {!!paymentData?.status && (
                      <View
                        style={[
                          styles.paymentTableRow,
                          {
                            borderBottomWidth: !!paymentData?.gateway
                              ?.instructions
                              ? 0.7
                              : 0,
                          },

                          rtlView,
                        ]}
                      >
                        <View
                          style={[
                            styles.paymentTableLabelWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableLabel, rtlText]}>
                            {__(
                              "paymentMethodScreen.payment.status",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.paymentTableValueWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          <Text style={[styles.paymentTableValue, rtlText]}>
                            {paymentData.status}
                          </Text>
                        </View>
                      </View>
                    )}
                    {!!paymentData?.gateway?.instructions &&
                      // paymentData?.method === "offline" &&
                      paymentData?.status !== "completed" && (
                        <View
                          style={[
                            styles.paymentTableRow,
                            { borderBottomWidth: 0 },
                            rtlView,
                          ]}
                        >
                          <View
                            style={[
                              styles.paymentTableLabelWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableLabel, rtlText]}>
                              {__(
                                "paymentMethodScreen.payment.instructions",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.paymentTableValueWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableValue, rtlTextA]}>
                              {decodeString(paymentData.gateway.instructions)}
                            </Text>
                          </View>
                        </View>
                      )}
                  </View>
                )}
                {paymentData?.gateway?.id === "iyzipay" &&
                  paymentData?.status === "pending" &&
                  !!paymentData?.gateway?.routes?.webPay && (
                    <View style={styles.payBtnWrap}>
                      <AppButton
                        title={__(
                          "paymentDetailScreen.payNowBtnTitle",
                          appSettings.lng
                        )}
                        style={styles.payBtn}
                        textStyle={styles.paybtnTitle}
                        onPress={onPay}
                      />
                    </View>
                  )}
                {paymentData?.plan?.type === "regular" ? (
                  <View style={styles.planTableWrap}>
                    <View
                      style={{
                        backgroundColor: COLORS.bg_primary,
                        paddingHorizontal: 15,
                        paddingVertical: ios ? 10 : 7,
                        borderTopRightRadius: 10,
                        borderTopLeftRadius: 10,
                        marginTop: 15,
                      }}
                    >
                      <Text
                        style={[
                          styles.paymentTableValue,
                          { color: COLORS.primary },
                          rtlTextA,
                        ]}
                      >
                        {__(
                          "paymentMethodScreen.plan.details",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: COLORS.white,
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                        elevation: 0.5,
                        shadowColor: COLORS.gray,
                        shadowOffset: { height: 1, width: 0 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                      }}
                    >
                      {!!paymentData?.plan?.title && (
                        <View style={[styles.paymentTableRow, rtlView]}>
                          <View
                            style={[
                              styles.paymentTableLabelWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableLabel, rtlText]}>
                              {__(
                                "paymentMethodScreen.plan.pricingOption",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.paymentTableValueWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableValue, rtlText]}>
                              {decodeString(paymentData.plan.title)}
                            </Text>
                          </View>
                        </View>
                      )}
                      {!!paymentData?.plan?.description && (
                        <View style={[styles.paymentTableRow, rtlView]}>
                          <View
                            style={[
                              styles.paymentTableLabelWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableLabel, rtlText]}>
                              {__(
                                "paymentMethodScreen.plan.description",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.paymentTableValueWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableValue, rtlText]}>
                              {decodeString(paymentData.plan.description)}
                            </Text>
                          </View>
                        </View>
                      )}
                      {!!paymentData?.plan?.visible && (
                        <View style={[styles.paymentTableRow, rtlView]}>
                          <View
                            style={[
                              styles.paymentTableLabelWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableLabel, rtlText]}>
                              {__(
                                "paymentMethodScreen.plan.duration",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.paymentTableValueWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableValue, rtlText]}>
                              {paymentData.plan.visible}
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: COLORS.text_gray,
                                  fontWeight: "normal",
                                }}
                              >
                                {" ("}
                                {__(
                                  "promoteScreenTexts.validPeriodUnit",
                                  appSettings.lng
                                )}
                                )
                              </Text>
                            </Text>
                          </View>
                        </View>
                      )}
                      {!!paymentData?.plan?.price && (
                        <View
                          style={[
                            styles.paymentTableRow,
                            { borderBottomWidth: 0 },
                            rtlView,
                          ]}
                        >
                          <View
                            style={[
                              styles.paymentTableLabelWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableLabel, rtlText]}>
                              {__(
                                "paymentMethodScreen.plan.amount",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.paymentTableValueWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableValue, rtlText]}>
                              {getPrice(
                                config.payment_currency,
                                {
                                  pricing_type: "price",
                                  price_type: "",
                                  price: paymentData.plan.price,
                                  max_price: 0,
                                },
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.planTableWrap}>
                    {paymentData?.plan && (
                      <View
                        style={{
                          backgroundColor: COLORS.bg_primary,
                          paddingHorizontal: 10,
                          paddingVertical: ios ? 10 : 7,
                          borderTopRightRadius: 10,
                          borderTopLeftRadius: 10,
                          marginTop: 15,
                        }}
                      >
                        <Text
                          style={[
                            styles.paymentTableValue,
                            { color: COLORS.primary },
                            rtlTextA,
                          ]}
                        >
                          {__(
                            "paymentMethodScreen.plan.details",
                            appSettings.lng
                          )}
                        </Text>
                      </View>
                    )}
                    <View
                      style={{
                        backgroundColor: COLORS.white,
                        borderBottomLeftRadius: 10,
                        borderBottomRightRadius: 10,
                        elevation: 0.5,
                        shadowColor: COLORS.gray,
                        shadowOffset: { height: 1, width: 0 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                      }}
                    >
                      {!!paymentData?.plan?.title && (
                        <View style={[styles.paymentTableRow, rtlView]}>
                          <View
                            style={[
                              styles.paymentTableLabelWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableLabel, rtlText]}>
                              {__(
                                "paymentMethodScreen.plan.membershipTitle",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.paymentTableValueWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableValue, rtlText]}>
                              {decodeString(paymentData.plan.title)}
                            </Text>
                          </View>
                        </View>
                      )}
                      {!!paymentData?.plan?.description && (
                        <View style={[styles.paymentTableRow, rtlView]}>
                          <View
                            style={[
                              styles.paymentTableLabelWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableLabel, rtlText]}>
                              {__(
                                "paymentMethodScreen.plan.description",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.paymentTableValueWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableValue, rtlText]}>
                              {decodeString(paymentData.plan.description)}
                            </Text>
                          </View>
                        </View>
                      )}
                      {!!paymentData?.plan?.visible && (
                        <View style={[styles.paymentTableRow, rtlView]}>
                          <View
                            style={[
                              styles.paymentTableLabelWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableLabel, rtlText]}>
                              {__(
                                "paymentMethodScreen.plan.duration",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.paymentTableValueWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableValue, rtlText]}>
                              {paymentData.plan.visible}
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: COLORS.text_gray,
                                  fontWeight: "normal",
                                }}
                              >
                                {" "}
                                (
                                {__(
                                  "promoteScreenTexts.validPeriodUnit",
                                  appSettings.lng
                                )}
                                )
                              </Text>
                            </Text>
                          </View>
                        </View>
                      )}
                      {!!paymentData?.plan?.price && (
                        <View
                          style={[
                            styles.paymentTableRow,
                            { borderBottomWidth: 0 },
                            ,
                            rtlView,
                          ]}
                        >
                          <View
                            style={[
                              styles.paymentTableLabelWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableLabel, rtlText]}>
                              {__(
                                "paymentMethodScreen.plan.amount",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.paymentTableValueWrap,
                              {
                                alignItems: rtl_support
                                  ? "flex-end"
                                  : "flex-start",
                              },
                            ]}
                          >
                            <Text style={[styles.paymentTableValue, rtlText]}>
                              {getPrice(
                                config.payment_currency,
                                {
                                  pricing_type: "price",
                                  price_type: "",
                                  price: paymentData.plan.price,
                                  max_price: 0,
                                },
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {!!paymentData?.plan?.promotion && (
                      <View style={styles.featuresSectionWrap}>
                        <View
                          style={{
                            backgroundColor: COLORS.bg_primary,
                            paddingHorizontal: 10,
                            paddingVertical: ios ? 10 : 7,
                            borderTopRightRadius: 10,
                            borderTopLeftRadius: 10,
                            marginTop: 15,
                          }}
                        >
                          <Text
                            style={[
                              styles.featuresHeader,
                              { color: COLORS.primary },
                              rtlTextA,
                            ]}
                          >
                            {__(
                              "paymentDetailScreen.features",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: COLORS.white,
                            borderBottomLeftRadius: 10,
                            borderBottomRightRadius: 10,
                            elevation: 0.5,
                            shadowColor: COLORS.gray,
                            shadowOffset: { height: 1, width: 0 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                          }}
                        >
                          <View style={[styles.featTabHedRow, rtlView]}>
                            <View
                              style={[
                                styles.featTabContentLabelWrap,
                                {
                                  alignItems: rtl_support
                                    ? "flex-end"
                                    : "flex-start",
                                },
                              ]}
                            />
                            <View style={styles.featTabHedContentWrap}>
                              <Text style={[styles.featTabHed, rtlText]}>
                                {__("membershipCardTexts.ads", appSettings.lng)}
                              </Text>
                            </View>
                            <View style={styles.featTabHedContentWrap}>
                              <Text style={[styles.featTabHed, rtlText]}>
                                {__(
                                  "membershipCardTexts.validityUnit",
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                          </View>
                          {!!paymentData?.plan?.regular_ads && (
                            <View
                              style={[
                                styles.featTabRow,
                                {
                                  borderBottomWidth: !!Object.keys(
                                    paymentData?.plan?.promotion?.membership
                                  ).length
                                    ? 0.7
                                    : 0,
                                },
                                rtlView,
                              ]}
                            >
                              <View
                                style={[
                                  styles.featTabContentLabelWrap,
                                  {
                                    alignItems: rtl_support
                                      ? "flex-end"
                                      : "flex-start",
                                  },
                                ]}
                              >
                                <Text style={[styles.featTabContent, rtlText]}>
                                  {__(
                                    "membershipCardTexts.regular",
                                    appSettings.lng
                                  )}
                                </Text>
                              </View>
                              <View style={styles.featTabContentWrap}>
                                <Text style={[styles.featTabContent, rtlText]}>
                                  {paymentData.plan.regular_ads}
                                </Text>
                              </View>
                              <View style={styles.featTabContentWrap}>
                                <Text style={[styles.featTabContent, rtlText]}>
                                  {paymentData.plan.visible}
                                </Text>
                              </View>
                            </View>
                          )}
                          {!!Object.keys(
                            paymentData?.plan?.promotion?.membership
                          ).length &&
                            Object.keys(
                              paymentData?.plan?.promotion?.membership
                            ).map((_key, index, arr) => (
                              <View
                                style={[
                                  styles.featTabRow,
                                  {
                                    borderBottomWidth:
                                      arr.length - 1 == index ? 0 : 0.7,
                                  },
                                  rtlView,
                                ]}
                                key={index}
                              >
                                <View
                                  style={[
                                    styles.featTabContentLabelWrap,
                                    {
                                      alignItems: rtl_support
                                        ? "flex-end"
                                        : "flex-start",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[styles.featTabContent, rtlText]}
                                  >
                                    {__(`promotions.${_key}`, appSettings.lng)}
                                  </Text>
                                </View>
                                <View style={styles.featTabContentWrap}>
                                  <Text
                                    style={[styles.featTabContent, rtlText]}
                                  >
                                    {
                                      paymentData.plan.promotion.membership[
                                        _key
                                      ].ads
                                    }
                                  </Text>
                                </View>
                                <View style={styles.featTabContentWrap}>
                                  <Text
                                    style={[styles.featTabContent, rtlText]}
                                  >
                                    {
                                      paymentData.plan.promotion.membership[
                                        _key
                                      ].validate
                                    }
                                  </Text>
                                </View>
                              </View>
                            ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    paddingRight: 20,
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
  },
  headerTitleWrap: {
    paddingHorizontal: 10,
    flex: 1,
    alignItems: "center",
  },
  screenHeaderWrap: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: "3%",
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  payBtnWrap: {
    marginTop: 25,
    marginBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  featuresHeader: {
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  featuresHeaderWrap: {
    paddingHorizontal: 5,
    paddingTop: 20,
  },
  featTabContent: { fontWeight: "bold", color: COLORS.text_gray },

  featTabContentLabelWrap: {
    flex: 1.5,
    paddingHorizontal: 5,
    paddingVertical: Platform.OS === "ios" ? 10 : 7,
  },
  featTabContentWrap: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 5,
    paddingVertical: Platform.OS === "ios" ? 10 : 7,
  },
  featTabHed: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  featTabHedContentWrap: {
    flex: 1,
    alignItems: "center",
    padding: 5,
  },
  featTabHedRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_light,
    marginHorizontal: "3%",
  },
  featTabRow: {
    flexDirection: "row",
    borderBottomWidth: 0.7,
    borderBottomColor: COLORS.border_light,
    marginHorizontal: "3%",
  },
  headerWrap: {
    marginTop: "3%",
    backgroundColor: COLORS.bg_primary,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 10 : 7,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    marginHorizontal: "3%",
  },
  id: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTableLabel: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  paymentTableLabelWrap: {
    justifyContent: "center",
    flex: 2,
    paddingVertical: Platform.OS === "ios" ? 10 : 7,
    paddingHorizontal: 5,
  },
  paymentTableRow: {
    flexDirection: "row",

    borderBottomWidth: 0.7,
    borderBottomColor: COLORS.border_light,
    marginHorizontal: 10,
  },
  paymentTableValue: {
    fontWeight: "bold",
    color: COLORS.text_gray,
    textTransform: "capitalize",
  },
  paymentTableValueWrap: {
    justifyContent: "center",
    flex: 2.5,
    paddingHorizontal: 5,
    paddingVertical: Platform.OS === "ios" ? 10 : 7,
  },
  scrollWrap: {
    paddingBottom: 45,
  },
});

export default PaymentDetailScreen;
