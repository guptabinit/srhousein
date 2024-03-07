import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Vector Icons
import { FontAwesome } from "@expo/vector-icons";

// Custom Components
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";

const dataObj = {
  "is-featured": "featured",
  "is-top": "top",
  "is-bump-up": "bump_up",
  new: "new",
  popular: "popular",
};
const Badge = ({ badgeName, badgeStyle, badgeTextStyle, type }) => {
  const [{ rtl_support, config }] = useStateValue();
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const tempBadgeName = dataObj[badgeName] || null;
  let displayName;
  if (tempBadgeName && config?.badges) {
    displayName = config?.badges[tempBadgeName]?.label
      ? config?.badges[tempBadgeName]?.label
      : null;
  } else {
    displayName = null;
  }

  if (displayName) {
    if (badgeName == "_bump_up" && type == "card") {
      return (
        <View
          style={[
            styles.container,
            {
              backgroundColor: COLORS.badges[badgeName],
              borderRadius: 3,
              padding: 5,
            },
            badgeStyle,
          ]}
        >
          <FontAwesome name="clock-o" size={16} color={COLORS.white} />
        </View>
      );
    } else {
      if (config?.badges[tempBadgeName]?.single)
        return (
          <View
            style={[
              styles.container,
              {
                backgroundColor:
                  config?.badges[tempBadgeName]?.color?.bg ||
                  COLORS.badges.bg[badgeName],
                borderRadius: type == "card" ? 3 : 20,
                paddingVertical: 5,
                paddingHorizontal: type == "card" ? 5 : 15,
              },
              badgeStyle,
            ]}
          >
            <Text
              style={[
                {
                  color:
                    config?.badges[tempBadgeName]?.color?.text ||
                    COLORS.badges.text[badgeName],
                },
                badgeTextStyle,
                rtlText,
              ]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
          </View>
        );
    }
  } else return null;
};

const styles = StyleSheet.create({
  container: {
    marginRight: 5,
    marginBottom: 10,
  },
});

export default Badge;
