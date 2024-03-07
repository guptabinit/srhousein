import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import MembershipCard from "../components/MembershipCard";
import { routes } from "../navigation/routes";
import { COLORS } from "../variables/color";
import { AntDesign } from "@expo/vector-icons";
import { useStateValue } from "../StateProvider";
import api, { removeAuthToken, setAuthToken } from "../api/client";
import { __ } from "../language/stringPicker";

const MembershipsScreen = ({ route, navigation }) => {
  const [{ auth_token, appSettings, rtl_support }] = useStateValue();
  const [selected, setSelected] = useState();
  const [loading, setLoading] = useState(true);
  const [membershipPackagesData, setMembershipPackagesData] = useState([]);
  const [zeroPayment, setZeroPayment] = useState(false);

  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  useEffect(() => {
    getMembershipPackageData();
  }, []);

  const getMembershipPackageData = () => {
    setAuthToken(auth_token);
    api
      .get("plans", { type: "membership" })
      .then((res) => {
        if (res.ok) {
          setMembershipPackagesData(res.data);
        } else {
          // TODO handle error
        }
      })
      .then(() => {
        removeAuthToken();
        setLoading(false);
      });
  };

  const onSelect = (item) => {
    if (parseFloat(item?.price) + 0 === 0) {
      setZeroPayment(true);
    } else {
      setZeroPayment(false);
    }
    setSelected(item);
  };

  const proceedToPayment = () => {
    if (zeroPayment) {
      navigation.navigate(routes.zeroPayment, {
        selected: selected,
        type: "membership",
      });
    } else {
      navigation.navigate(routes.paymentMethodScreen, {
        selected: selected,
        type: "membership",
      });
    }
  };
  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingTop: 15, paddingBottom: 60 }}
        >
          <View style={styles.view}>
            {membershipPackagesData.map((memPlan, index) => (
              <MembershipCard
                key={memPlan.id}
                memPlan={memPlan}
                onSelect={() => onSelect(memPlan)}
                selected={selected}
              />
            ))}
          </View>
        </ScrollView>
      )}
      {!loading && (
        <View style={styles.buttonWrap}>
          <TouchableOpacity
            style={[
              styles.showMoreButton,
              {
                backgroundColor: selected
                  ? COLORS.button.active
                  : COLORS.button.disabled,
              },
            ]}
            onPress={proceedToPayment}
            disabled={!selected}
          >
            <Text
              style={[styles.showMoreButtonText, rtlText]}
              numberOfLines={1}
            >
              {__(
                zeroPayment
                  ? "membershipsScreenTexts.checkOut"
                  : "membershipsScreenTexts.makePayment",
                appSettings.lng
              )}
            </Text>
            <View style={styles.iconWrap}>
              <AntDesign name="arrowright" size={18} color={COLORS.white} />
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonWrap: {
    marginHorizontal: "4%",
    backgroundColor: "transparent",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    flex: 1,
  },
  iconWrap: {
    marginLeft: 5,
    marginTop: 2,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  showMoreButton: {
    borderRadius: 3,
    marginVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  showMoreButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
  },
});

export default MembershipsScreen;
