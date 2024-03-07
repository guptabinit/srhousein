import React, { useState, useEffect, useCallback, useRef } from "react";
import { create } from "apisauce";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  SafeAreaView,
  TextInput,
  Pressable,
} from "react-native";
import {
  createPaymentMethod,
  useConfirmPayment,
} from "@stripe/stripe-react-native";
import { COLORS } from "../variables/color";
import { decodeString, getPrice } from "../helper/helper";
import { useStateValue } from "../StateProvider";
import PaymentMethodCard from "../components/PaymentMethodCard";
import AppSeparator from "../components/AppSeparator";
import AppTextButton from "../components/AppTextButton";

import { __ } from "../language/stringPicker";
import api, { apiKey, removeAuthToken, setAuthToken } from "../api/client";
import { AntDesign, FontAwesome5 } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import RazorpayCheckout from "react-native-razorpay";
import authStorage from "../app/auth/authStorage";
import { routes } from "../navigation/routes";
import BillingCountryPicker from "../components/BillingCountryPicker";

const PaymentMethodScreen = ({ navigation, route }) => {
  const [
    { config, ios, appSettings, auth_token, user, rtl_support },
    dispatch,
  ] = useStateValue();
  const [loading, setLoading] = useState(true);
  const [selected] = useState(route.params.selected);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentMethodData, setPaymentMethodData] = useState([]);
  const [keyboardStatus, setKeyboardStatus] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState();
  const [paymentError, setPaymentError] = useState();
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [cardData, setCardData] = useState();
  const [paypalData, setPaypalData] = useState(null);
  const [razorpayData, setRazorpayData] = useState(null);
  const [razorpaySuccess, setRazorpaySuccess] = useState(null);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [stripe3dConfirming, setStripe3dConfirming] = useState(false);
  const [wooCom, setWooCom] = useState(false);
  const [wooLoading, setWooLoading] = useState(false);
  const [wooModal, setWooModal] = useState(false);
  const [wooData, setWooData] = useState(null);
  const [wooComplete, setWooComplete] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [validCoupon, setValidCoupon] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [dataUpdating, setDataUpdating] = useState(false);
  const [webPaymentLoading, setWebPaymentLoading] = useState(false);
  const [webPaymentOrderLoading, setWebPaymentOrderLoading] = useState(false);
  const [webPaymentModal, setWebPaymentModal] = useState(false);
  const [webPaymentComplete, setWebPaymentComplete] = useState(false);
  const [billingForm, setBillingForm] = useState(null);
  const [billingData, setBillingData] = useState({});
  const [checkOutData, setCheckOutData] = useState({});
  const [countries, setCountries] = useState({});
  const [statesData, setStatesData] = useState({});
  const [countryLocale, setCountryLocale] = useState({});
  const [requiredFields, setRequiredFields] = useState([]);
  const [touchedFields, setTouchedFields] = useState([]);
  const [billingFormShown, setBillingFormShown] = useState(false);

  const scrollRef = useRef();
  const { confirmPayment, loading: stripeLoading } = useConfirmPayment();

  useEffect(() => {
    Keyboard.addListener("keyboardDidShow", _keyboardDidShow);
    Keyboard.addListener("keyboardDidHide", _keyboardDidHide);

    // cleanup function
    return () => {
      Keyboard.removeAllListeners("keyboardDidShow");
      Keyboard.removeAllListeners("keyboardDidHide");
    };
  }, []);

  const _keyboardDidShow = () => setKeyboardStatus(true);
  const _keyboardDidHide = () => setKeyboardStatus(false);

  useEffect(() => {
    if (!loading) return;
    getPaymentMethods();
  }, []);

  const getPaymentMethods = () => {
    api
      // .get("payment-gateways")
      .get("get-checkout-data")
      .then((res) => {
        if (res.ok) {
          setCheckOutData(res.data);
          if (res?.data?.address?.countries) {
            setCountries(res.data.address.countries);
          }
          if (res?.data?.address?.country_locale) {
            setCountryLocale(res.data.address.country_locale);
          }
          if (res?.data?.address?.states) {
            setStatesData(res.data.address.states);
          }
          if (res?.data?.billingFields) {
            setBillingForm(res.data.billingFields);
            const tempRequireds = [];
            const tempBillingData = {};
            Object.keys(res.data.billingFields).map((_dataKey) => {
              if (res.data.billingFields[_dataKey].required) {
                tempRequireds.push(_dataKey);
              }
              if (res?.data?.billingFields[_dataKey]?.value) {
                tempBillingData[`${_dataKey}`] =
                  res.data.billingFields[_dataKey].value;
              } else {
                const userKey = _dataKey.replace("billing_", "");
                if (userKey && user[userKey]) {
                  tempBillingData[`${_dataKey}`] = user[userKey];
                }
              }
            });
            setBillingData(tempBillingData);
            setRequiredFields(tempRequireds);
          }

          if (res?.data?.gateways?.id === "woo-payment") {
            setWooCom(true);
            setWooData(res.data.gateways);
          } else {
            setPaymentMethodData(res.data.gateways);
          }
        } else {
          alert(res?.data?.message);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handlePaymentMethodSelection = (method) => {
    setSelectedMethod(method);
    setCardData();
    if (!selectedMethod) {
      scrollRef.current.scrollToEnd();
      setTimeout(() => {
        setBillingFormShown(true);
      }, 500);
    }
  };

  const handlePayment = () => {
    Keyboard.dismiss();
    let args = {};
    if (
      !checkOutData?.billingAddressDisabled ||
      selectedMethod?.id === "iyzipay" ||
      route?.params?.type === "membership"
    ) {
      const tempTouched = Object.keys(billingForm);
      setTouchedFields(tempTouched);
      const tempErrors = requiredFields.filter((_rf) => !billingData[_rf]);
      if (tempErrors?.length > 0) {
        let errorString = "";
        const tempErrorLabels = tempErrors.map((_te) => billingForm[_te].label);
        if (tempErrorLabels.length === 1) {
          errorString = tempErrorLabels[0];
        } else {
          errorString = tempErrorLabels.join(",\n");
        }
        Alert.alert(
          __("paymentMethodScreen.billing.fieldRequiredAlert", appSettings.lng),
          __(
            "paymentMethodScreen.billing.fieldRequiredMessage",
            appSettings.lng
          ) + errorString,
          [
            {
              text: __(
                "paymentMethodScreen.billing.okBtnTitle",
                appSettings.lng
              ),
            },
          ]
        );
        return;
      } else {
        if (route?.params?.type === "membership") {
          args = {
            type: "membership",
            gateway_id: selectedMethod?.id,
            plan_id: route?.params?.selected?.id,
            ...billingData,
          };
        } else if (route?.params?.type === "promotion") {
          args = {
            type: "promotion",
            promotion_type: "regular",
            gateway_id: selectedMethod?.id,
            plan_id: route?.params?.selected?.id,
            listing_id: route?.params?.listingID,
            ...billingData,
          };
        }
      }
    } else {
      if (route?.params?.type === "membership") {
        args = {
          type: "membership",
          gateway_id: selectedMethod?.id,
          plan_id: route?.params?.selected?.id,
        };
      } else if (route?.params?.type === "promotion") {
        args = {
          type: "promotion",
          promotion_type: "regular",
          gateway_id: selectedMethod?.id,
          plan_id: route?.params?.selected?.id,
          listing_id: route?.params?.listingID,
        };
      }
    }

    if (config?.coupon && validCoupon && couponInfo && !couponError) {
      args.coupon_code = validCoupon;
    }

    if (selectedMethod?.id === "stripe") {
      handleStripeCardPayment(args);
    } else if (selectedMethod?.id === "authorizenet") {
      setPaymentLoading(true);
      setPaymentModal(true);
      handleAuthorizeCardPayment(args);
    } else if (selectedMethod?.id === "paypal") {
      setPaymentLoading(true);
      setPaymentModal(true);
      handlePaypalPayment(args);
    } else if (selectedMethod?.id === "razorpay") {
      handleRazorpayPayment(args);
    } else if (selectedMethod?.id === "iyzipay") {
      handleWebPayment(args, selectedMethod);
    } else {
      setPaymentLoading(true);
      setPaymentModal(true);
      handleCheckout(args);
    }
  };

  const handleWebPayment = (args, method) => {
    Keyboard.dismiss();
    setWebPaymentOrderLoading(true);
    setWebPaymentLoading(true);
    setWebPaymentModal(true);
    setAuthToken(auth_token);
    api
      .post("checkout", args)
      .then((res) => {
        if (res.ok) {
          setPaymentData(res.data);
          if (args?.gateway_id === "paypal" && res?.data?.redirect) {
            setPaypalData(res.data);
          }
          setWebPaymentOrderLoading(false);
        } else {
          setPaymentError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("paymentMethodScreen.unknownError", appSettings.lng)
          );
          setWebPaymentLoading(false);
          setWebPaymentOrderLoading(false);
        }
      })
      .then(() => {
        removeAuthToken();
      });
  };

  const handleWebPaymentModalClose = () => {
    setWebPaymentOrderLoading(false);
    setWebPaymentLoading(false);
    setWebPaymentModal(false);
  };

  const handleWebPaymentURLDataChange = (data) => {
    if (data?.canGoBack === true && data?.loading === false) {
      setWebPaymentComplete(true);
      return;
    }
    return;
  };

  const handleWebPaymentComplete = () => {
    //  navigation.pop(3);
    navigation.navigate(routes.paymentDetailScreen, {
      header: false,
      id: paymentData.id,
    });
  };

  const handlePaypalPayment = (args) => {
    setAuthToken(auth_token);
    api
      .post("checkout", args)
      .then((res) => {
        if (res.ok) {
          setPaymentData(res.data);
          setPaypalLoading(true);
          setPaymentLoading(false);
          if (args?.gateway_id === "paypal" && res?.data?.redirect) {
            setPaypalData(res.data);
          }
        } else {
          setPaymentError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("paymentMethodScreen.unknownError", appSettings.lng)
          );
        }
      })
      .then(() => {
        removeAuthToken();
      });
  };
  const handleRazorpayPayment = (args) => {
    setAuthToken(auth_token);
    setRazorpayLoading(true);
    api
      .post("checkout", args)
      .then((res) => {
        if (res.ok) {
          setPaymentData(res.data);
          if (args?.gateway_id === "razorpay" && res?.data?.redirect) {
            var options = {
              key: res.data.checkout_data.key,
              currency: res.data.checkout_data.currency,
              description: res.data.checkout_data.description,
              name: res.data.checkout_data.name,
              order_id: res.data.checkout_data.order_id,
              notes: {
                rtcl_payment_id: res.data.id,
              },
            };

            RazorpayCheckout.open(options).then((data) => {
              razorpayConfirm(data, res.data);
            });
          }
        } else {
          setPaymentError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("paymentMethodScreen.unknownError", appSettings.lng)
          );
        }
      })
      .then(() => {
        removeAuthToken();
        setRazorpayLoading(false);
      });
  };

  const razorpayConfirm = (rpData, pData) => {
    if (!rpData?.razorpay_payment_id || !rpData?.razorpay_signature) {
      setPaymentError(__("paymentMethodScreen.unknownError", appSettings.lng));
      setPaypalLoading(false);
      setPaymentLoading(false);
      return;
    }
    setRazorpaySuccess(true);
    setPaymentLoading(true);
    setPaymentModal(true);
    var formdata = new FormData();
    formdata.append("payment_id", pData.id);
    formdata.append("rest_api", 1);
    formdata.append("razorpay_payment_id", rpData.razorpay_payment_id);
    formdata.append("razorpay_order_id", rpData.razorpay_order_id);
    formdata.append("razorpay_signature", rpData.razorpay_signature);
    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("X-API-KEY", apiKey);
    myHeaders.append("Authorization", "Bearer " + auth_token);

    fetch(pData.auth_api_url, {
      method: "POST",
      body: formdata,
      headers: myHeaders,
    })
      .then((response) => response.json())
      .then((json) => {
        if (json?.success) {
          setPaymentData(json.data);
        }
      })
      .catch((error) => alert(error))
      .finally(() => {
        setPaypalLoading(false);
        setPaymentLoading(false);
      });
  };

  const handleCheckout = (args) => {
    setAuthToken(auth_token);
    api
      .post("checkout", args)
      .then((res) => {
        if (res.ok) {
          setPaymentData(res.data);
        } else {
          setPaymentError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("paymentMethodScreen.unknownError", appSettings.lng)
          );
        }
      })
      .then(() => {
        removeAuthToken();
        setPaymentLoading(false);
      });
  };

  const handleCardData = (cardData) => {
    setCardData(cardData);
  };

  const proccedPaymentBtn =
    selectedMethod?.id === "stripe" && !cardData?.complete;

  const handleStripeCardPayment = async (args) => {
    if (!cardData?.complete) {
      Alert.alert(
        __("paymentMethodScreen.invalidCardMessage", appSettings.lng)
      );
      return;
    }
    setPaymentLoading(true);
    setPaymentModal(true);
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
      setPaymentLoading(false);
      setPaymentError(error.message);
      Alert.alert(error.message);
      return;
    }
    setAuthToken(auth_token);
    api
      .post("checkout", {
        ...args,
        stripe_payment_method: paymentMethod?.id || "",
      })
      .then(async (res) => {
        if (res.ok) {
          if (
            res?.data?.requiresAction &&
            res?.data?.payment_intent_client_secret
          ) {
            setStripe3dConfirming(true);

            const { error, paymentIntent } = await confirmPayment(
              res?.data?.payment_intent_client_secret,
              {
                paymentMethodType: "Card",
              }
            );
            if (error) {
              setPaymentData(res?.data);
              return;
            }
            const raw_api = create({
              baseURL: res?.data?.gateway.routes.confirm_payment_intent,
              headers: {
                Accept: "application/json",
                "X-API-KEY": apiKey,
              },
              timeout: 30000,
            });
            raw_api.setHeader("Authorization", "Bearer " + auth_token);
            raw_api
              .post("", {
                rest_api: true,
                order_id: res?.data.id,
              })
              .then((confirmRes) => {
                if (confirmRes.ok && confirmRes?.data.result === "success") {
                  setPaymentData(confirmRes?.data.order_data);
                } else {
                  setPaymentData(res?.data);
                }
              });
          } else {
            setPaymentData(res?.data);
          }
        } else {
          setPaymentError(
            res?.data?.error_message || res?.data?.error || res?.problem
          );
        }
      })
      .then(() => {
        removeAuthToken();
        setPaymentLoading(false);
        setStripe3dConfirming(false);
      });
  };

  const handleAuthorizeCardPayment = (args) => {
    if (!cardData?.complete) {
      Alert.alert(
        __("paymentMethodScreen.invalidCardMessage", appSettings.lng)
      );
      return;
    }

    setAuthToken(auth_token);
    api
      .post("checkout", {
        card_number: cardData?.number,
        card_exp_month: cardData?.expiryMonth,
        card_exp_year: cardData?.expiryYear,
        card_cvc: cardData?.cvc,
        ...args,
      })
      .then((res) => {
        if (res.ok) {
          setPaymentData(res?.data);
        } else {
          setPaymentError(
            res?.data?.message ||
              res?.data?.error ||
              res?.problem ||
              res?.status
          );
        }
      })
      .then(() => {
        removeAuthToken();
        setPaymentLoading(false);
      });
  };

  const handlePaymentSumaryDismiss = () => {
    Keyboard.dismiss();
    if (paymentError) {
      setPaymentModal(false);
      setPaymentError();
      return;
    }
    setPaymentModal(false);
    updateProfileData();
  };
  const updateProfileData = () => {
    setDataUpdating(true);
    setAuthToken(auth_token);
    api
      .get("my")
      .then((res) => {
        if (res.ok) {
          dispatch({
            type: "SET_AUTH_DATA",
            data: { user: res.data },
          });
          authStorage.storeUser(JSON.stringify(res.data));
        }
      })
      .finally(() => {
        removeAuthToken();
        setDataUpdating(false);
        navigation.pop(3);
      });
  };

  const handleWebviewDataChange = (data) => {
    if (data.url.search("rtcl_return=success") > -1) {
      setPaymentModal(false);
      navigation.pop(3);
      return;
    } else if (data.url.search("rtcl_return=cancel") > -1) {
      setPaymentModal(false);
      setPaymentLoading(false);
      return;
    }

    return;
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

  const handleWooPayment = () => {
    Keyboard.dismiss();
    setWooLoading(true);
    setWooModal(true);
  };

  const handleWooModalClose = () => {
    setWooLoading(false);
    setWooModal(false);
  };

  const handleWooURLDataChange = (data) => {
    if (
      data.url.search("order-received") > -1 &&
      data.loading === false &&
      data.canGoBack === true
    ) {
      setWooComplete(true);
      return;
    }

    return;
  };

  const handleCouponApplication = () => {
    setCouponLoading(true);
    setCouponError(null);
    setCouponInfo(null);
    setValidCoupon("");
    setAuthToken(auth_token);
    const params = {
      plan_id: route.params.selected.id,
      coupon_code: coupon,
    };
    api
      .post("coupon/apply", params)
      .then((res) => {
        if (res.ok) {
          setCouponInfo(res.data);
          setValidCoupon(coupon);
          setCoupon("");
        } else {
          setCouponError(
            res?.data?.message ||
              __("paymentMethodScreen.couponValidationFailed", appSettings.lng)
          );
        }
      })
      .catch((error) => console.log(error))
      .finally(() => {
        removeAuthToken();
        setCouponLoading(false);
      });
  };

  const handleCouponRemove = () => {
    setCoupon();
    setValidCoupon();
    setCouponError();
    setCouponInfo();
  };

  const setFormFieldData = (field, data) => {
    const tempData = { ...billingData };
    tempData[field] = data;
    if (field === "billing_country") {
      tempData["billing_state"] = null;
      tempData["billing_postcode"] = null;
      const sltCountry = data;
      const stateCondition = sltCountry ? countryLocale[sltCountry] : null;
      if (stateCondition?.state?.required == false) {
        const tempReq = requiredFields.filter(
          (_field) => _field !== "billing_state"
        );
        setRequiredFields(tempReq);
      }
      const zipCondition = sltCountry ? countryLocale[sltCountry] : null;
      if (zipCondition?.postcode?.required == false) {
        const tempReq = requiredFields.filter(
          (_field) => _field !== "billing_postcode"
        );
        setRequiredFields(tempReq);
      }
    }
    setBillingData(tempData);
  };

  const renderBillingStateField = () => {
    const sltCountry =
      billingData?.billing_country ||
      billingForm?.billing_state?.country ||
      null;
    const availableStates = sltCountry ? statesData[sltCountry] : null;
    const stateCondition = sltCountry ? countryLocale[sltCountry] : null;
    if (!billingForm?.billing_state || stateCondition?.state?.hidden) {
      return null; // TODO: Required field , clease state data
    }
    const zipLabel =
      stateCondition?.state?.label ||
      billingForm?.billing_state?.label ||
      __("paymentMethodScreen.billing.stateTitle", appSettings.lng);
    return (
      <View style={styles.fullFieldWrap}>
        <View style={styles.billingFieldWrap}>
          <View style={styles.fieldTitleWrap}>
            <Text style={styles.fieldTitle}>
              {zipLabel}
              {requiredFields?.includes("billing_state") && (
                <Text style={styles.requiredStar}>{" *"}</Text>
              )}
            </Text>
          </View>
          <View style={styles.inputPickerWrap}>
            {availableStates == null ||
            Object.keys(availableStates).length < 1 ? (
              <View style={styles.inputWrap}>
                <TextInput
                  placeholderTextColor={COLORS.text_light}
                  style={[styles.inputCommon, rtlText]}
                  onChangeText={(text) =>
                    setFormFieldData("billing_state", text)
                  }
                  onBlur={() => handleTouched("billing_state")}
                  value={billingData?.billing_state || ""}
                  placeholder={
                    billingForm?.billing_state?.placeholder ||
                    __(
                      "paymentMethodScreen.billing.statePlaceholder",
                      appSettings.lng
                    )
                  }
                />
              </View>
            ) : (
              <BillingCountryPicker
                onselect={(item) => setFormFieldData("billing_state", item)}
                selected={billingData?.billing_state || null}
                field={billingForm?.billing_state || {}}
                handleTouch={() => handleTouched("billing_state")}
                options={availableStates}
              />
            )}
          </View>
          <View style={styles.fieldErrorWrap}>
            <Text style={styles.fieldError}>
              {requiredFields?.includes("billing_state") &&
                touchedFields?.includes("billing_state") &&
                !billingData.billing_state &&
                __(
                  "paymentMethodScreen.billing.requiredError",
                  appSettings.lng
                )}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // const renderBillingPostCodeField = useCallback(() => {
  //   // return null;
  //   const sltCountry = billingData?.billing_country || null;
  //   const zipCondition = sltCountry ? countryLocale[sltCountry] : null;
  //   if (!billingForm?.billing_postcode || zipCondition?.postcode?.hidden) {
  //     return null; // TODO: Required field , clease state data
  //   }
  //   const zipLabel =
  //     zipCondition?.postcode?.label ||
  //     billingForm?.billing_postcode?.label ||
  //     __("paymentMethodScreen.billing.postCodeTitle", appSettings.lng);
  //   return (
  //     <View style={styles.fullFieldWrap}>
  //       <View style={styles.billingFieldWrap}>
  //         <View style={styles.fieldTitleWrap}>
  //           <Text style={styles.fieldTitle}>
  //             {zipLabel}
  //             {requiredFields?.includes("billing_postcode") && (
  //               <Text style={styles.requiredStar}>{" *"}</Text>
  //             )}
  //           </Text>
  //         </View>
  //         <View style={styles.inputPickerWrap}>
  //           <TextInput
  //             placeholderTextColor={COLORS.text_light}
  //             style={[styles.inputCommon, rtlText]}
  //             onChangeText={(text) =>
  //               setFormFieldData("billing_postcode", text)
  //             }
  //             onBlur={() => handleTouched("billing_postcode")}
  //             value={billingData?.billing_postcode || ""}
  //             placeholder={
  //               billingForm?.billing_postcode?.placeholder ||
  //               __(
  //                 "paymentMethodScreen.billing.postCodePlaceholder",
  //                 appSettings.lng
  //               )
  //             }
  //           />
  //         </View>
  //         <View style={styles.fieldErrorWrap}>
  //           <Text style={styles.fieldError}>
  //             {requiredFields?.includes("billing_postcode") &&
  //               touchedFields?.includes("billing_postcode") &&
  //               !billingData.billing_postcode &&
  //               __(
  //                 "paymentMethodScreen.billing.requiredError",
  //                 appSettings.lng
  //               )}
  //           </Text>
  //         </View>
  //       </View>
  //     </View>
  //   );
  // }, []);
  const renderBillingPostCodeField = () => {
    // return null;
    const sltCountry = billingData?.billing_country || null;
    const zipCondition = sltCountry ? countryLocale[sltCountry] : null;
    if (!billingForm?.billing_postcode || zipCondition?.postcode?.hidden) {
      return null; // TODO: Required field , clease state data
    }
    const zipLabel =
      zipCondition?.postcode?.label ||
      billingForm?.billing_postcode?.label ||
      __("paymentMethodScreen.billing.postCodeTitle", appSettings.lng);
    return (
      <View style={styles.fullFieldWrap}>
        <View style={styles.billingFieldWrap}>
          <View style={styles.fieldTitleWrap}>
            <Text style={styles.fieldTitle}>
              {zipLabel}
              {requiredFields?.includes("billing_postcode") && (
                <Text style={styles.requiredStar}>{" *"}</Text>
              )}
            </Text>
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              placeholderTextColor={COLORS.text_light}
              style={[styles.inputCommon, rtlText]}
              onChangeText={(text) =>
                setFormFieldData("billing_postcode", text)
              }
              onBlur={() => handleTouched("billing_postcode")}
              value={billingData?.billing_postcode || ""}
              placeholder={
                billingForm?.billing_postcode?.placeholder ||
                __(
                  "paymentMethodScreen.billing.postCodePlaceholder",
                  appSettings.lng
                )
              }
            />
          </View>
          <View style={styles.fieldErrorWrap}>
            <Text style={styles.fieldError}>
              {requiredFields?.includes("billing_postcode") &&
                touchedFields?.includes("billing_postcode") &&
                !billingData.billing_postcode &&
                __(
                  "paymentMethodScreen.billing.requiredError",
                  appSettings.lng
                )}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const handleTouched = (field) => {
    setTouchedFields((prevtouchedFields) =>
      Array.from(new Set([...prevtouchedFields, field]))
    );
  };

  const handleBillingFormToggle = () => {
    setBillingFormShown((prevBFS) => !prevBFS);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={ios ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        keyboardShouldPersistTaps="never"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 90,
        }}
        ref={scrollRef}
      >
        <View style={[styles.paymentDetailWrap]}>
          <View
            style={[
              styles.paymentDetailHeaderWrap,
              { alignItems: rtl_support ? "flex-end" : "flex-start" },
            ]}
          >
            <Text style={[styles.paymentDetailHeaderText, rtlTextA]}>
              {__("paymentMethodScreen.paymentDetail", appSettings.lng)}
            </Text>
          </View>
          <View style={{ paddingHorizontal: "5%" }}>
            {route?.params?.type === "membership" && (
              <View style={[styles.selectedPackageWrap, rtlView]}>
                <View style={{ marginRight: rtl_support ? 0 : 10 }}>
                  <Text style={[styles.selectedLabelText, rtlTextA]}>
                    {__("paymentMethodScreen.selectedPackage", appSettings.lng)}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    alignItems: rtl_support ? "flex-start" : "flex-end",
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={styles.selectedPackageNameText}
                  >
                    {selected.title}
                  </Text>
                </View>
              </View>
            )}
            {route?.params?.type === "promotion" && (
              <>
                <View style={[styles.selectedPackageWrap, rtlView]}>
                  <View style={{ marginRight: rtl_support ? 0 : 10 }}>
                    <Text style={[styles.selectedLabelText, rtlTextA]}>
                      {__(
                        "paymentMethodScreen.promotionConfirmation",
                        appSettings.lng
                      )}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      alignItems: rtl_support ? "flex-start" : "flex-end",
                    }}
                  >
                    <Text style={[styles.selectedPackageNameText, rtlText]}>
                      {decodeString(route.params.listingTitle)}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.selectedPackageWrap,
                    rtlView,
                    { marginTop: 15 },
                  ]}
                >
                  <View style={{ marginRight: rtl_support ? 0 : 10 }}>
                    <Text style={[styles.selectedLabelText, rtlTextA]}>
                      {__("paymentMethodScreen.promotionPlan", appSettings.lng)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      alignItems: rtl_support ? "flex-start" : "flex-end",
                    }}
                  >
                    <Text style={[styles.selectedPackageNameText, rtlText]}>
                      {decodeString(selected.title)}
                    </Text>
                  </View>
                </View>
              </>
            )}

            <AppSeparator style={styles.separator} />
            <View style={styles.pricingWrap}>
              <View style={[styles.priceRow, rtlView]}>
                <Text style={[styles.priceRowLabel, rtlText]}>
                  {__(
                    route.params.type === "membership"
                      ? "paymentMethodScreen.packagePrice"
                      : "paymentMethodScreen.promotionPrice",
                    appSettings.lng
                  )}
                </Text>
                <Text style={[styles.priceRowValue, rtlText]} numberOfLines={1}>
                  {getPrice(
                    config.payment_currency,
                    {
                      pricing_type: "price",
                      price_type: "",
                      price: selected.price,
                      max_price: 0,
                    },
                    appSettings.lng
                  )}
                </Text>
              </View>
            </View>
            {couponInfo && config?.coupon && (
              <>
                <AppSeparator style={styles.separator} />
                <View style={styles.pricingWrap}>
                  <View style={[styles.priceRow, rtlView]}>
                    <Text style={[styles.priceRowLabel, rtlText]}>
                      {__(
                        "paymentMethodScreen.couponDiscount",
                        appSettings.lng
                      )}
                    </Text>
                    <View
                      style={[
                        {
                          alignItems: "center",
                          flexDirection: "row",
                        },
                        rtlView,
                      ]}
                    >
                      <Pressable onPress={handleCouponRemove}>
                        <View
                          style={{
                            backgroundColor: COLORS.red,
                            paddingHorizontal: 10,
                            paddingVertical: 3,
                            borderRadius: 3,
                            marginHorizontal: 5,
                          }}
                        >
                          <Text style={{ fontSize: 12, color: COLORS.white }}>
                            {__(
                              "paymentMethodScreen.removeButton",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                      </Pressable>
                      <Text
                        style={[
                          styles.priceRowValue,
                          { color: COLORS.green },
                          rtlText,
                        ]}
                        numberOfLines={1}
                      >
                        {getPrice(
                          config.payment_currency,
                          {
                            pricing_type: "price",
                            price_type: "",
                            price: `-${couponInfo.discount}`,
                            max_price: 0,
                          },
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
            <AppSeparator style={styles.separator} />
            <View style={styles.pricingWrap}>
              <View style={[styles.priceRow, rtlView]}>
                <Text
                  style={[
                    styles.priceRowLabel,
                    { color: COLORS.text_dark },
                    rtlText,
                  ]}
                >
                  {__("paymentMethodScreen.subTotal", appSettings.lng)}
                </Text>
                <Text
                  style={[
                    styles.priceRowValue,
                    { color: COLORS.primary },
                    rtlText,
                  ]}
                  numberOfLines={1}
                >
                  {getPrice(
                    config.payment_currency,
                    {
                      pricing_type: "price",
                      price_type: "",
                      price:
                        couponInfo?.discount && config?.coupon
                          ? couponInfo.subtotal
                          : selected.price,
                      max_price: 0,
                    },
                    appSettings.lng
                  )}
                </Text>
              </View>
            </View>
            {config?.coupon && (
              <>
                <AppSeparator style={styles.separator} />
                <View style={styles.couponWrap}>
                  <View style={[styles.couponRowWrap, rtlView]}>
                    <View style={styles.couponFieldWrap}>
                      <TextInput
                        style={[
                          styles.couponField,
                          {
                            marginRight: rtl_support ? 0 : 10,
                            marginLeft: rtl_support ? 10 : 0,
                          },
                          rtlText,
                        ]}
                        value={coupon}
                        onChangeText={(text) => setCoupon(text)}
                        placeholder={__(
                          "paymentMethodScreen.couponPlaceholder",
                          appSettings.lng
                        )}
                        placeholderTextColor={COLORS.border_light}
                      />
                    </View>
                    <Pressable onPress={handleCouponApplication}>
                      <View
                        style={[
                          styles.couponApplyBtn,
                          {
                            backgroundColor: coupon
                              ? COLORS.button.active
                              : COLORS.button.disabled,
                          },
                        ]}
                      >
                        <Text style={[styles.couponApply, rtlText]}>
                          {__(
                            "paymentMethodScreen.applyButton",
                            appSettings.lng
                          )}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
            {!!couponError && (
              <View style={styles.couponErrorWrap}>
                <Text style={[styles.couponError, rtlText]}>
                  {couponError ||
                    __(
                      "paymentMethodScreen.couponValidationFailed",
                      appSettings.lng
                    )}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={{ paddingVertical: 10 }} />
        {!wooCom && (
          <>
            <View style={styles.paymentSectionWrap}>
              <View
                style={[
                  styles.paymentSectionTitle,
                  { alignItems: rtl_support ? "flex-end" : "flex-start" },
                ]}
              >
                <Text
                  style={[styles.paymentHeaderTitle, rtlText]}
                  numberOfLines={1}
                >
                  {__("paymentMethodScreen.choosePayment", appSettings.lng)}
                </Text>
              </View>
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={COLORS.primary} size="large" />
                </View>
              ) : (
                <View style={styles.paymentMethodsWrap}>
                  {paymentMethodData && Array.isArray(paymentMethodData) ? (
                    paymentMethodData.map((method, index, arr) => (
                      <PaymentMethodCard
                        key={method.id}
                        method={method}
                        isLast={arr.length - 1 === index}
                        onSelect={handlePaymentMethodSelection}
                        selected={selectedMethod}
                        onCardDataUpdate={handleCardData}
                      />
                    ))
                  ) : (
                    <Text style={styles.text}>
                      {__(
                        "paymentMethodScreen.noPaymentGateway",
                        appSettings.lng
                      )}
                    </Text>
                  )}
                </View>
              )}
            </View>
            {billingForm &&
              (route?.params?.type === "membership" ||
                selectedMethod?.id === "iyzipay" ||
                !checkOutData?.billingAddressDisabled) && (
                <View style={[styles.billingDetailWrap, { paddingBottom: 0 }]}>
                  <Pressable
                    style={[
                      styles.paymentDetailHeaderWrap,
                      rtlView,
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      },
                    ]}
                    onPress={handleBillingFormToggle}
                  >
                    <Text style={[styles.paymentDetailHeaderText, rtlTextA]}>
                      {__("paymentMethodScreen.billing.title", appSettings.lng)}
                    </Text>
                    <View
                      style={{
                        height: 20,
                        width: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 20 / 2,
                        backgroundColor: COLORS.white,
                      }}
                    >
                      <AntDesign
                        name={billingFormShown ? "arrowup" : "arrowright"}
                        size={15}
                        color={COLORS.primary}
                      />
                    </View>
                  </Pressable>
                  {billingFormShown && (
                    <View style={{ paddingHorizontal: "5%" }}>
                      <View style={styles.billingFormWrap}>
                        {(billingForm?.billing_first_name ||
                          billingForm?.billing_last_name) && (
                          <View style={styles.halfFieldsWrap}>
                            {billingForm?.billing_first_name && (
                              <View style={styles.halfFieldWrap}>
                                <View style={styles.fieldTitleWrap}>
                                  <Text style={styles.fieldTitle}>
                                    {billingForm?.billing_first_name?.label ||
                                      __(
                                        "paymentMethodScreen.billing.firstNameTitle",
                                        appSettings.lng
                                      )}
                                    {requiredFields?.includes(
                                      "billing_first_name"
                                    ) && (
                                      <Text style={styles.requiredStar}>
                                        {" *"}
                                      </Text>
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.inputWrap}>
                                  <TextInput
                                    placeholderTextColor={COLORS.text_light}
                                    style={[styles.inputCommon, rtlText]}
                                    onChangeText={(text) =>
                                      setFormFieldData(
                                        "billing_first_name",
                                        text
                                      )
                                    }
                                    onBlur={() =>
                                      handleTouched("billing_first_name")
                                    }
                                    value={
                                      billingData?.billing_first_name || ""
                                    }
                                    placeholder={
                                      billingForm?.billing_first_name
                                        ?.placeholder ||
                                      __(
                                        "paymentMethodScreen.billing.firstNamePlaceholder",
                                        appSettings.lng
                                      )
                                    }
                                  />
                                </View>
                                <View style={styles.fieldErrorWrap}>
                                  <Text style={styles.fieldError}>
                                    {requiredFields?.includes(
                                      "billing_first_name"
                                    ) &&
                                      touchedFields?.includes(
                                        "billing_first_name"
                                      ) &&
                                      !billingData.billing_first_name &&
                                      __(
                                        "paymentMethodScreen.billing.requiredError",
                                        appSettings.lng
                                      )}
                                  </Text>
                                </View>
                              </View>
                            )}
                            <View style={{ width: 10 }} />
                            {billingForm?.billing_last_name && (
                              <View style={styles.halfFieldWrap}>
                                <View style={styles.fieldTitleWrap}>
                                  <Text style={styles.fieldTitle}>
                                    {billingForm?.billing_last_name?.label ||
                                      __(
                                        "paymentMethodScreen.billing.lastNameTitle",
                                        appSettings.lng
                                      )}
                                    {requiredFields?.includes(
                                      "billing_last_name"
                                    ) && (
                                      <Text style={styles.requiredStar}>
                                        {" *"}
                                      </Text>
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.inputWrap}>
                                  <TextInput
                                    placeholderTextColor={COLORS.text_light}
                                    style={[styles.inputCommon, rtlText]}
                                    onChangeText={(text) =>
                                      setFormFieldData(
                                        "billing_last_name",
                                        text
                                      )
                                    }
                                    onBlur={() =>
                                      handleTouched("billing_last_name")
                                    }
                                    value={billingData?.billing_last_name || ""}
                                    placeholder={
                                      billingForm?.billing_last_name
                                        ?.placeholder ||
                                      __(
                                        "paymentMethodScreen.billing.lastNamePlaceholder",
                                        appSettings.lng
                                      )
                                    }
                                  />
                                </View>
                                <View style={styles.fieldErrorWrap}>
                                  <Text style={styles.fieldError}>
                                    {requiredFields?.includes(
                                      "billing_last_name"
                                    ) &&
                                      touchedFields?.includes(
                                        "billing_last_name"
                                      ) &&
                                      !billingData.billing_last_name &&
                                      __(
                                        "paymentMethodScreen.billing.requiredError",
                                        appSettings.lng
                                      )}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        )}
                        {billingForm?.billing_company && (
                          <View style={styles.fullFieldWrap}>
                            <View style={styles.billingFieldWrap}>
                              <View style={styles.fieldTitleWrap}>
                                <Text style={styles.fieldTitle}>
                                  {billingForm?.billing_company?.label ||
                                    __(
                                      "paymentMethodScreen.billing.companyTitle",
                                      appSettings.lng
                                    )}
                                  {requiredFields?.includes(
                                    "billing_company"
                                  ) && (
                                    <Text style={styles.requiredStar}>
                                      {" *"}
                                    </Text>
                                  )}
                                </Text>
                              </View>
                              <View style={styles.inputWrap}>
                                <TextInput
                                  placeholderTextColor={COLORS.text_light}
                                  style={[styles.inputCommon, rtlText]}
                                  onChangeText={(text) =>
                                    setFormFieldData("billing_company", text)
                                  }
                                  onBlur={() =>
                                    handleTouched("billing_company")
                                  }
                                  value={billingData?.billing_company || ""}
                                  placeholder={
                                    billingForm?.billing_company?.placeholder ||
                                    __(
                                      "paymentMethodScreen.billing.companyPlaceholder",
                                      appSettings.lng
                                    )
                                  }
                                />
                              </View>
                              <View style={styles.fieldErrorWrap}>
                                <Text style={styles.fieldError}>
                                  {requiredFields?.includes(
                                    "billing_company"
                                  ) &&
                                    touchedFields?.includes(
                                      "billing_company"
                                    ) &&
                                    !billingData.billing_company &&
                                    __(
                                      "paymentMethodScreen.billing.requiredError",
                                      appSettings.lng
                                    )}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}
                        {billingForm?.billing_country && (
                          <View style={styles.fullFieldWrap}>
                            <View style={styles.billingFieldWrap}>
                              <View style={styles.fieldTitleWrap}>
                                <Text style={styles.fieldTitle}>
                                  {billingForm?.billing_country?.label ||
                                    __(
                                      "paymentMethodScreen.billing.countryTitle",
                                      appSettings.lng
                                    )}
                                  {requiredFields?.includes(
                                    "billing_country"
                                  ) && (
                                    <Text style={styles.requiredStar}>
                                      {" *"}
                                    </Text>
                                  )}
                                </Text>
                              </View>
                              <View style={styles.inputPickerWrap}>
                                <BillingCountryPicker
                                  onselect={(item) => {
                                    setFormFieldData("billing_country", item);
                                    setTimeout(() => {}, 1000);
                                  }}
                                  selected={
                                    billingData?.billing_country || null
                                  }
                                  field={billingForm.billing_country}
                                  handleTouch={() =>
                                    handleTouched("billing_country")
                                  }
                                  options={countries || {}}
                                />
                              </View>
                              <View style={styles.fieldErrorWrap}>
                                <Text style={styles.fieldError}>
                                  {requiredFields?.includes(
                                    "billing_country"
                                  ) &&
                                    touchedFields?.includes(
                                      "billing_country"
                                    ) &&
                                    !billingData.billing_country &&
                                    __(
                                      "paymentMethodScreen.billing.requiredError",
                                      appSettings.lng
                                    )}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}
                        {billingForm?.billing_address_1 && (
                          <View style={styles.fullFieldWrap}>
                            <View style={styles.billingFieldWrap}>
                              <View style={styles.fieldTitleWrap}>
                                <Text style={styles.fieldTitle}>
                                  {billingForm?.billing_address_1?.label ||
                                    __(
                                      "paymentMethodScreen.billing.streetAddressTitle",
                                      appSettings.lng
                                    )}
                                  {requiredFields?.includes(
                                    "billing_address_1"
                                  ) && (
                                    <Text style={styles.requiredStar}>
                                      {" *"}
                                    </Text>
                                  )}
                                </Text>
                              </View>
                              <View style={styles.inputWrap}>
                                <TextInput
                                  placeholderTextColor={COLORS.text_light}
                                  style={[styles.inputCommon, rtlText]}
                                  onChangeText={(text) =>
                                    setFormFieldData("billing_address_1", text)
                                  }
                                  onBlur={() =>
                                    handleTouched("billing_address_1")
                                  }
                                  value={billingData?.billing_address_1 || ""}
                                  placeholder={
                                    billingForm?.billing_address_1
                                      ?.placeholder ||
                                    __(
                                      "paymentMethodScreen.billing.streetAddressPlaceholder",
                                      appSettings.lng
                                    )
                                  }
                                />
                              </View>
                              <View style={styles.fieldErrorWrap}>
                                <Text style={styles.fieldError}>
                                  {requiredFields?.includes(
                                    "billing_address_1"
                                  ) &&
                                    touchedFields?.includes(
                                      "billing_address_1"
                                    ) &&
                                    !billingData.billing_address_1 &&
                                    __(
                                      "paymentMethodScreen.billing.requiredError",
                                      appSettings.lng
                                    )}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}
                        {billingForm?.billing_address_2 && (
                          <View style={styles.fullFieldWrap}>
                            <View style={styles.billingFieldWrap}>
                              {/* <View style={styles.fieldTitleWrap}>
                        <Text style={styles.fieldTitle}>
                          {billingForm?.billing_address_2?.label ||
                            __(
                              "paymentMethodScreen.billing.addressLine2Title",
                              appSettings.lng
                            )}
                          {(
                            requiredFields?.includes("billing_address_2")) && (
                            <Text style={styles.requiredStar}>{" *"}</Text>
                          )}
                        </Text>
                      </View> */}
                              <View style={styles.inputWrap}>
                                <TextInput
                                  placeholderTextColor={COLORS.text_light}
                                  style={[styles.inputCommon, rtlText]}
                                  onChangeText={(text) =>
                                    setFormFieldData("billing_address_2", text)
                                  }
                                  onBlur={() =>
                                    handleTouched("billing_address_2")
                                  }
                                  value={billingData?.billing_address_2 || ""}
                                  placeholder={
                                    billingForm?.billing_address_2
                                      ?.placeholder ||
                                    __(
                                      "paymentMethodScreen.billing.addressLine2Placeholder",
                                      appSettings.lng
                                    )
                                  }
                                />
                              </View>
                              <View style={styles.fieldErrorWrap}>
                                <Text style={styles.fieldError}>
                                  {requiredFields?.includes(
                                    "billing_address_2"
                                  ) &&
                                    touchedFields?.includes(
                                      "billing_address_2"
                                    ) &&
                                    !billingData.billing_address_2 &&
                                    __(
                                      "paymentMethodScreen.billing.requiredError",
                                      appSettings.lng
                                    )}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}
                        {billingForm?.billing_city && (
                          <View style={styles.fullFieldWrap}>
                            <View style={styles.billingFieldWrap}>
                              <View style={styles.fieldTitleWrap}>
                                <Text style={styles.fieldTitle}>
                                  {billingForm?.billing_city?.label ||
                                    __(
                                      "paymentMethodScreen.billing.cityorTownTitle",
                                      appSettings.lng
                                    )}
                                  {requiredFields?.includes("billing_city") && (
                                    <Text style={styles.requiredStar}>
                                      {" *"}
                                    </Text>
                                  )}
                                </Text>
                              </View>
                              <View style={styles.inputWrap}>
                                <TextInput
                                  placeholderTextColor={COLORS.text_light}
                                  style={[styles.inputCommon, rtlText]}
                                  onChangeText={(text) =>
                                    setFormFieldData("billing_city", text)
                                  }
                                  onBlur={() => handleTouched("billing_city")}
                                  value={billingData?.billing_city || ""}
                                  placeholder={
                                    billingForm?.billing_city?.placeholder ||
                                    __(
                                      "paymentMethodScreen.billing.cityorTownPlaceholder",
                                      appSettings.lng
                                    )
                                  }
                                />
                              </View>
                              <View style={styles.fieldErrorWrap}>
                                <Text style={styles.fieldError}>
                                  {requiredFields?.includes("billing_city") &&
                                    touchedFields?.includes("billing_city") &&
                                    !billingData.billing_city &&
                                    __(
                                      "paymentMethodScreen.billing.requiredError",
                                      appSettings.lng
                                    )}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}
                        {renderBillingStateField()}

                        {renderBillingPostCodeField()}

                        {(billingForm?.billing_phone_country_code ||
                          billingForm?.billing_phone) && (
                          <View style={styles.halfFieldsWrap}>
                            {billingForm?.billing_phone_country_code && (
                              <View style={{ flex: 1 }}>
                                <View style={styles.fieldTitleWrap}>
                                  <Text style={styles.fieldTitle}>
                                    {billingForm?.billing_phone_country_code
                                      ?.label ||
                                      __(
                                        "paymentMethodScreen.billing.countryCodeTitle",
                                        appSettings.lng
                                      )}
                                    {requiredFields?.includes(
                                      "billing_phone_country_code"
                                    ) && (
                                      <Text style={styles.requiredStar}>
                                        {" *"}
                                      </Text>
                                    )}
                                  </Text>
                                </View>
                                <BillingCountryPicker
                                  onselect={(item) =>
                                    setFormFieldData(
                                      "billing_phone_country_code",
                                      item
                                    )
                                  }
                                  selected={
                                    billingData?.billing_phone_country_code ||
                                    null
                                  }
                                  field={
                                    billingForm?.billing_phone_country_code ||
                                    {}
                                  }
                                  handleTouch={() =>
                                    handleTouched("billing_state")
                                  }
                                  options={
                                    billingForm?.billing_phone_country_code
                                      .options || {}
                                  }
                                />
                                <View style={styles.fieldErrorWrap}>
                                  <Text style={styles.fieldError}>
                                    {requiredFields?.includes(
                                      "billing_phone_country_code"
                                    ) &&
                                      touchedFields?.includes(
                                        "billing_phone_country_code"
                                      ) &&
                                      !billingData.billing_phone_country_code &&
                                      __(
                                        "paymentMethodScreen.billing.requiredError",
                                        appSettings.lng
                                      )}
                                  </Text>
                                </View>
                              </View>
                            )}
                            <View style={{ width: 10 }} />
                            {billingForm?.billing_phone && (
                              <View style={{ flex: 1 }}>
                                <View style={styles.fieldTitleWrap}>
                                  <Text style={styles.fieldTitle}>
                                    {billingForm?.billing_phone?.label ||
                                      __(
                                        "paymentMethodScreen.billing.phoneTitle",
                                        appSettings.lng
                                      )}
                                    {requiredFields?.includes(
                                      "billing_phone"
                                    ) && (
                                      <Text style={styles.requiredStar}>
                                        {" *"}
                                      </Text>
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.inputWrap}>
                                  <TextInput
                                    placeholderTextColor={COLORS.text_light}
                                    style={[styles.inputCommon, rtlText]}
                                    onChangeText={(text) =>
                                      setFormFieldData("billing_phone", text)
                                    }
                                    onBlur={() =>
                                      handleTouched("billing_phone")
                                    }
                                    value={billingData?.billing_phone || ""}
                                    placeholder={
                                      billingForm?.billing_phone?.placeholder ||
                                      __(
                                        "paymentMethodScreen.billing.phonePlaceholder",
                                        appSettings.lng
                                      )
                                    }
                                  />
                                </View>
                                <View style={styles.fieldErrorWrap}>
                                  <Text style={styles.fieldError}>
                                    {requiredFields?.includes(
                                      "billing_phone"
                                    ) &&
                                      touchedFields?.includes(
                                        "billing_phone"
                                      ) &&
                                      !billingData.billing_phone &&
                                      __(
                                        "paymentMethodScreen.billing.requiredError",
                                        appSettings.lng
                                      )}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        )}
                        {billingForm?.billing_email && (
                          <View style={styles.fullFieldWrap}>
                            <View style={styles.billingFieldWrap}>
                              <View style={styles.fieldTitleWrap}>
                                <Text style={styles.fieldTitle}>
                                  {billingForm?.billing_email?.label ||
                                    __(
                                      "paymentMethodScreen.billing.emailTitle",
                                      appSettings.lng
                                    )}
                                  {requiredFields?.includes(
                                    "billing_email"
                                  ) && (
                                    <Text style={styles.requiredStar}>
                                      {" *"}
                                    </Text>
                                  )}
                                </Text>
                              </View>
                              <View style={styles.inputWrap}>
                                <TextInput
                                  placeholderTextColor={COLORS.text_light}
                                  style={[styles.inputCommon, rtlText]}
                                  onChangeText={(text) =>
                                    setFormFieldData("billing_email", text)
                                  }
                                  onBlur={() => handleTouched("billing_email")}
                                  value={billingData?.billing_email || ""}
                                  placeholder={
                                    billingForm?.billing_email?.placeholder ||
                                    __(
                                      "paymentMethodScreen.billing.emailPlaceholder",
                                      appSettings.lng
                                    )
                                  }
                                />
                              </View>
                              <View style={styles.fieldErrorWrap}>
                                <Text style={styles.fieldError}>
                                  {requiredFields?.includes("billing_email") &&
                                    touchedFields?.includes("billing_email") &&
                                    !billingData.billing_email &&
                                    __(
                                      "paymentMethodScreen.billing.requiredError",
                                      appSettings.lng
                                    )}
                                </Text>
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              )}
          </>
        )}
        {ios && selectedMethod?.id === "stripe" && !wooCom && (
          <View
            style={{
              marginHorizontal: "10%",
              backgroundColor: "transparent",
            }}
          >
            <TouchableOpacity
              style={[
                styles.showMoreButton,
                {
                  backgroundColor: proccedPaymentBtn
                    ? COLORS.button.disabled
                    : COLORS.button.active,
                },
              ]}
              onPress={handlePayment}
              disabled={proccedPaymentBtn}
            >
              <Text
                style={[styles.showMoreButtonText, rtlText]}
                numberOfLines={1}
              >
                {__("paymentMethodScreen.proceedPayment", appSettings.lng)}
              </Text>
              <View style={styles.iconWrap}>
                <AntDesign name="arrowright" size={18} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      {!!wooCom && (
        <View style={[styles.buttonWrap, { marginHorizontal: "3%" }]}>
          <TouchableOpacity
            style={[
              styles.showMoreButton,
              {
                backgroundColor: proccedPaymentBtn
                  ? COLORS.button.disabled
                  : COLORS.button.active,
              },
            ]}
            onPress={handleWooPayment}
            disabled={loading || wooLoading}
          >
            <Text
              style={[styles.showMoreButtonText, rtlText]}
              numberOfLines={1}
            >
              {__("paymentMethodScreen.proceedPayment", appSettings.lng)}
            </Text>
            <View style={styles.iconWrap}>
              <AntDesign name="arrowright" size={18} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>
      )}
      {((ios &&
        !!selectedMethod &&
        selectedMethod?.id !== "stripe" &&
        !wooCom) ||
        (!ios && !keyboardStatus && !!selectedMethod && !wooCom)) && (
        <View style={[styles.buttonWrap, { marginHorizontal: "3%" }]}>
          <TouchableOpacity
            style={[
              styles.showMoreButton,
              {
                backgroundColor: proccedPaymentBtn
                  ? COLORS.button.disabled
                  : COLORS.button.active,
              },
            ]}
            onPress={handlePayment}
            disabled={proccedPaymentBtn}
          >
            <Text
              style={[styles.showMoreButtonText, rtlText]}
              numberOfLines={1}
            >
              {__("paymentMethodScreen.proceedPayment", appSettings.lng)}
            </Text>
            <View style={styles.iconWrap}>
              <AntDesign name="arrowright" size={18} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={wooModal}
        statusBarTranslucent={ios}
      >
        <SafeAreaView style={{ backgroundColor: COLORS.primary, flex: 1 }}>
          {wooComplete && (
            <View
              style={{
                position: "absolute",
                height: "100%",
                width: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                zIndex: 5,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  padding: 20,
                  backgroundColor: COLORS.white,
                  borderRadius: 6,
                }}
              >
                <Text style={styles.text}>
                  {__("paymentMethodScreen.orderSuccess", appSettings.lng)}
                </Text>
                <View style={{ marginTop: 20 }}>
                  <AppTextButton
                    title={__(
                      "paymentMethodScreen.closeButton",
                      appSettings.lng
                    )}
                    onPress={() => navigation.pop(3)}
                  />
                </View>
              </View>
            </View>
          )}
          {wooLoading ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                backgroundColor: COLORS.white,
              }}
            >
              <View
                style={{
                  backgroundColor: COLORS.white,
                  alignItems: "flex-end",
                }}
              >
                <TouchableOpacity
                  style={[
                    {
                      flexDirection: "row",
                      backgroundColor: COLORS.primary,
                      paddingHorizontal: 2,
                      paddingVertical: 2,
                      borderRadius: 15,
                      alignItems: "center",
                      margin: 5,
                    },
                    rtlView,
                  ]}
                  onPress={handleWooModalClose}
                >
                  <View style={{ paddingHorizontal: 10 }}>
                    <Text
                      style={{
                        color: COLORS.white,
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      {__("paymentMethodScreen.closeButton", appSettings.lng)}
                    </Text>
                  </View>
                  <FontAwesome5
                    name="times-circle"
                    size={24}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <WebView
                  source={{
                    uri:
                      route?.params?.type === "promotion"
                        ? `${wooData.routes.web}&api_key=${apiKey}&token=${auth_token}&pricing_id=${route?.params?.selected?.id}&listing_id=${route?.params?.listingID}`
                        : `${wooData.routes.web}&api_key=${apiKey}&token=${auth_token}&pricing_id=${route?.params?.selected?.id}`,
                  }}
                  style={{ opacity: 0.99 }}
                  onNavigationStateChange={(data) =>
                    // handleWebviewDataChange(data)
                    handleWooURLDataChange(data)
                  }
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                  )}
                  onMessage={(e) => {
                    console.log(e.nativeEvent.data);
                  }}
                  javaScriptEnabled={true}
                  javaScriptEnabledAndroid={true}
                  domStorageEnabled={true}
                  onError={console.error.bind(console, "error")}
                />
              </View>
            </View>
          ) : (
            <View style={{ flex: 1, backgroundColor: COLORS.white }}>
              {!paymentError && !paymentData && (
                <View
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={styles.text}>
                    {__(
                      "paymentMethodScreen.paymentProcessing",
                      appSettings.lng
                    )}
                  </Text>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              )}
              {!!paymentError && (
                <View style={styles.paymentErrorWrap}>
                  <Text style={styles.paymentError}>{paymentError}</Text>
                </View>
              )}
              {paymentData && !paymentError && (
                <ScrollView>
                  <View style={{ paddingBottom: 80 }}>
                    {!!paymentData && (
                      <View style={styles.paymentTableWrap}>
                        {!!paymentData?.id && (
                          <View style={styles.paymentTableHeaderWrap}>
                            <View
                              style={{
                                paddingVertical: ios ? 10 : 7,
                                paddingHorizontal: 15,
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
                                  "paymentDetailScreen.invoiceNo",
                                  appSettings.lng
                                )}{" "}
                                {paymentData.id}
                              </Text>
                            </View>
                          </View>
                        )}
                        {!!paymentData?.method && (
                          <View style={styles.paymentTableRow}>
                            <View style={styles.paymentTableLabelWrap}>
                              <Text style={styles.paymentTableLabel}>
                                {__(
                                  "paymentMethodScreen.payment.method",
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                            <View style={styles.paymentTableValueWrap}>
                              <Text style={styles.paymentTableValue}>
                                {paymentData.method}
                              </Text>
                            </View>
                          </View>
                        )}

                        {!!paymentData?.price && (
                          <View style={styles.paymentTableRow}>
                            <View style={styles.paymentTableLabelWrap}>
                              <Text style={styles.paymentTableLabel}>
                                {__(
                                  "paymentMethodScreen.payment.totalAmount",
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                            <View style={styles.paymentTableValueWrap}>
                              <Text style={styles.paymentTableValue}>
                                {getPrice(
                                  config.payment_currency,
                                  {
                                    pricing_type: "price",
                                    price_type: "",
                                    price: paymentData.price,
                                    max_price: 0,
                                  },
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                          </View>
                        )}
                        {!!paymentData?.paid_date && (
                          <View style={styles.paymentTableRow}>
                            <View style={styles.paymentTableLabelWrap}>
                              <Text style={styles.paymentTableLabel}>
                                {__(
                                  "paymentMethodScreen.payment.date",
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                            <View style={styles.paymentTableValueWrap}>
                              <Text style={styles.paymentTableValue}>
                                {paymentData.paid_date}
                              </Text>
                            </View>
                          </View>
                        )}
                        {!!paymentData?.transaction_id && (
                          <View style={styles.paymentTableRow}>
                            <View style={styles.paymentTableLabelWrap}>
                              <Text style={styles.paymentTableLabel}>
                                {__(
                                  "paymentMethodScreen.payment.transactionID",
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                            <View style={styles.paymentTableValueWrap}>
                              <Text style={styles.paymentTableValue}>
                                {paymentData.transaction_id}
                              </Text>
                            </View>
                          </View>
                        )}

                        {!!paymentData?.status && (
                          <View
                            style={[
                              styles.paymentTableRow,
                              {
                                borderBottomWidth:
                                  paymentData?.status !== "Completed" &&
                                  !!selectedMethod?.instructions
                                    ? 1
                                    : 0,
                              },
                            ]}
                          >
                            <View style={styles.paymentTableLabelWrap}>
                              <Text style={styles.paymentTableLabel}>
                                {__(
                                  "paymentMethodScreen.payment.status",
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                            <View style={styles.paymentTableValueWrap}>
                              <Text style={styles.paymentTableValue}>
                                {paymentData.status}
                              </Text>
                            </View>
                          </View>
                        )}
                        {paymentData?.status !== "Completed" &&
                          !!selectedMethod?.instructions && (
                            <View
                              style={[
                                styles.paymentTableRow,
                                {
                                  borderBottomWidth: 0,
                                },
                              ]}
                            >
                              <View
                                style={[
                                  styles.paymentTableLabelWrap,
                                  { justifyContent: "flex-start" },
                                ]}
                              >
                                <Text style={styles.paymentTableLabel}>
                                  {__(
                                    "paymentMethodScreen.payment.instructions",
                                    appSettings.lng
                                  )}
                                </Text>
                              </View>
                              <View style={styles.paymentTableValueWrap}>
                                <Text style={styles.paymentTableValue}>
                                  {decodeString(selectedMethod.instructions)}
                                </Text>
                              </View>
                            </View>
                          )}
                      </View>
                    )}
                    {!!paymentData?.plan && (
                      <View style={styles.planTableWrap}>
                        <View
                          style={{
                            paddingHorizontal: 15,
                            paddingVertical: ios ? 10 : 7,
                            backgroundColor: COLORS.bg_primary,
                            borderTopLeftRadius: 10,
                            borderTopRightRadius: 10,
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

                        {!!paymentData?.plan?.title && (
                          <View style={styles.paymentTableRow}>
                            <View style={styles.paymentTableLabelWrap}>
                              <Text style={styles.paymentTableLabel}>
                                {__(
                                  "paymentMethodScreen.plan.pricingOption",
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                            <View style={styles.paymentTableValueWrap}>
                              <Text style={styles.paymentTableValue}>
                                {decodeString(paymentData.plan.title)}
                              </Text>
                            </View>
                          </View>
                        )}
                        {!!paymentData?.plan?.visible && (
                          <View style={styles.paymentTableRow}>
                            <View style={styles.paymentTableLabelWrap}>
                              <Text style={styles.paymentTableLabel}>
                                {__(
                                  "paymentMethodScreen.plan.duration",
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                            <View style={styles.paymentTableValueWrap}>
                              <Text style={styles.paymentTableValue}>
                                {paymentData.plan.visible}
                              </Text>
                            </View>
                          </View>
                        )}
                        {!!paymentData?.plan?.price && (
                          <View
                            style={{
                              flexDirection: "row",
                              paddingHorizontal: 10,
                            }}
                          >
                            <View style={styles.paymentTableLabelWrap}>
                              <Text style={styles.paymentTableLabel}>
                                {__(
                                  "paymentMethodScreen.plan.amount",
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                            <View style={styles.paymentTableValueWrap}>
                              <Text style={styles.paymentTableValue}>
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
                    )}
                  </View>
                </ScrollView>
              )}

              <View style={styles.buttonWrap}>
                <TouchableOpacity
                  style={[
                    styles.showMoreButton,
                    {
                      backgroundColor: COLORS.button.active,
                    },
                  ]}
                  onPress={handlePaymentSumaryDismiss}
                >
                  <Text style={styles.showMoreButtonText} numberOfLines={1}>
                    {__(
                      !!paymentError
                        ? "paymentMethodScreen.closeButton"
                        : "paymentMethodScreen.goToAccountButton",
                      appSettings.lng
                    )}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModal}
        statusBarTranslucent
      >
        <SafeAreaView
          style={[
            styles.modalInnerWrap,
            { backgroundColor: paypalLoading ? COLORS.primary : COLORS.white },
          ]}
        >
          {paymentLoading ? (
            <View style={styles.paymentLoadingWrap}>
              {razorpaySuccess ? (
                <Text style={styles.text}>
                  {__("paymentMethodScreen.paymentVerifying", appSettings.lng)}
                </Text>
              ) : (
                <Text style={styles.text}>
                  {__("paymentMethodScreen.paymentProcessing", appSettings.lng)}
                </Text>
              )}
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <>
              {paypalLoading ? (
                <>
                  {selectedMethod?.id === "razorpay" && (
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      {ios ? (
                        <WebView
                          style={{ marginTop: 20, opacity: 0.99 }}
                          startInLoadingState={true}
                          javaScriptCanOpenWindowsAutomatically={true}
                          setSupportMultipleWindows={true}
                          renderLoading={() => (
                            <View
                              style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ActivityIndicator
                                size="large"
                                color={COLORS.primary}
                              />
                            </View>
                          )}
                          source={{ html: HTML }}
                          injectedJavaScript={`(function(){
                    
                        var razorpayCheckout = new Razorpay({
                          key: "${paymentData.checkout_data.key}",
                          currency: "${paymentData.checkout_data.currency}",
                          description: "${paymentData.checkout_data.description}",
                          name: "${paymentData.checkout_data.name}",
                          notes: {
                            rtcl_payment_id: ${paymentData.id}
                          },
                          order_id: "${paymentData.checkout_data.order_id}",
                          modal:{
                            ondismiss: function(e){
                              var resp = {reason:'dismiss', success:false, payment:null};
                              window.ReactNativeWebView.postMessage(JSON.stringify(resp));
                            }
                          },
                          handler: function(payment){
                            var resp = {reason:'', success:true, payment: payment};
                            window.ReactNativeWebView.postMessage(JSON.stringify(resp));
                          }
                        });
                        razorpayCheckout.open();
                      
                  })();`}
                          onMessage={(event) => {
                            // var response = JSON.parse(event);
                            const result = event.nativeEvent.data;
                            if (result) {
                              const res = JSON.parse(result);
                              if (res.success) {
                                setRazorpaySuccess(true);
                                setPaymentLoading(true);

                                var formdata = new FormData();
                                formdata.append("payment_id", paymentData.id);
                                formdata.append("rest_api", 1);
                                formdata.append(
                                  "razorpay_payment_id",
                                  res?.payment?.razorpay_payment_id
                                );
                                formdata.append(
                                  "razorpay_order_id",
                                  res?.payment?.razorpay_order_id
                                );
                                formdata.append(
                                  "razorpay_signature",
                                  res?.payment?.razorpay_signature
                                );
                                const myHeaders = new Headers();
                                myHeaders.append("Accept", "application/json");
                                myHeaders.append("X-API-KEY", apiKey);
                                myHeaders.append(
                                  "Authorization",
                                  "Bearer " + auth_token
                                );

                                fetch(paymentData.auth_api_url, {
                                  method: "POST",
                                  body: formdata,
                                  headers: myHeaders,
                                })
                                  .then((response) => response.json())
                                  .then((json) => {
                                    if (json?.success) {
                                      setPaymentData(json.data);
                                    }
                                  })
                                  .catch((error) => alert(error))
                                  .finally(() => {
                                    setPaypalLoading(false);
                                    setPaymentLoading(false);
                                  });
                              } else {
                                setPaymentError(res.reason);
                                setPaypalLoading(false);
                                setPaymentLoading(false);
                              }
                            }
                            // console.log(response);
                          }}
                          javaScriptEnabled={true}
                          // javaScriptEnabledAndroid={true}
                          // domStorageEnabled={true}
                          onError={console.error.bind(console, "error")}
                        />
                      ) : (
                        <WebView
                          style={{ marginTop: 20, opacity: 0.99 }}
                          startInLoadingState={true}
                          renderLoading={() => (
                            <View
                              style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <ActivityIndicator
                                size="large"
                                color={COLORS.primary}
                              />
                            </View>
                          )}
                          source={{ html: HTML }}
                          javaScriptCanOpenWindowsAutomatically={true}
                          setSupportMultipleWindows={true}
                          injectedJavaScript={`(function(){
                          if(!window.Razorpay){ 
                          var resp = {reason:'Could not initiate Razerpay', success:false, payment:null};
                          window.ReactNativeWebView.postMessage(JSON.stringify(resp));
                          }else{
                          var razorpayCheckout = new Razorpay({
                          key: "${paymentData.checkout_data.key}",
                          currency: "${paymentData.checkout_data.currency}",
                          description: "${paymentData.checkout_data.description}",
                          name: "${paymentData.checkout_data.name}",
                          notes: {
                            rtcl_payment_id: ${paymentData.id}
                          },
                          order_id: "${paymentData.checkout_data.order_id}",
                          modal:{
                            ondismiss: function(e){
                              var resp = {reason:'dismiss', success:false, payment:null};
                              window.ReactNativeWebView.postMessage(JSON.stringify(resp));
                            }
                          },
                          handler: function(payment){
                            var resp = {reason:'', success:true, payment: payment};
                            window.ReactNativeWebView.postMessage(JSON.stringify(resp));
                          }
                        });
                        razorpayCheckout.open();
                      }
                  })();`}
                          onMessage={(event) => {
                            const result = event.nativeEvent.data;
                            if (result) {
                              const res = JSON.parse(result);
                              if (res.success) {
                                setRazorpaySuccess(true);
                                setPaymentLoading(true);

                                var formdata = new FormData();
                                formdata.append("payment_id", paymentData.id);
                                formdata.append("rest_api", 1);
                                formdata.append(
                                  "razorpay_payment_id",
                                  res?.payment?.razorpay_payment_id
                                );
                                formdata.append(
                                  "razorpay_order_id",
                                  res?.payment?.razorpay_order_id
                                );
                                formdata.append(
                                  "razorpay_signature",
                                  res?.payment?.razorpay_signature
                                );
                                const myHeaders = new Headers();
                                myHeaders.append("Accept", "application/json");
                                myHeaders.append("X-API-KEY", apiKey);
                                myHeaders.append(
                                  "Authorization",
                                  "Bearer " + auth_token
                                );

                                fetch(paymentData.auth_api_url, {
                                  method: "POST",
                                  body: formdata,
                                  headers: myHeaders,
                                })
                                  .then((response) => response.json())
                                  .then((json) => {
                                    if (json?.success) {
                                      setPaymentData(json.data);
                                    }
                                  })
                                  .catch((error) => alert(error))
                                  .finally(() => {
                                    setPaypalLoading(false);
                                    setPaymentLoading(false);
                                  });
                              } else {
                                setPaymentError(res.reason);
                                setPaypalLoading(false);
                                setPaymentLoading(false);
                              }
                            }
                          }}
                          javaScriptEnabled={true}
                          javaScriptEnabledAndroid={true}
                          domStorageEnabled={true}
                          onError={console.error.bind(console, "error")}
                        />
                      )}
                    </View>
                  )}
                  {selectedMethod?.id === "paypal" && (
                    <View style={{ flex: 1, justifyContent: "center" }}>
                      <WebView
                        source={{ uri: paymentData.redirect }}
                        style={{ marginTop: 20, opacity: 0.99 }}
                        onNavigationStateChange={(data) =>
                          handleWebviewDataChange(data)
                        }
                        startInLoadingState={true}
                        renderLoading={() => (
                          <View
                            style={{
                              flex: 1,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <ActivityIndicator
                              size="large"
                              color={COLORS.primary}
                            />
                          </View>
                        )}
                        onMessage={(e) => {
                          console.log(e.nativeEvent.data);
                        }}
                        javaScriptEnabled={true}
                        javaScriptEnabledAndroid={true}
                        domStorageEnabled={true}
                        onError={console.error.bind(console, "error")}
                      />
                    </View>
                  )}
                </>
              ) : (
                <View style={{ flex: 1 }}>
                  {!paymentError && !paymentData && (
                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={styles.text}>
                        {__(
                          "paymentMethodScreen.paymentProcessing",
                          appSettings.lng
                        )}
                      </Text>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                  )}
                  {!!paymentError && (
                    <View style={styles.paymentErrorWrap}>
                      <Text style={styles.paymentError}>{paymentError}</Text>
                    </View>
                  )}
                  {paymentData && !paymentError && (
                    <ScrollView>
                      <View style={{ paddingBottom: 80 }}>
                        {!!paymentData && (
                          <View style={styles.paymentTableWrap}>
                            {!!paymentData?.id && (
                              <View style={styles.paymentTableHeaderWrap}>
                                <View
                                  style={{
                                    paddingVertical: ios ? 10 : 7,
                                    paddingHorizontal: 15,
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
                                      "paymentDetailScreen.invoiceNo",
                                      appSettings.lng
                                    )}{" "}
                                    {paymentData.id}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {!!paymentData?.method && (
                              <View style={styles.paymentTableRow}>
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.payment.method",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {paymentData.method}
                                  </Text>
                                </View>
                              </View>
                            )}

                            {!!paymentData?.price && (
                              <View style={styles.paymentTableRow}>
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.payment.totalAmount",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {getPrice(
                                      config.payment_currency,
                                      {
                                        pricing_type: "price",
                                        price_type: "",
                                        price: paymentData.price,
                                        max_price: 0,
                                      },
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {!!paymentData?.paid_date && (
                              <View style={styles.paymentTableRow}>
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.payment.date",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {paymentData.paid_date}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {!!paymentData?.transaction_id && (
                              <View style={styles.paymentTableRow}>
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.payment.transactionID",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {paymentData.transaction_id}
                                  </Text>
                                </View>
                              </View>
                            )}

                            {!!paymentData?.status && (
                              <View
                                style={[
                                  styles.paymentTableRow,
                                  {
                                    borderBottomWidth:
                                      paymentData?.status !== "Completed" &&
                                      !!selectedMethod?.instructions
                                        ? 1
                                        : 0,
                                  },
                                ]}
                              >
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.payment.status",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {paymentData.status}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {paymentData?.status !== "Completed" &&
                              !!selectedMethod?.instructions && (
                                <View
                                  style={[
                                    styles.paymentTableRow,
                                    {
                                      borderBottomWidth: 0,
                                    },
                                  ]}
                                >
                                  <View
                                    style={[
                                      styles.paymentTableLabelWrap,
                                      { justifyContent: "flex-start" },
                                    ]}
                                  >
                                    <Text style={styles.paymentTableLabel}>
                                      {__(
                                        "paymentMethodScreen.payment.instructions",
                                        appSettings.lng
                                      )}
                                    </Text>
                                  </View>
                                  <View style={styles.paymentTableValueWrap}>
                                    <Text style={styles.paymentTableValue}>
                                      {decodeString(
                                        selectedMethod.instructions
                                      )}
                                    </Text>
                                  </View>
                                </View>
                              )}
                          </View>
                        )}
                        {!!paymentData?.plan && (
                          <View style={styles.planTableWrap}>
                            <View
                              style={{
                                paddingHorizontal: 15,
                                paddingVertical: ios ? 10 : 7,
                                backgroundColor: COLORS.bg_primary,
                                borderTopLeftRadius: 10,
                                borderTopRightRadius: 10,
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

                            {!!paymentData?.plan?.title && (
                              <View style={styles.paymentTableRow}>
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.plan.pricingOption",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {decodeString(paymentData.plan.title)}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {!!paymentData?.plan?.visible && (
                              <View style={styles.paymentTableRow}>
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.plan.duration",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {paymentData.plan.visible}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {!!paymentData?.plan?.price && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  paddingHorizontal: 10,
                                }}
                              >
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.plan.amount",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
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
                        )}
                      </View>
                    </ScrollView>
                  )}

                  <View style={styles.buttonWrap}>
                    <TouchableOpacity
                      style={[
                        styles.showMoreButton,
                        {
                          backgroundColor: COLORS.button.active,
                        },
                      ]}
                      onPress={handlePaymentSumaryDismiss}
                    >
                      <Text style={styles.showMoreButtonText} numberOfLines={1}>
                        {__(
                          !!paymentError
                            ? "paymentMethodScreen.closeButton"
                            : "paymentMethodScreen.goToAccountButton",
                          appSettings.lng
                        )}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </SafeAreaView>
      </Modal>
      <Modal visible={couponLoading} statusBarTranslucent transparent={true}>
        <View style={styles.loadingOverlay} />
        <View style={styles.couponLoadingWrap}>
          <ActivityIndicator size={"large"} color={COLORS.primary} />
        </View>
      </Modal>
      {razorpayLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size={"large"} color={COLORS.primary} />
        </View>
      )}
      {dataUpdating && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.white,
          }}
        >
          <ActivityIndicator size={"large"} color={COLORS.primary} />
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={webPaymentModal}
        statusBarTranslucent={ios}
      >
        <SafeAreaView style={{ backgroundColor: COLORS.primary, flex: 1 }}>
          {webPaymentComplete && (
            <View
              style={{
                position: "absolute",
                height: "100%",
                width: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                zIndex: 5,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  padding: 20,
                  backgroundColor: COLORS.white,
                  borderRadius: 6,
                }}
              >
                <Text style={styles.text}>
                  {__("paymentMethodScreen.orderSuccess", appSettings.lng)}
                </Text>
                <View style={{ marginTop: 20 }}>
                  <AppTextButton
                    title={__(
                      "paymentMethodScreen.closeButton",
                      appSettings.lng
                    )}
                    onPress={handleWebPaymentComplete}
                  />
                </View>
              </View>
            </View>
          )}
          {webPaymentOrderLoading ? (
            <View
              style={{
                flex: 1,
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator size={"large"} color={COLORS.primary} />
            </View>
          ) : (
            <>
              {webPaymentLoading ? (
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    backgroundColor: COLORS.white,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: COLORS.white,
                      alignItems: "flex-end",
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        {
                          flexDirection: "row",
                          backgroundColor: COLORS.primary,
                          paddingHorizontal: 2,
                          paddingVertical: 2,
                          borderRadius: 15,
                          alignItems: "center",
                          margin: 5,
                        },
                        rtlView,
                      ]}
                      onPress={handleWebPaymentModalClose}
                    >
                      <View style={{ paddingHorizontal: 10 }}>
                        <Text
                          style={{
                            color: COLORS.white,
                            fontSize: 12,
                            fontWeight: "bold",
                          }}
                        >
                          {__(
                            "paymentMethodScreen.closeButton",
                            appSettings.lng
                          )}
                        </Text>
                      </View>
                      <FontAwesome5
                        name="times-circle"
                        size={24}
                        color={COLORS.white}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <WebView
                      source={{
                        uri: `${paymentData.restWebPayUrl}&api_key=${apiKey}&token=${auth_token}&order_id=${paymentData?.id}`,
                      }}
                      style={{ opacity: 0.99 }}
                      onNavigationStateChange={(data) =>
                        // handleWebviewDataChange(data)
                        handleWebPaymentURLDataChange(data)
                      }
                      startInLoadingState={true}
                      renderLoading={() => (
                        <View
                          style={{
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ActivityIndicator
                            size="large"
                            color={COLORS.primary}
                          />
                        </View>
                      )}
                      onMessage={(e) => {
                        console.log(e.nativeEvent.data);
                      }}
                      javaScriptEnabled={true}
                      javaScriptEnabledAndroid={true}
                      domStorageEnabled={true}
                      onError={console.error.bind(console, "error")}
                    />
                  </View>
                </View>
              ) : (
                <View style={{ flex: 1, backgroundColor: COLORS.white }}>
                  {!paymentError && !paymentData && (
                    <View
                      style={{
                        flex: 1,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={styles.text}>
                        {__(
                          "paymentMethodScreen.paymentProcessing",
                          appSettings.lng
                        )}
                      </Text>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                  )}
                  {!!paymentError && (
                    <View style={styles.paymentErrorWrap}>
                      <Text style={styles.paymentError}>{paymentError}</Text>
                    </View>
                  )}
                  {paymentData && !paymentError && (
                    <ScrollView>
                      <View style={{ paddingBottom: 80 }}>
                        {!!paymentData && (
                          <View style={styles.paymentTableWrap}>
                            {!!paymentData?.id && (
                              <View style={styles.paymentTableHeaderWrap}>
                                <View
                                  style={{
                                    paddingVertical: ios ? 10 : 7,
                                    paddingHorizontal: 15,
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
                                      "paymentDetailScreen.invoiceNo",
                                      appSettings.lng
                                    )}{" "}
                                    {paymentData.id}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {!!paymentData?.method && (
                              <View style={styles.paymentTableRow}>
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.payment.method",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {paymentData.method}
                                  </Text>
                                </View>
                              </View>
                            )}

                            {!!paymentData?.price && (
                              <View style={styles.paymentTableRow}>
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.payment.totalAmount",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {getPrice(
                                      config.payment_currency,
                                      {
                                        pricing_type: "price",
                                        price_type: "",
                                        price: paymentData.price,
                                        max_price: 0,
                                      },
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {!!paymentData?.paid_date && (
                              <View style={styles.paymentTableRow}>
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.payment.date",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {paymentData.paid_date}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {!!paymentData?.transaction_id && (
                              <View style={styles.paymentTableRow}>
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.payment.transactionID",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {paymentData.transaction_id}
                                  </Text>
                                </View>
                              </View>
                            )}

                            {!!paymentData?.status && (
                              <View
                                style={[
                                  styles.paymentTableRow,
                                  {
                                    borderBottomWidth:
                                      paymentData?.status !== "Completed" &&
                                      !!selectedMethod?.instructions
                                        ? 1
                                        : 0,
                                  },
                                ]}
                              >
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.payment.status",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {paymentData.status}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {paymentData?.status !== "Completed" &&
                              !!selectedMethod?.instructions && (
                                <View
                                  style={[
                                    styles.paymentTableRow,
                                    {
                                      borderBottomWidth: 0,
                                    },
                                  ]}
                                >
                                  <View
                                    style={[
                                      styles.paymentTableLabelWrap,
                                      { justifyContent: "flex-start" },
                                    ]}
                                  >
                                    <Text style={styles.paymentTableLabel}>
                                      {__(
                                        "paymentMethodScreen.payment.instructions",
                                        appSettings.lng
                                      )}
                                    </Text>
                                  </View>
                                  <View style={styles.paymentTableValueWrap}>
                                    <Text style={styles.paymentTableValue}>
                                      {decodeString(
                                        selectedMethod.instructions
                                      )}
                                    </Text>
                                  </View>
                                </View>
                              )}
                          </View>
                        )}
                        {!!paymentData?.plan && (
                          <View style={styles.planTableWrap}>
                            <View
                              style={{
                                paddingHorizontal: 15,
                                paddingVertical: ios ? 10 : 7,
                                backgroundColor: COLORS.bg_primary,
                                borderTopLeftRadius: 10,
                                borderTopRightRadius: 10,
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

                            {!!paymentData?.plan?.title && (
                              <View style={styles.paymentTableRow}>
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.plan.pricingOption",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {decodeString(paymentData.plan.title)}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {!!paymentData?.plan?.visible && (
                              <View style={styles.paymentTableRow}>
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.plan.duration",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
                                    {paymentData.plan.visible}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {!!paymentData?.plan?.price && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  paddingHorizontal: 10,
                                }}
                              >
                                <View style={styles.paymentTableLabelWrap}>
                                  <Text style={styles.paymentTableLabel}>
                                    {__(
                                      "paymentMethodScreen.plan.amount",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                                <View style={styles.paymentTableValueWrap}>
                                  <Text style={styles.paymentTableValue}>
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
                        )}
                      </View>
                    </ScrollView>
                  )}

                  <View style={styles.buttonWrap}>
                    <TouchableOpacity
                      style={[
                        styles.showMoreButton,
                        {
                          backgroundColor: COLORS.button.active,
                        },
                      ]}
                      onPress={handlePaymentSumaryDismiss}
                    >
                      <Text style={styles.showMoreButtonText} numberOfLines={1}>
                        {__(
                          !!paymentError
                            ? "paymentMethodScreen.closeButton"
                            : "paymentMethodScreen.goToAccountButton",
                          appSettings.lng
                        )}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  requiredStar: {
    color: COLORS.red,
  },
  fieldError: {
    fontSize: 12,
    color: COLORS.red,
  },
  fieldErrorWrap: {
    paddingVertical: 3,
    minHeight: 20,
  },
  inputCommon: {
    justifyContent: "center",
    height: 38,
    paddingHorizontal: 10,
    flex: 1,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: COLORS.border_light,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    width: "100%",
    elevation: 1,
    borderRadius: 3,
    shadowColor: COLORS.gray,
    shadowOpacity: 0.2,
    shadowRadius: 1,
    shadowOffset: {
      height: 0,
      width: 0,
    },
    minHeight: 40,
  },
  fieldTitle: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  fieldTitleWrap: {
    paddingBottom: 5,
  },
  halfFieldWrap: {
    flex: 1,
  },
  halfFieldsWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonWrap: {
    backgroundColor: "transparent",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
  },
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  couponApply: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  couponApplyBtn: {
    paddingHorizontal: 15,
    minHeight: 32,
    justifyContent: "center",
    borderRadius: 3,
  },
  couponError: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.red,
  },
  couponErrorWrap: {
    alignItems: "center",
    paddingTop: 5,
  },
  couponField: {
    minHeight: 32,
    borderColor: COLORS.border_light,
    borderWidth: 1,
    paddingHorizontal: 5,
    textAlignVertical: "center",
    borderRadius: 3,
    color: COLORS.text_gray,
  },
  couponFieldWrap: {
    flex: 1,
    marginVertical: 5,
  },
  couponLoadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  couponRowWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  loadingOverlay: {
    flex: 1,
    width: "100%",
    backgroundColor: COLORS.bg_light,
    opacity: 0.3,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingWrap: {
    width: "100%",
    marginVertical: 50,
  },
  iconWrap: {
    marginLeft: 5,
    marginTop: 2,
  },

  modalInnerWrap: {
    backgroundColor: COLORS.bg_light,
    flex: 1,
    // padding: 15,
  },
  paymentDetailHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  paymentDetailHeaderWrap: {
    paddingHorizontal: "5%",
    backgroundColor: COLORS.bg_primary,
    paddingVertical: 10,
    marginBottom: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  billingDetailWrap: {
    backgroundColor: COLORS.white,
    marginHorizontal: "3%",
    paddingBottom: "3%",
    marginTop: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: COLORS.grey,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  paymentDetailWrap: {
    backgroundColor: COLORS.white,
    marginHorizontal: "3%",
    paddingBottom: "3%",
    borderRadius: 10,
    elevation: 5,
    shadowColor: COLORS.grey,
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: {
      height: 0,
      width: 0,
    },
  },
  paymentError: {
    fontSize: 15,
    color: COLORS.red,
    fontWeight: "bold",
  },
  paymentErrorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 75,
  },
  paymentHeaderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  paymentLoadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentMethodsWrap: {},
  paymentSectionWrap: {
    backgroundColor: COLORS.white,
    marginHorizontal: "3%",
    borderRadius: 10,
    elevation: 5,
    shadowColor: COLORS.gray,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },
  paymentSectionTitle: {
    backgroundColor: COLORS.bg_primary,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: "5%",
  },
  paymentTableHeaderWrap: {
    backgroundColor: COLORS.bg_primary,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
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

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border_light,
    paddingHorizontal: 10,
  },
  paymentTableValue: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  paymentTableValueWrap: {
    justifyContent: "center",
    flex: 2.5,
    paddingHorizontal: 5,
    paddingVertical: Platform.OS === "ios" ? 10 : 7,
  },
  paymentTableWrap: {
    elevation: 5,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginHorizontal: 15,
    shadowColor: COLORS.black,
    shadowOpacity: 0.3,
    shadowOffset: {
      height: 3,
      width: 3,
    },
    shadowRadius: 5,
    marginTop: 20,
  },
  planTableWrap: {
    marginTop: 30,
    elevation: 5,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginHorizontal: 15,
    shadowColor: COLORS.black,
    shadowOpacity: 0.3,
    shadowOffset: {
      height: 3,
      width: 3,
    },
    shadowRadius: 5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceRowLabel: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  priceRowValue: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  selectedLabelText: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  selectedPackageNameText: {
    fontWeight: "bold",
    color: COLORS.text_gray,
    textAlign: "right",
  },
  selectedPackageWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  separator: {
    backgroundColor: COLORS.border_light,
    height: 0.5,
    width: "100%",
    marginVertical: 15,
  },
  showMoreButton: {
    borderRadius: 3,
    marginVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOpacity: 0.3,
    shadowOffset: {
      height: 3,
      width: 3,
    },
    shadowRadius: 5,
  },
  showMoreButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
});

export default PaymentMethodScreen;
