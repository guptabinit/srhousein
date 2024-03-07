/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";

// External Libraries
import { Formik } from "formik";
import * as Yup from "yup";

import { FontAwesome5 } from "@expo/vector-icons";

// Custom Components & Functions
import Constants from "expo-constants";
import AppButton from "../components/AppButton";
import api from "../api/client";
import { COLORS } from "../variables/color";
import FlashNotification from "../components/FlashNotification";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";
import { getTnC } from "../language/stringPicker";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width: screenWidth, height: screenHeight } = Dimensions.get("screen");
const SignUpScreen = ({ navigation }) => {
  const [{ ios, appSettings, rtl_support, config }] = useStateValue();
  const [validationSchema, setValidationSchema] = useState(
    Yup.object().shape({
      first_name: Yup.string().required(
        __("signUpScreenTexts.formFieldLabels.first_name", appSettings.lng) +
          " " +
          __("signUpScreenTexts.formValidation.requiredField", appSettings.lng)
      ),
      last_name: Yup.string().required(
        __("signUpScreenTexts.formFieldLabels.last_name", appSettings.lng) +
          " " +
          __("signUpScreenTexts.formValidation.requiredField", appSettings.lng)
      ),
      username: Yup.string()
        .required(
          __("signUpScreenTexts.formFieldLabels.username", appSettings.lng) +
            " " +
            __(
              "signUpScreenTexts.formValidation.requiredField",
              appSettings.lng
            )
        )
        .min(
          3,
          __("signUpScreenTexts.formFieldLabels.username", appSettings.lng) +
            " " +
            __(
              "signUpScreenTexts.formValidation.minimumLength3",
              appSettings.lng
            )
        ),
      phone: Yup.string()
        .required(
          __("signUpScreenTexts.formFieldLabels.phone", appSettings.lng) +
            " " +
            __(
              "signUpScreenTexts.formValidation.requiredField",
              appSettings.lng
            )
        )
        .min(
          5,
          __("signUpScreenTexts.formFieldLabels.phone", appSettings.lng) +
            " " +
            __(
              "signUpScreenTexts.formValidation.minimumLength5",
              appSettings.lng
            )
        ),
      email: Yup.string()
        .required(
          __("signUpScreenTexts.formFieldLabels.email", appSettings.lng) +
            " " +
            __(
              "signUpScreenTexts.formValidation.requiredField",
              appSettings.lng
            )
        )
        .email(
          __("signUpScreenTexts.formValidation.validEmail", appSettings.lng)
        ),
      password: Yup.string()
        .required(
          __("signUpScreenTexts.formFieldLabels.password", appSettings.lng) +
            " " +
            __(
              "signUpScreenTexts.formValidation.requiredField",
              appSettings.lng
            )
        )
        .min(
          6,
          __("signUpScreenTexts.formFieldLabels.password", appSettings.lng) +
            " " +
            __(
              "signUpScreenTexts.formValidation.minimumLength6",
              appSettings.lng
            )
        ),
    })
  );
  const [responseErrorMessage, setResponseErrorMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [passSecure, setPassSecure] = useState(true);
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();
  const [tnCData, setTnCData] = useState(getTnC(appSettings.lng));
  const [tnCToggle, setTnCToggle] = useState(false);
  const [tnCVisible, setTnCVisible] = useState(false);
  const [mainLoading, setMainLoading] = useState(true);

  useEffect(() => {
    if (
      !route?.params?.verified &&
      !route?.params?.phone &&
      !config?.registration_form?.required_phone
    ) {
      const validationSc = Yup.object().shape({
        first_name: Yup.string().required(
          __("signUpScreenTexts.formFieldLabels.first_name", appSettings.lng) +
            " " +
            __(
              "signUpScreenTexts.formValidation.requiredField",
              appSettings.lng
            )
        ),
        last_name: Yup.string().required(
          __("signUpScreenTexts.formFieldLabels.last_name", appSettings.lng) +
            " " +
            __(
              "signUpScreenTexts.formValidation.requiredField",
              appSettings.lng
            )
        ),
        username: Yup.string()
          .required(
            __("signUpScreenTexts.formFieldLabels.username", appSettings.lng) +
              " " +
              __(
                "signUpScreenTexts.formValidation.requiredField",
                appSettings.lng
              )
          )
          .min(
            3,
            __("signUpScreenTexts.formFieldLabels.username", appSettings.lng) +
              " " +
              __(
                "signUpScreenTexts.formValidation.minimumLength3",
                appSettings.lng
              )
          ),
        email: Yup.string()
          .required(
            __("signUpScreenTexts.formFieldLabels.email", appSettings.lng) +
              " " +
              __(
                "signUpScreenTexts.formValidation.requiredField",
                appSettings.lng
              )
          )
          .email(
            __("signUpScreenTexts.formValidation.validEmail", appSettings.lng)
          ),
        password: Yup.string()
          .required(
            __("signUpScreenTexts.formFieldLabels.password", appSettings.lng) +
              " " +
              __(
                "signUpScreenTexts.formValidation.requiredField",
                appSettings.lng
              )
          )
          .min(
            6,
            __("signUpScreenTexts.formFieldLabels.password", appSettings.lng) +
              " " +
              __(
                "signUpScreenTexts.formValidation.minimumLength6",
                appSettings.lng
              )
          ),
      });
      setValidationSchema(validationSc);
    }
    setMainLoading(false);
  }, []);

  const handleSignup = (values) => {
    setResponseErrorMessage();
    setLoading(true);
    Keyboard.dismiss();
    api.post("signup", values).then((res) => {
      if (res.ok) {
        if (res?.data?.verification_mail) {
          alert(__("signUpScreenTexts.mailVerification", appSettings.lng));
        }
        handleSuccess(
          __("signUpScreenTexts.signupSuccessMessage", appSettings.lng)
        );
      } else {
        if (res.problem === "TIMEOUT_ERROR") {
          setResponseErrorMessage(
            __("signUpScreenTexts.errorMessage.timeoutError", appSettings.lng)
          );
          handleError(
            __("signUpScreenTexts.errorMessage.timeoutError", appSettings.lng)
          );
        } else {
          setResponseErrorMessage(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("signUpScreenTexts.errorMessage.serverError", appSettings.lng)
          );
          handleError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("signUpScreenTexts.errorMessage.serverError", appSettings.lng)
          );
        }
      }
    });
  };

  const handleTnCShow = () => {
    setTnCVisible(!tnCVisible);
  };
  const handleSuccess = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setLoading(false);
      navigation.goBack();
    }, 800);
  };
  const handleError = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setLoading(false);
    }, 1000);
  };

  const rtlText = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };
  const rtlTextPE5 = rtl_support && {
    writingDirection: "rtl",
    paddingEnd: 5,
    textAlign: "right",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  return mainLoading ? (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  ) : (
    <KeyboardAvoidingView
      behavior={ios ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={80}
    >
      <ScrollView>
        <View style={[styles.container, { paddingBottom: 50 }]}>
          <View style={styles.signUpForm}>
            <Formik
              initialValues={{
                first_name: "",
                last_name: "",
                username: "",
                phone: "",
                email: "",
                password: "",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSignup}
            >
              {({
                handleChange,
                handleSubmit,
                values,
                errors,
                setFieldTouched,
                touched,
              }) => (
                <View style={{ paddingHorizontal: "3%" }}>
                  <View style={{ flexDirection: "row" }}>
                    <View style={{ flex: 1, marginRight: 5 }}>
                      <Text style={rtlText}>
                        {__(
                          "signUpScreenTexts.formFieldLabels.first_name",
                          appSettings.lng
                        )}
                        <Text style={styles.required}> *</Text>
                      </Text>
                      <TextInput
                        style={[styles.inputCommon, styles.nameInput, rtlText]}
                        onChangeText={handleChange("first_name")}
                        onBlur={() => setFieldTouched("first_name")}
                        value={values.first_name}
                        placeholder={__(
                          "signUpScreenTexts.formFieldPlaceholders.first_name",
                          appSettings.lng
                        )}
                      />
                      <View style={styles.errorWrap}>
                        {touched.first_name && errors.first_name && (
                          <Text style={[styles.errorMessage, rtlText]}>
                            {errors.first_name}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={{ flex: 1, marginLeft: 5 }}>
                      <Text style={rtlText}>
                        {__(
                          "signUpScreenTexts.formFieldLabels.last_name",
                          appSettings.lng
                        )}
                        <Text style={styles.required}> *</Text>
                      </Text>
                      <TextInput
                        style={[styles.inputCommon, styles.nameInput, rtlText]}
                        onChangeText={handleChange("last_name")}
                        onBlur={() => setFieldTouched("last_name")}
                        value={values.last_name}
                        placeholder={__(
                          "signUpScreenTexts.formFieldPlaceholders.last_name",
                          appSettings.lng
                        )}
                      />
                      <View style={styles.errorWrap}>
                        {touched.last_name && errors.last_name && (
                          <Text style={[styles.errorMessage, rtlText]}>
                            {errors.last_name}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <Text style={rtlText}>
                    {__(
                      "signUpScreenTexts.formFieldLabels.username",
                      appSettings.lng
                    )}
                    <Text style={styles.required}> *</Text>
                  </Text>
                  <TextInput
                    style={[styles.inputCommon, styles.usernameInput, rtlText]}
                    onChangeText={handleChange("username")}
                    onBlur={() => setFieldTouched("username")}
                    value={values.username}
                    placeholder={__(
                      "signUpScreenTexts.formFieldPlaceholders.username",
                      appSettings.lng
                    )}
                    autoCapitalize="none"
                  />
                  <View style={styles.errorWrap}>
                    {touched.username && errors.username && (
                      <Text style={[styles.errorMessage, rtlText]}>
                        {errors.username}
                      </Text>
                    )}
                  </View>
                  <Text style={rtlText}>
                    {__(
                      "signUpScreenTexts.formFieldLabels.email",
                      appSettings.lng
                    )}
                    <Text style={styles.required}> *</Text>
                  </Text>
                  <TextInput
                    style={[styles.inputCommon, styles.emailImput, rtlText]}
                    onChangeText={handleChange("email")}
                    onBlur={() => setFieldTouched("email")}
                    value={values.email}
                    placeholder={__(
                      "signUpScreenTexts.formFieldPlaceholders.email",
                      appSettings.lng
                    )}
                    keyboardType="email-address"
                  />
                  <View style={styles.errorWrap}>
                    {touched.email && errors.email && (
                      <Text style={[styles.errorMessage, rtlText]}>
                        {errors.email}
                      </Text>
                    )}
                  </View>
                  <Text style={rtlText}>
                    {__(
                      "signUpScreenTexts.formFieldLabels.phone",
                      appSettings.lng
                    )}
                    <Text style={styles.required}> *</Text>
                  </Text>
                  <TextInput
                    style={[styles.inputCommon, styles.phoneImput, rtlText]}
                    onChangeText={handleChange("phone")}
                    onBlur={() => setFieldTouched("phone")}
                    value={values.phone}
                    placeholder={__(
                      "signUpScreenTexts.formFieldPlaceholders.phone",
                      appSettings.lng
                    )}
                    keyboardType="phone-pad"
                  />
                  <View style={styles.errorWrap}>
                    {touched.phone && errors.phone && (
                      <Text style={[styles.errorMessage, rtlText]}>
                        {errors.phone}
                      </Text>
                    )}
                  </View>

                  <Text style={rtlText}>
                    {__(
                      "signUpScreenTexts.formFieldLabels.password",
                      appSettings.lng
                    )}
                    <Text style={styles.required}> *</Text>
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      height: 38,
                      marginVertical: 10,
                    }}
                  >
                    <TextInput
                      style={[
                        {
                          justifyContent: "center",
                          height: 38,
                          borderRadius: 3,
                          paddingHorizontal: 10,
                          borderWidth: 1,
                          borderColor: COLORS.border_light,
                          flex: 1,
                          borderTopRightRadius: 0,
                          borderBottomRightRadius: 0,
                        },
                        rtlText,
                      ]}
                      onChangeText={handleChange("password")}
                      onBlur={() => setFieldTouched("password")}
                      value={values.password}
                      placeholder={__(
                        "signUpScreenTexts.formFieldPlaceholders.password",
                        appSettings.lng
                      )}
                      secureTextEntry={passSecure}
                      autoCapitalize="none"
                    />
                    <TouchableWithoutFeedback
                      onPress={() =>
                        setPassSecure((prevPassSecure) => !prevPassSecure)
                      }
                    >
                      <View
                        style={{
                          width: 35,
                          // backgroundColor: "red",
                          height: "100%",
                          justifyContent: "center",
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: COLORS.border_light,
                          borderTopRightRadius: 3,
                          borderBottomRightRadius: 3,
                          borderLeftWidth: 0,
                        }}
                      >
                        <FontAwesome5
                          name={passSecure ? "eye" : "eye-slash"}
                          size={16}
                          color={COLORS.text_gray}
                        />
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                  <View style={styles.errorWrap}>
                    {touched.password && errors.password && (
                      <Text style={[styles.errorMessage, rtlText]}>
                        {errors.password}
                      </Text>
                    )}
                  </View>
                  {/* Terms & Conditions Toggle */}
                  <TouchableOpacity
                    style={[styles.tnCToggle, rtlView]}
                    onPress={() => setTnCToggle(!tnCToggle)}
                  >
                    <MaterialCommunityIcons
                      name={
                        tnCToggle ? "checkbox-marked" : "checkbox-blank-outline"
                      }
                      size={24}
                      color={COLORS.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          { paddingLeft: rtl_support ? 0 : 5 },
                          rtlTextPE5,
                        ]}
                      >
                        {__("listingFormTexts.tnCToggleText", appSettings.lng)}
                        <Text style={styles.tncText} onPress={handleTnCShow}>
                          {__("listingFormTexts.tncText", appSettings.lng)}
                        </Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <AppButton
                    onPress={handleSubmit}
                    title={__(
                      "signUpScreenTexts.signUpButtonTitle",
                      appSettings.lng
                    )}
                    style={styles.signUpBtn}
                    textStyle={styles.signUpBtnTxt}
                    disabled={
                      Object.keys(errors).length > 0 ||
                      Object.keys(touched).length === 0 ||
                      !tnCToggle
                    }
                    loading={loading}
                  />
                  <View style={styles.responseErrorWrap}>
                    <Text style={styles.responseErrorMessage}>
                      {responseErrorMessage}
                    </Text>
                  </View>
                </View>
              )}
            </Formik>
          </View>

          <FlashNotification
            falshShow={flashNotification}
            flashMessage={flashNotificationMessage}
            containerStyle={styles.flashContainerStyle}
          />
        </View>
      </ScrollView>
      {/* Terms & Conditions */}
      <Modal animationType="slide" transparent={true} visible={tnCVisible}>
        <SafeAreaView
          style={[styles.tncModal, { marTop: Constants.statusBarHeight }]}
        >
          <ScrollView contentContainerStyle={styles.tnCModalContent}>
            <Text
              style={[
                {
                  textAlign: "center",
                  fontWeight: "bold",
                  marginTop: 10,
                  fontSize: 17,
                },
                rtlText,
              ]}
            >
              {__("listingFormTexts.tncTitleText", appSettings.lng)}
            </Text>
            <View
              style={{
                paddingVertical: 10,
                paddingHorizontal: 10,
              }}
            >
              {tnCData.map((_tnc, index) => (
                <View style={styles.tncParaWrap} key={index}>
                  {!!_tnc.paraTitle && (
                    <Text style={[styles.paraTitle, rtlText]}>
                      {_tnc.paraTitle}
                    </Text>
                  )}
                  <Text style={[styles.paraData, rtlText]}>
                    {_tnc.paraData}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.tnCClose} onPress={handleTnCShow}>
            <Text style={[styles.tnCCloseText, rtlText]}>
              {__("paymentMethodScreen.closeButton", appSettings.lng)}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
  },
  errorMessage: {
    color: COLORS.red,
    fontSize: 12,
  },
  errorWrap: {
    height: 20,
  },
  flashContainerStyle: {
    top: "85%",
    bottom: "5%",
  },
  signUpForm: {
    width: "100%",
    paddingTop: 10,
    marginBottom: 40,
  },
  inputCommon: {
    marginVertical: 10,
    justifyContent: "center",
    height: 38,
    borderRadius: 3,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border_light,
  },
  label: {
    alignItems: "flex-start",
  },
  loginPrompt: {
    marginTop: 40,
  },
  paraData: {
    textAlign: "justify",
  },
  paraTitle: {
    fontWeight: "bold",
    fontSize: 15,
    paddingBottom: 5,
  },
  required: {
    color: COLORS.red,
  },
  responseErrorWrap: {
    alignItems: "center",
  },
  responseErrorMessage: {
    color: COLORS.red,
    fontSize: 15,
    fontWeight: "bold",
  },
  signUpBtn: {
    height: 40,
    borderRadius: 3,
    marginVertical: 10,
    width: "100%",
  },
  tnCClose: {
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    height: screenHeight / 22,
    borderRadius: 3,
  },
  tnCCloseText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "bold",
  },
  tncModal: {
    backgroundColor: COLORS.white,
    flex: 1,
    alignItems: "center",
  },
  tnCModalContent: {
    marginHorizontal: "3%",
    marginBottom: screenHeight / 20,
  },
  tnCModalText: {
    color: COLORS.text_dark,
    fontSize: 15,
  },
  tncParaWrap: {
    marginBottom: 20,
  },
  tncText: {
    color: "#ff6600",
  },
  tnCToggle: {
    flexDirection: "row",
    paddingHorizontal: screenWidth * 0.03,
    alignItems: "center",
    marginVertical: 10,
  },
});

export default SignUpScreen;
