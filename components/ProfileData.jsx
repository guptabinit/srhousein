import React from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { useStateValue } from "../StateProvider";
import { useNavigation } from "@react-navigation/native";
import VerifiedIcon from "./svgComponents/VerifiedIcon";

// Custom Components & Constants
import { COLORS } from "../variables/color";
import { __ } from "../language/stringPicker";
import { routes } from "../navigation/routes";
import { firebaseConfig } from "../app/services/firebaseConfig";

const ProfileData = ({ label, value, phone }) => {
  const [{ rtl_support, config, user, appSettings }] = useStateValue();
  const navigation = useNavigation();
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };
  return (
    <View style={[styles.container, rtlView]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, rtlText]}>
          {label}
          {" :"}
        </Text>
      </View>
      <View style={{ flex: 2.5 }}>
        {!!config?.verification?.gateway && phone ? (
          <>
            {!user?.phone_verified ? (
              <View style={{ width: "100%" }}>
                <View
                  style={[
                    { flexDirection: "row", alignItems: "center" },
                    rtlView,
                  ]}
                >
                  <Text style={[styles.rowValue, rtlText]}>{value}</Text>
                </View>
                <TouchableWithoutFeedback
                  onPress={() => {
                    navigation.navigate(routes.oTPScreen, {
                      source: "profile",
                      // phone: value,
                    });
                  }}
                >
                  <View
                    style={{
                      backgroundColor: COLORS.primary,
                      alignItems: "center",
                      marginTop: 5,
                      padding: 7,
                      borderRadius: 3,
                    }}
                  >
                    <Text style={{ color: COLORS.white, fontWeight: "bold" }}>
                      {__(
                        "myProfileScreenTexts.verifyBtnTitle",
                        appSettings.lng
                      )}
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            ) : (
              <View
                style={[
                  { flexDirection: "row", alignItems: "center" },
                  rtlView,
                ]}
              >
                <Text style={[styles.rowValue, rtlText]}>{value}</Text>
                <View style={{ paddingHorizontal: 5 }}>
                  <VerifiedIcon
                    fillColor={COLORS.green}
                    tickColor={COLORS.white}
                  />
                </View>
              </View>
            )}
          </>
        ) : (
          <Text style={[styles.rowValue, rtlText]}>{value}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    flexDirection: "row",
  },
  rowLabel: {
    color: COLORS.text_medium,
    fontWeight: "bold",
    textTransform: "capitalize",
    fontSize: 15,
  },
  rowValue: {
    color: COLORS.text_medium,
    fontSize: 15,
  },
});

export default ProfileData;
