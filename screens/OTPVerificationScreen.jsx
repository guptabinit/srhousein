import auth from "@react-native-firebase/auth";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TextInput,
  TouchableWithoutFeedback,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import PhoneInput from "react-native-phone-number-input";
import { miscConfig } from "../app/services/miscConfig";
import { __ } from "../language/stringPicker";
import { useStateValue } from "../StateProvider";
import { COLORS } from "../variables/color";
import AppButton from "../components/AppButton";
import api, { removeAuthToken, setAuthToken } from "../api/client";
import { routes } from "../navigation/routes";

const { width: screenWidth } = Dimensions.get("window");
const OTPVerificationScreen = ({ route, navigation }) => {
  const [{ appSettings, config, ios, user, auth_token }] = useStateValue();
  const [number, setNumber] = useState("");
  const [formattedNumber, setFormattedNumber] = useState("");
  const [oTPSent, setOTPSent] = useState(false);
  const [oTP, setOTP] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [counter, setCounter] = useState(false);
  const [countValue, setCount] = useState(null);
  const [verificationId, setVerificationId] = useState();
  const [confirm, setConfirm] = useState(null);
  const phoneInput = useRef(null);
  const offsetX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  // Handle login
  const onAuthStateChanged = (firebaseUser) => {
    if (firebaseUser) {
      console.log("firebaseUser:", firebaseUser);
    }
  };

  const firebaseOTPVerification = async () => {
    await confirm
      .confirm(oTP)
      .then((res) => {
        finishFirebaseOTPVerification(res.user.uid);
      })
      .catch((err) => alert(err.message))
      .finally(() => setVerifying(false));
  };

  const handleRequestOTP = () => {
    setOtpLoading(true);
    if (config?.verification?.gateway === "firebase") {
      api
        .post("verification/send-otp", {
          phone: formattedNumber,
          gateway: config?.verification?.gateway,
        })
        .then((res) => {
          if (res?.ok) {
            firebaseOTPRequest();
          } else {
            alert(res?.data?.message || res?.data?.data?.error);
          }
        })
        .finally(() => {
          if (user) {
            removeAuthToken();
          }
        });
    }
    if (config?.verification?.gateway === "twilio") {
      if (user) {
        setAuthToken(auth_token);
      }
      api
        .post("verification/send-otp", {
          phone: formattedNumber,
          gateway: config?.verification?.gateway,
        })
        .then((res) => {
          if (res?.ok) {
            Animated.timing(offsetX, {
              toValue: -screenWidth,
              duration: 1000,
              useNativeDriver: false,
            }).start();
            setOTPSent(true);
          } else {
            alert(res?.data?.message || res?.data?.data?.error);
          }
        })
        .then(() => {
          if (user) {
            removeAuthToken();
          }
          setOtpLoading(false);
        });
    }
  };

  const firebaseOTPRequest = () => {
    auth()
      .signInWithPhoneNumber(formattedNumber)
      .then((confirmation) => {
        setVerificationId(confirmation._verificationId);
        setConfirm(confirmation);
        Animated.timing(offsetX, {
          toValue: -screenWidth,
          duration: 1000,
          useNativeDriver: false,
        }).start();
        setOTPSent(true);
      })
      .catch((err) => alert(err.message))
      .finally(() => setOtpLoading(false));
  };

  useEffect(() => {
    if (oTPSent === true) {
      setCount(config?.verification?.expired_time || 100);
      setCounter(
        setInterval(() => {
          setCount((prevCount) => prevCount - 1);
        }, 1000)
      );
    } else {
      clearInterval(counter);
      setCount(0);
    }
    return () => {
      return;
    };
  }, [oTPSent]);
  useEffect(() => {
    if (countValue <= 0) {
      clearInterval(counter);
      setCount(null);
      setCounter(false);
    }
    return () => {
      return;
    };
  }, [countValue]);

  const handleOTPChange = (text) => {
    setOTP(text);
  };

  const handleResendRequest = () => {
    setOtpLoading(false);
    Animated.timing(offsetX, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: false,
    }).start();
    setOTPSent(false);
    if (countValue > 0) {
      clearInterval(counter);
      setCount(null);
      setCounter(false);
    }
    setOTP("");
  };

  const handleOtpVerificationRequest = () => {
    setVerifying(true);
    if (config?.verification?.gateway === "firebase") firebaseOTPVerification();
    if (config?.verification?.gateway === "twilio") {
      if (user) {
        setAuthToken(auth_token);
      }
      api
        .post("verification/verify-otp", { phone: formattedNumber, code: oTP })
        .then((res) => {
          if (res?.ok) {
            setOTP("");
            Alert.alert(
              __("oTPScreenText.successTitle", appSettings.lng),
              __("oTPScreenText.successMessage", appSettings.lng),

              [
                {
                  text:
                    route?.params?.source === "profile"
                      ? __("oTPScreenText.okBtnTitle", appSettings.lng)
                      : __("oTPScreenText.signUpBtnTitle", appSettings.lng),
                  onPress: () => handleCleanUp(),
                },
              ]
            );
          } else {
            alert(res?.data?.message || res?.data?.data?.error);
          }
        })
        .then(() => {
          if (user) {
            removeAuthToken();
          }
          setVerifying(false);
        });
    }
  };

  const finishFirebaseOTPVerification = (uid) => {
    if (user) setAuthToken(auth_token);
    api
      .post("verification/store-firebase-verified-otp", {
        phone: formattedNumber,
        code: oTP,
        uid: uid,
      })
      .then((res) => {
        if (res?.ok) {
          setOTP("");
          Alert.alert(
            __("oTPScreenText.successTitle", appSettings.lng),
            __("oTPScreenText.successMessage", appSettings.lng),
            [
              {
                text:
                  route?.params?.source === "profile"
                    ? __("oTPScreenText.okBtnTitle", appSettings.lng)
                    : __("oTPScreenText.signUpBtnTitle", appSettings.lng),
                onPress: () => handleCleanUp(),
              },
            ]
          );
        }
      })
      .catch((err) => {
        Alert.alert(
          __("oTPScreenText.errorTitle", appSettings.lng),
          err?.message
            ? __("oTPScreenText.errorMessage", appSettings.lng) +
                ", " +
                err.message
            : __("oTPScreenText.errorMessage", appSettings.lng),
          [
            {
              text: __("oTPScreenText.okBtnTitle", appSettings.lng),
              onPress: () => handleResendRequest(),
            },
          ]
        );
      })
      .finally(() => {
        if (user) removeAuthToken();
      });
  };

  const handleCleanUp = () => {
    if (route?.params?.source === "profile") {
      navigation.goBack();
    } else {
      clearInterval(counter);
      setCount(null);
      setCounter(false);
      setOTPSent(false);
      setNumber("");
      setConfirm(null);
      setOTP();
      setFormattedNumber("");
      navigation.navigate(routes.signUpScreen, {
        verified: true,
        phone: formattedNumber,
      });
      Animated.timing(offsetX, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          width: screenWidth * 2,
          flexDirection: "row",
          marginLeft: offsetX,
        }}
      >
        <View
          style={{
            flex: 1,
            marginHorizontal: "1.5%",
          }}
        >
          <View style={{ paddingBottom: 30, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: COLORS.text_dark,
              }}
            >
              {__("oTPScreenText.phoneInputTitle", appSettings.lng)}
            </Text>
          </View>

          <PhoneInput
            ref={phoneInput}
            defaultValue={route?.params?.phone || ""}
            defaultCode={
              config?.verification?.default_country ||
              miscConfig?.defaultCountryCode ||
              "US"
            }
            layout="first"
            onChangeText={(text) => {
              setNumber(text);
            }}
            onChangeFormattedText={(text) => {
              setFormattedNumber(text);
            }}
            withDarkTheme
            withShadow
            autoFocus={ios}
            disabled={oTPSent || otpLoading}
            placeholder={
              __("oTPScreenText.phoneInputPlaceHolder", appSettings.lng) ||
              "Phone Number"
            }
            containerStyle={{
              width: "100%",
              borderRadius: 6,
            }}
            textContainerStyle={{
              overflow: "hidden",
              borderTopRightRadius: 6,
              borderBottomRightRadius: 6,
            }}
            countryPickerProps={{
              countryCodes: config?.verification?.country_list
                ? config.verification.country_list
                : miscConfig.countryCodes,
            }}
          />
          <View
            style={{
              alignItems: "center",
              marginVertical: 20,
            }}
          >
            <TouchableOpacity
              disabled={otpLoading || number.length < 5}
              onPress={handleRequestOTP}
              style={{
                width: "50%",
                minHeight: 32,
                elevation: 15,
                shadowColor: COLORS.border_light,
                shadowOpacity: 0.9,
                shadowOffset: { height: 0, with: 0 },
                shadowRadius: 5,
                padding: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  otpLoading || number.length < 5
                    ? COLORS.button.disabled
                    : COLORS.button.active,
                borderRadius: 6,
              }}
            >
              {otpLoading ? (
                <View style={styles.view}>
                  <ActivityIndicator size="small" color={COLORS.white} />
                </View>
              ) : (
                <Text
                  style={{
                    fontSize: 16,
                    color: COLORS.white,
                    fontWeight: "bold",
                  }}
                >
                  {__("oTPScreenText.getOTPButtonTitle", appSettings.lng)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={{
            flex: 1,
            paddingHorizontal: "1.5%",
          }}
        >
          <View style={{ paddingBottom: 30, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: COLORS.text_dark,
              }}
            >
              {__("oTPScreenText.oTPInputTitle", appSettings.lng)}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "stretch",
              justifyContent: "center",
            }}
          >
            <View style={styles.view}>
              <TextInput
                style={{
                  height: 35,
                  width: screenWidth * 0.5,
                  backgroundColor: COLORS.white,
                  borderWidth: 1,
                  borderColor: COLORS.border_light,
                  marginRight: 5,
                  borderRadius: 3,
                  elevation: 15,
                  paddingHorizontal: 10,
                }}
                value={oTP}
                onChangeText={handleOTPChange}
                keyboardType="phone-pad"
                editable={
                  config?.verification?.gateway === "firebase"
                    ? !!verificationId
                    : true
                }
              />
            </View>
            <TouchableWithoutFeedback
              onPress={handleOtpVerificationRequest}
              disabled={
                config?.verification?.gateway === "firebase"
                  ? !verificationId
                  : false
              }
            >
              <View
                style={{
                  paddingHorizontal: 10,
                  borderWidth: 1,
                  borderColor: COLORS.border_light,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 3,
                  elevation: 15,
                  backgroundColor: COLORS.white,
                  minWidth: screenWidth * 0.2,
                }}
              >
                {verifying ? (
                  <View style={styles.view}>
                    <ActivityIndicator size={"small"} color={COLORS.primary} />
                  </View>
                ) : (
                  <Text style={{ fontWeight: "bold", color: COLORS.primary }}>
                    {__("oTPScreenText.verifyBtnTitle", appSettings.lng)}
                  </Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
          <View style={{ alignItems: "center", marginVertical: 20 }}>
            <AppButton
              title={
                countValue
                  ? __("oTPScreenText.retryBtnTitle", appSettings.lng) +
                    " (" +
                    countValue +
                    ")"
                  : __("oTPScreenText.retryBtnTitle", appSettings.lng)
              }
              style={{
                width: "50%",
                elevation: 10,
                shadowColor: COLORS.black,
                shadowOpacity: 0.4,
                shadowOffset: { height: 2, with: 0 },
                shadowRadius: 20,
                elevation: 15,
              }}
              disabled={countValue > 0}
              // loading={countValue > 0}
              onPress={handleResendRequest}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 30,
  },
});

export default OTPVerificationScreen;
