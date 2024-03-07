import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useStateValue } from "../StateProvider";
import { COLORS } from "../variables/color";
import api, { removeAuthToken, setAuthToken } from "../api/client";
import { routes } from "../navigation/routes";
import { __ } from "../language/stringPicker";
import AppTextButton from "../components/AppTextButton";

const ZeroPaymentScreen = ({ route, navigation }) => {
  const [{ auth_token, config, appSettings, user, rtl_support }, dispatch] =
    useStateValue();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    handleZeroPayment();
  }, []);

  const handleZeroPayment = () => {
    // console.log(JSON.stringify(route.params, null, 2));
    if (route?.params?.type === "membership") {
      args = {
        type: "membership",
        plan_id: route?.params?.selected?.id,
      };
    } else if (route?.params?.type === "promotion") {
      args = {
        type: "promotion",
        promotion_type: "regular",
        plan_id: route?.params?.selected?.id,
        listing_id: route?.params?.listingID,
      };
    }
    setAuthToken(auth_token);
    api
      .post("checkout", args)
      .then((res) => {
        if (res.ok) {
          setPaymentData(res.data);
          navigation.navigate(routes.paymentDetailScreen, {
            header: false,
            id: res.data.id,
          });
        } else {
          setError(
            res?.data?.error_message ||
              res?.data?.error ||
              res?.problem ||
              __("paymentMethodScreen.unknownError", appSettings.lng)
          );
        }
      })
      .then(() => {
        setLoading(false);
        removeAuthToken();
      });
  };

  const handleRetry = () => {
    if (loading) {
      setLoading(true);
    }
    if (error) {
      setError("");
    }
    if (success) {
      setSuccess(false);
    }
    handleZeroPayment();
  };

  return (
    <View style={styles.container}>
      {loading ? (
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
        <View
          style={{
            flex: 1,
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!!error && (
            <View style={styles.view}>
              <Text style={styles.text}>
                {__("paymentMethodScreen.paymentFailed", appSettings.lng)}
              </Text>
              <Text style={{ color: COLORS.red }}>{error}</Text>
              <View style={{ marginVertical: 20 }}>
                <AppTextButton
                  title={__(
                    "paymentMethodScreen.paymentFailed",
                    appSettings.lng
                  )}
                  onPress={handleRetry}
                />
              </View>
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

export default ZeroPaymentScreen;
