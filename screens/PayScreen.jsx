import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AppTextButton from "../components/AppTextButton";
import { __ } from "../language/stringPicker";
import { COLORS } from "../variables/color";
import { FontAwesome5 } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { apiKey } from "../api/client";
import { useStateValue } from "../StateProvider";
import AppButton from "../components/AppButton";

const PayScreen = ({ navigation, route }) => {
  const [{ appSettings, auth_token, rtl_support }] = useStateValue();
  const [paymentError, setPaymentError] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);

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

  const handleWebPaymentURLDataChange = (data) => {
    if (data?.canGoBack === true && data?.loading === false) {
      navigation.goBack();
    }
  };
  const handleWebViewClose = () => {
    setPaymentLoading(false);
  };

  const onBack = () => {
    navigation.goBack();
  };
  return (
    <View style={styles.container}>
      {paymentLoading ? (
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
              onPress={handleWebViewClose}
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
                uri: `${route?.params?.paymentData?.gateway?.routes?.webPay}&api_key=${apiKey}&token=${auth_token}&order_id=${route?.params?.paymentData?.id}`,
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
        <View
          style={{
            flex: 1,
            backgroundColor: COLORS.white,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!paymentError && !paymentData && (
            <View style={styles.buttonWrap}>
              <AppButton
                title={__("paymentScreen.goBackBtnTitle", appSettings.lng)}
                onPress={onBack}
              />
            </View>
          )}
          {!!paymentError && (
            <View style={styles.paymentErrorWrap}>
              <Text style={styles.paymentError}>{paymentError}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
});

export default PayScreen;
