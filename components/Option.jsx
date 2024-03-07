import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

// Custom Components & Constants
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import DocumentIcon from "./svgComponents/DocumentIcon";
import { configuration } from "../configuration/configuration";

const Option = ({ title, onPress, uri, item }) => {
  const [{ config, user, rtl_support }] = useStateValue();
  const rtlText = rtl_support && {
    writingDirection: "rtl",
    paddingEnd: 10,
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  if (!item) return null;
  if (!user) {
    return (
      <TouchableOpacity onPress={onPress}>
        <View style={[styles.option, rtlView]}>
          <View
            style={{
              height: 20,
              width: 20,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {uri ? (
              <Image
                source={uri}
                style={{
                  height: "100%",
                  width: "100%",
                  resizeMode: "contain",
                }}
              />
            ) : (
              <FontAwesome name={item.icon} size={20} color={COLORS.primary} />
            )}
          </View>

          <Text style={[styles.optionTitle, rtlText]}>{title}</Text>
        </View>
      </TouchableOpacity>
    );
  } else {
    if (
      !!config?.iap_disabled &&
      config.iap_disabled == configuration.currentVersion &&
      ["my_store", "all_stores", "my_membership", "payments"].includes(item.id)
    ) {
      return null;
    } else {
      if (
        (!config?.store_enabled ||
          (config?.store_enabled &&
            config?.store?.store_only_membership &&
            !user?.membership)) &&
        "my_store" === item.id
      ) {
        return null;
      } else if (
        !config?.store_enabled &&
        ["my_store", "all_stores"].includes(item.id)
      ) {
        return null;
      } else if (!config?.membership_enabled && "my_membership" === item.id) {
        return null;
      } else if (
        !config?.membership_enabled &&
        !config?.store_enabled &&
        config?.iap_disabled &&
        "payments" === item.id
      ) {
        return null;
      } else if (!config?.seller_verification && "my_documents" === item.id) {
        return null;
      } else {
        return (
          <TouchableOpacity onPress={onPress}>
            <View style={[styles.option, rtlView]}>
              {uri && (
                <View
                  style={{
                    height: 20,
                    width: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    source={uri}
                    style={{
                      height: "100%",
                      width: "100%",
                      resizeMode: "contain",
                    }}
                  />
                </View>
              )}
              {item?.id == "my_documents" && (
                <DocumentIcon fillColor={COLORS.primary} />
              )}
              {item?.id == "privacy_safety" && (
                <MaterialIcons
                  color={COLORS.primary}
                  name={"privacy-tip"}
                  size={18}
                />
              )}
              <Text style={[styles.optionTitle, rtlText]}>{title}</Text>
            </View>
          </TouchableOpacity>
        );
      }
    }
  }
};

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    paddingVertical: 12,
    backgroundColor: COLORS.bg_light,
    marginHorizontal: 3,
    paddingHorizontal: "2.3%",
  },
  optionTitle: {
    fontWeight: "bold",
    color: COLORS.text_gray,
    paddingLeft: 10,
  },
  separator: {
    width: "auto",
    backgroundColor: COLORS.bg_dark,
    height: 2,
  },
});

export default Option;
