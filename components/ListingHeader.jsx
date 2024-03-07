import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

// Vector Icons
import { FontAwesome, Entypo, Feather, Fontisto } from "@expo/vector-icons";

// Custom Components & Constants
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";

const ListingHeader = ({
  onBack,
  onFavorite,
  style,
  author,
  is_favourite,
  favoriteDisabled,
  favLoading,
  sharable,
  reportable,
  loading,
  onAction,
}) => {
  const [{ user, rtl_support }] = useStateValue();
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };

  return (
    <View style={[styles.container, styles.flexRow, style]}>
      <TouchableOpacity
        onPress={onBack}
        style={{
          backgroundColor: COLORS.white,
          height: 35,
          width: 35,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 35 / 2,
        }}
      >
        <Feather name="arrow-left" size={24} color={COLORS.gray} />
      </TouchableOpacity>

      <View style={styles.flexRow}>
        {user !== null && user.id !== author && !!author && (
          <View>
            <TouchableOpacity
              onPress={onFavorite}
              disabled={favoriteDisabled}
              style={{
                backgroundColor: COLORS.white,
                height: 35,
                width: 35,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 35 / 2,
              }}
            >
              {favLoading ? (
                <View
                  style={{
                    width: 35,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ActivityIndicator size="small" color={COLORS.gray} />
                </View>
              ) : (
                <FontAwesome
                  name={is_favourite ? "heart" : "heart-o"}
                  size={20}
                  color={COLORS.gray}
                />
              )}
            </TouchableOpacity>
          </View>
        )}
        {(reportable || sharable) && !loading && (
          <TouchableOpacity
            onPress={onAction}
            style={{
              paddingLeft: rtl_support ? 0 : 10,
              paddingRight: rtl_support ? 10 : 0,
            }}
          >
            <Entypo name="dots-three-vertical" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    paddingHorizontal: "3%",
    width: "100%",
    // position: "absolute",
    // top: 0,
    // left: 0,
    // zIndex: 1,
    height: 50,
    // backgroundColor: COLORS.primary,
  },
  flexRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  headerTitle: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 20,
  },
  shareButton: {
    width: 30,
  },
});

export default ListingHeader;
