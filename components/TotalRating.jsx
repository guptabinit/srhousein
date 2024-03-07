import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { FontAwesome } from "@expo/vector-icons";
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";

const TotalRating = ({ ratio }) => {
  const [{ rtl_support }] = useStateValue();
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };
  const arr = ratio.split(".");
  let fullStar = parseInt(arr[0]);
  const partial = parseInt(arr[1]);

  return (
    <View style={styles.container}>
      <View style={[styles.totalRatingWrap, rtlView]}>
        <View style={styles.ratingStarWrap}>
          <FontAwesome
            name={
              fullStar >= 1
                ? "star"
                : partial > 75
                ? "star"
                : partial > 25
                ? "star-half-o"
                : "star-o"
            }
            size={16}
            color={COLORS.rating_star}
          />
        </View>
        <View style={styles.ratingStarWrap}>
          <FontAwesome
            name={
              fullStar >= 2
                ? "star"
                : partial > 75 && fullStar > 0
                ? "star"
                : partial > 25 && fullStar > 0
                ? "star-half-o"
                : "star-o"
            }
            size={16}
            color={COLORS.rating_star}
          />
        </View>
        <View style={styles.ratingStarWrap}>
          <FontAwesome
            name={
              fullStar >= 3
                ? "star"
                : partial > 75 && fullStar > 1
                ? "star"
                : partial > 25 && fullStar > 1
                ? "star-half-o"
                : "star-o"
            }
            size={16}
            color={COLORS.rating_star}
          />
        </View>
        <View style={styles.ratingStarWrap}>
          <FontAwesome
            name={
              fullStar >= 4
                ? "star"
                : partial > 75 && fullStar > 2
                ? "star"
                : partial > 25 && fullStar > 2
                ? "star-half-o"
                : "star-o"
            }
            size={16}
            color={COLORS.rating_star}
          />
        </View>
        <View style={styles.ratingStarWrap}>
          <FontAwesome
            name={
              fullStar >= 5
                ? "star"
                : partial > 75 && fullStar > 3
                ? "star"
                : partial > 25 && fullStar > 3
                ? "star-half-o"
                : "star-o"
            }
            size={16}
            color={COLORS.rating_star}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  ratingStarWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 1.5,
  },
  totalRatingWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default TotalRating;
