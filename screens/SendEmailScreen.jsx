/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";

// External Libraries
import { Formik } from "formik";
import * as Yup from "yup";

// Custom components & Functions
import { COLORS } from "../variables/color";
import AppButton from "../components/AppButton";
import api, { setAuthToken, removeAuthToken } from "../api/client";
import { useStateValue } from "../StateProvider";
import FlashNotification from "../components/FlashNotification";
import { __ } from "../language/stringPicker";

const SendEmailScreen = ({ navigation, route }) => {
  const [{ auth_token, user, ios, appSettings, rtl_support }] = useStateValue();
  const [validationSchema, setValidationSchema] = useState(
    Yup.object().shape({
      message: Yup.string()
        .required(
          __("sendEmailScreenTexts.formFieldLabels.message", appSettings.lng) +
            " " +
            __(
              "sendEmailScreenTexts.formValidation.requiredField",
              appSettings.lng
            )
        )
        .min(
          3,
          __("sendEmailScreenTexts.formFieldLabels.message", appSettings.lng) +
            " " +
            __(
              "sendEmailScreenTexts.formValidation.minimumLength3",
              appSettings.lng
            )
        ),
      name: Yup.string().required(
        __("sendEmailScreenTexts.formFieldLabels.name", appSettings.lng) +
          " " +
          __(
            "sendEmailScreenTexts.formValidation.requiredField",
            appSettings.lng
          )
      ),
      email: Yup.string()
        .required(
          __("sendEmailScreenTexts.formFieldLabels.email", appSettings.lng) +
            " " +
            __(
              "sendEmailScreenTexts.formValidation.requiredField",
              appSettings.lng
            )
        )
        .email(
          __("sendEmailScreenTexts.formValidation.validEmail", appSettings.lng)
        ),
    })
  );
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState(route.params.source);
  const [done, setDone] = useState(false);
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();

  const sendEmail = (values) => {
    setLoading(true);

    let mailData;
    let slug;
    if (source === "listing") {
      mailData = {
        listing_id: route.params.listing.id,
        message: values.message,
        name: values.name,
        email: values.email,
      };
      slug = "listing/email-seller";
    } else {
      mailData = {
        store_id: route.params.store.id,
        message: values.message,
        name: values.name,
        email: values.email,
        phone: values.phone,
      };
      slug = "store/email-owner";
    }

    setAuthToken(auth_token);
    api.post(slug, mailData).then((res) => {
      if (res.ok) {
        setDone((done) => !done);
        setLoading(false);
        removeAuthToken();
        handleSuccess(
          __("sendEmailScreenTexts.serverResponse.success", appSettings.lng)
        );
      } else {
        setLoading(false);
        removeAuthToken();
        if (res.problem === "TIMEOUT_ERROR") {
          handleError(
            __("sendEmailScreenTexts.serverResponse.timeOut", appSettings.lng)
          );
        } else {
          handleError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("sendEmailScreenTexts.serverResponse.fail", appSettings.lng)
          );
        }
      }
    });
  };

  const getUserName = () => {
    if (!user.first_name && !user.last_name) {
      return user.username;
    } else {
      return (user.first_name || "") + " " + (user.last_name || "");
    }
  };
  const handleSuccess = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setLoading(false);
      setFlashNotificationMessage();
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
      setFlashNotificationMessage();
      setLoading((prevLoading) => false);
    }, 1500);
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
    <KeyboardAvoidingView
      behavior={ios ? "padding" : "height"}
      style={styles.container}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <View style={styles.titleWrap}>
          {source === "listing" && (
            <Text style={[styles.title, rtlText]} numberOfLines={2}>
              {route.params.listing.title}
            </Text>
          )}
          {source === "store" && (
            <Text style={[styles.title, rtlText]} numberOfLines={2}>
              {route.params.store.title}
            </Text>
          )}
        </View>
        <View style={[styles.formWrap, { paddingBottom: 50 }]}>
          <Formik
            initialValues={{
              message: "",
              name: getUserName() || "",
              email: user.email || "",
              phone: user.phone || "",
            }}
            onSubmit={(values) => sendEmail(values)}
            validationSchema={validationSchema}
          >
            {({
              handleChange,
              handleSubmit,
              values,
              errors,
              setFieldTouched,
              touched,
            }) => (
              <View style={styles.formContentWrap}>
                <TextInput
                  blurOnSubmit={false}
                  style={[styles.textInput, rtlTextA]}
                  onChangeText={handleChange("name")}
                  onBlur={() => setFieldTouched("name")}
                  value={values.name}
                  placeholder={__(
                    "sendEmailScreenTexts.formFieldPlaceholders.name",
                    appSettings.lng
                  )}
                  editable={!getUserName()}
                  placeholderTextColor={COLORS.text_gray}
                />
                <View style={styles.errorWrap}>
                  {touched.name && errors.name && (
                    <Text style={[styles.errorMessage, rtlTextA]}>
                      {errors.name}
                    </Text>
                  )}
                </View>
                <TextInput
                  blurOnSubmit={false}
                  style={[styles.textInput, rtlTextA]}
                  onChangeText={handleChange("email")}
                  onBlur={() => setFieldTouched("email")}
                  value={values.email}
                  placeholder={__(
                    "sendEmailScreenTexts.formFieldPlaceholders.email",
                    appSettings.lng
                  )}
                  editable={!user.email}
                />
                <View style={styles.errorWrap}>
                  {touched.email && errors.email && (
                    <Text style={[styles.errorMessage, rtlTextA]}>
                      {errors.email}
                    </Text>
                  )}
                </View>
                {source === "store" && (
                  <>
                    <TextInput
                      blurOnSubmit={false}
                      style={[styles.textInput, rtlTextA]}
                      onChangeText={handleChange("phone")}
                      onBlur={() => setFieldTouched("phone")}
                      value={values.phone}
                      placeholder={__(
                        "sendEmailScreenTexts.formFieldPlaceholders.phone",
                        appSettings.lng
                      )}
                      editable={!user.phone}
                    />
                    <View style={styles.errorWrap}>
                      {touched.phone && errors.phone && (
                        <Text style={[styles.errorMessage, rtlTextA]}>
                          {errors.phone}
                        </Text>
                      )}
                    </View>
                  </>
                )}
                <TextInput
                  multiline={true}
                  blurOnSubmit={false}
                  style={[styles.textInput, styles.textAreaInput, rtlTextA]}
                  onChangeText={handleChange("message")}
                  onBlur={() => setFieldTouched("message")}
                  value={values.message}
                  placeholder={__(
                    "sendEmailScreenTexts.formFieldPlaceholders.message",
                    appSettings.lng
                  )}
                  textAlignVertical="top"
                  onFocus={() => setFieldTouched("message")}
                />
                <View style={styles.errorWrap}>
                  {touched.message && errors.message && (
                    <Text style={[styles.errorMessage, rtlTextA]}>
                      {errors.message}
                    </Text>
                  )}
                </View>

                <AppButton
                  onPress={handleSubmit}
                  title={__(
                    "sendEmailScreenTexts.sendEmailButtonTitle",
                    appSettings.lng
                  )}
                  style={styles.btnStyle}
                  textStyle={styles.btnText}
                  disabled={
                    Object.keys(touched).length < 1 ||
                    Object.keys(values).length < 1 ||
                    Object.keys(errors).length > 0 ||
                    done
                  }
                  loading={loading}
                />
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>

      <FlashNotification
        falshShow={flashNotification}
        flashMessage={flashNotificationMessage}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  btnStyle: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 3,
    marginVertical: 20,
  },
  btnText: {
    fontSize: 17,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.bg_dark,
  },
  directionText: {
    textAlign: "center",
    fontSize: 17,
    color: COLORS.text_gray,
  },
  errorMessage: {
    fontSize: 12,
    color: COLORS.primary,
  },
  errorWrap: {
    height: 14,
  },

  formContentWrap: {
    marginTop: 20,
  },
  formWrap: {
    paddingHorizontal: "3%",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  modalText: {
    fontSize: 17,
    paddingBottom: 12,
  },
  modalView: {
    width: "94%",
    backgroundColor: "white",
    borderRadius: 3,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  picker: {
    flexDirection: "row",
    height: 40,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerOptions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  pickerOptionsText: {
    fontSize: 16,
    color: COLORS.text_dark,
  },
  pickerText: {
    fontSize: 16,
    justifyContent: "center",
    color: COLORS.text_gray,
  },
  reasonPicker: {},
  questionText: {
    textAlign: "center",
    fontSize: 22,
    color: COLORS.text_dark,
    paddingVertical: 20,
  },
  formSeparator: {
    width: "100%",
    height: 1,
  },
  textAreaInput: {
    minHeight: 80,
  },
  textInput: {
    fontSize: 16,
    minHeight: 35,
    borderWidth: 1,
    borderColor: COLORS.gray,
    marginTop: 10,
    borderRadius: 3,
    paddingHorizontal: 5,
  },
  textWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "3%",
    backgroundColor: COLORS.white,
  },
  title: {
    textAlign: "center",
    fontSize: 25,
    color: COLORS.text_dark,
    paddingVertical: 10,
  },
  titleWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: "3%",
  },
});

export default SendEmailScreen;
