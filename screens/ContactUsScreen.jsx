/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";

// External Libraries
import { Formik } from "formik";
import * as Yup from "yup";

// Custom Components & Constants
import { COLORS } from "../variables/color";
import AppButton from "../components/AppButton";
import AppSeparator from "../components/AppSeparator";
import { useStateValue } from "../StateProvider";
import api from "../api/client";
import FlashNotification from "../components/FlashNotification";
import { __ } from "../language/stringPicker";

const ContactUsScreen = ({ navigation }) => {
  const [{ user, ios, appSettings, rtl_support }] = useStateValue();
  const [validationSchema] = useState(
    Yup.object().shape({
      name: Yup.string()
        .required(
          __("contactUsScreenTexts.formData.name.errorLabel", appSettings.lng) +
            " " +
            __(
              "contactUsScreenTexts.formValidation.requiredField",
              appSettings.lng
            )
        )
        .min(
          3,
          __("contactUsScreenTexts.formData.name.errorLabel", appSettings.lng) +
            " " +
            __(
              "contactUsScreenTexts.formValidation.minimumLength3",
              appSettings.lng
            )
        )
        .label(
          __("contactUsScreenTexts.formData.name.errorLabel", appSettings.lng)
        ),
      phone: Yup.string()
        .min(
          5,
          __(
            "contactUsScreenTexts.formData.phone.errorLabel",
            appSettings.lng
          ) +
            " " +
            __(
              "contactUsScreenTexts.formValidation.minimumLength5",
              appSettings.lng
            )
        )
        .label(
          __("contactUsScreenTexts.formData.phone.errorLabel", appSettings.lng)
        ),
      email: Yup.string()
        .email(
          __("contactUsScreenTexts.formValidation.validEmail", appSettings.lng)
        )
        .required(
          __(
            "contactUsScreenTexts.formData.email.errorLabel",
            appSettings.lng
          ) +
            " " +
            __(
              "contactUsScreenTexts.formValidation.requiredField",
              appSettings.lng
            )
        )
        .label(
          __("contactUsScreenTexts.formData.email.errorLabel", appSettings.lng)
        ),
      message: Yup.string()
        .required(
          __(
            "contactUsScreenTexts.formData.message.errorLabel",
            appSettings.lng
          ) +
            " " +
            __(
              "contactUsScreenTexts.formValidation.requiredField",
              appSettings.lng
            )
        )
        .min(
          3,
          __(
            "contactUsScreenTexts.formData.message.errorLabel",
            appSettings.lng
          ) +
            " " +
            __(
              "contactUsScreenTexts.formValidation.minimumLength3",
              appSettings.lng
            )
        )
        .label(
          __(
            "contactUsScreenTexts.formData.message.errorLabel",
            appSettings.lng
          )
        ),
    })
  );
  const [formErrorMessage, setFormErrorMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();

  const handleMessageSubmission = (values) => {
    setFormErrorMessage();
    setLoading(true);
    Keyboard.dismiss();

    api
      .post("contact", {
        name: values.name,
        phone: values.phone,
        email: values.email,
        message: values.message,
      })
      .then((res) => {
        if (res.ok) {
          setFlashNotificationMessage(
            __("contactUsScreenTexts.successMessage", appSettings.lng)
          );
          handleSuccess();
          // setLoading(false);
          // navigation.goBack();
        } else {
          setFormErrorMessage(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __(
                "contactUsScreenTexts.customServerResponseError",
                appSettings.lng
              )
          );
          setFlashNotificationMessage(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __(
                "contactUsScreenTexts.customServerResponseError",
                appSettings.lng
              )
          );

          handleError();
        }
      });
  };

  const handleSuccess = () => {
    setFlashNotification(true);

    setTimeout(() => {
      setFlashNotification(false);
      setLoading(false);
      navigation.goBack();
    }, 1000);
  };
  const handleError = () => {
    setFlashNotification(true);

    setTimeout(() => {
      setFlashNotification(false);
      setLoading(false);
    }, 1000);
  };

  const rtlText = rtl_support && {
    writingDirection: "rtl",
    textAlign: ios ? "justify" : "right",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  return (
    <KeyboardAvoidingView
      behavior={ios ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.white }}
      keyboardVerticalOffset={70}
    >
      <ScrollView>
        <View style={[styles.container, { paddingBottom: 50 }]}>
          {/* Form Component */}
          <Formik
            initialValues={{
              name: user
                ? !!user.first_name || !!user.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : ""
                : "",
              phone: user?.phone || "",
              email: user?.email || "",
              message: "",
            }}
            onSubmit={handleMessageSubmission}
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
              <View>
                {/* Name Input Component */}
                <View style={styles.inputWrap}>
                  {/* <Text style={[styles.inputLabel, rtlText]}>
                    {__(
                      'contactUsScreenTexts.formData.name.label',
                      appSettings.lng,
                    )}
                    {` `}
                    <Text style={styles.required}> *</Text>
                  </Text> */}
                  <View style={styles.input}>
                    <TextInput
                      style={[styles.formInput, rtlText]}
                      onChangeText={handleChange("name")}
                      onBlur={() => setFieldTouched("name")}
                      value={values.name}
                      placeholder={__(
                        "contactUsScreenTexts.formData.name.placeholder",
                        appSettings.lng
                      )}
                      editable={
                        user === null || (!user.first_name && !user.last_name)
                      }
                      placeholderTextColor={COLORS.text_gray}
                    />
                  </View>

                  <View style={styles.inputErrorWrap}>
                    {touched.name && errors.name && (
                      <Text style={[styles.inputErrorMessage, rtlText]}>
                        {errors.name}
                      </Text>
                    )}
                  </View>
                </View>
                {/* Phone Input Component */}
                <View style={styles.inputWrap}>
                  {/* <Text style={[styles.inputLabel, rtlText]}>
                    {__(
                      'contactUsScreenTexts.formData.phone.label',
                      appSettings.lng,
                    )}
                  </Text> */}
                  <View style={styles.input}>
                    <TextInput
                      style={[styles.formInput, rtlText]}
                      onChangeText={handleChange("phone")}
                      onBlur={() => setFieldTouched("phone")}
                      value={values.phone}
                      placeholder={__(
                        "contactUsScreenTexts.formData.phone.placeholder",
                        appSettings.lng
                      )}
                      editable={user === null || !user.phone}
                      keyboardType="phone-pad"
                      placeholderTextColor={COLORS.text_gray}
                    />
                  </View>

                  <View style={styles.inputErrorWrap}>
                    {touched.phone && errors.phone && (
                      <Text style={[styles.inputErrorMessage, rtlText]}>
                        {errors.phone}
                      </Text>
                    )}
                  </View>
                </View>
                {/* Email Input Component */}
                <View style={styles.inputWrap}>
                  {/* <Text style={[styles.inputLabel, rtlText]}>
                    {__(
                      'contactUsScreenTexts.formData.email.label',
                      appSettings.lng,
                    )}
                    {` `}
                    <Text style={styles.required}> *</Text>
                  </Text> */}
                  <View style={styles.input}>
                    <TextInput
                      style={[styles.formInput, rtlText]}
                      onChangeText={handleChange("email")}
                      onBlur={() => setFieldTouched("email")}
                      value={values.email}
                      placeholder={__(
                        "contactUsScreenTexts.formData.email.placeholder",
                        appSettings.lng
                      )}
                      editable={user === null || !user.email}
                      keyboardType="email-address"
                      placeholderTextColor={COLORS.text_gray}
                    />
                  </View>

                  <View style={styles.inputErrorWrap}>
                    {touched.email && errors.email && (
                      <Text style={[styles.inputErrorMessage, rtlText]}>
                        {errors.email}
                      </Text>
                    )}
                  </View>
                </View>
                {/* Message Input Component */}
                <View style={styles.inputWrap}>
                  {/* <Text style={[styles.inputLabel, rtlText]}>
                    {__(
                      'contactUsScreenTexts.formData.message.label',
                      appSettings.lng,
                    )}
                    {` `}
                    <Text style={styles.required}> *</Text>
                  </Text> */}
                  <View style={styles.input}>
                    <TextInput
                      style={[
                        styles.formInput,
                        styles.textArea,
                        { minHeight: 100 },
                        rtlText,
                      ]}
                      onChangeText={handleChange("message")}
                      onBlur={() => setFieldTouched("message")}
                      value={values.message}
                      placeholder={__(
                        "contactUsScreenTexts.formData.message.placeholder",
                        appSettings.lng
                      )}
                      multiline={true}
                      blurOnSubmit={false}
                      placeholderTextColor={COLORS.text_gray}
                    />
                  </View>

                  <View style={styles.inputErrorWrap}>
                    {touched.message && errors.message && (
                      <Text style={[styles.inputErrorMessage, rtlText]}>
                        {errors.message}
                      </Text>
                    )}
                  </View>
                </View>
                {/* Send Message Button Component */}
                <AppButton
                  onPress={handleSubmit}
                  title={__(
                    "contactUsScreenTexts.sendmessageButtontitle",
                    appSettings.lng
                  )}
                  style={styles.button}
                  textStyle={styles.buttonText}
                  disabled={
                    user
                      ? Object.keys(errors).length > 0 ||
                        !values.message ||
                        !values.name ||
                        !values.email
                      : Object.keys(errors).length > 0 ||
                        Object.keys(touched).length < 1
                  }
                  loading={loading}
                />
                <View style={styles.formErrorWrap}>
                  {formErrorMessage && (
                    <Text style={styles.formErrorMessage}>
                      {formErrorMessage}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>
      {/* Flash Notification Component */}
      <FlashNotification
        falshShow={flashNotification}
        flashMessage={flashNotificationMessage}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 3,
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "500",
  },
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: "3%",
    paddingTop: 20,
    width: "100%",

    flex: 1,
  },
  scrollContainer: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  formErrorMessage: {
    fontSize: 15,
    color: COLORS.red,
    fontWeight: "bold",
  },
  formErrorWrap: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  formInput: {
    color: COLORS.text_dark,
    fontSize: 16,
    minHeight: 32,
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border_light,
    borderRadius: 4,
  },

  inputErrorWrap: {
    minHeight: 20,
  },
  inputErrorMessage: {
    fontSize: 12,
    color: COLORS.red,
  },
  inputLabel: {
    fontSize: 14,
    color: COLORS.text_gray,
  },
  inputWrap: {},
  pageTitle: {
    fontSize: 20,
    color: COLORS.text_dark,
  },
  required: {
    color: COLORS.red,
  },
  separator: {
    width: "100%",
    backgroundColor: COLORS.gray,
  },
  textArea: {
    textAlignVertical: "top",
    padding: 5,
    borderRadius: 3,
  },
});

export default ContactUsScreen;
