import React from "react";
import { View, StyleSheet, TouchableWithoutFeedback } from "react-native";

// Vector Icons
import { FontAwesome5 } from "@expo/vector-icons";

// Custom Components & Functions
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";

const NewListingButton = ({ onPress }) => {
  const [{ newListingScreen, user }] = useStateValue();
  return (
    <View
      style={newListingScreen && user ? styles.buttonHidden : styles.button}
    >
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.content}>
          <View
            style={{
              alignItems: "center",
              backgroundColor: COLORS.addNewBtn.circle2,
              borderRadius: 19,
              height: 38,
              justifyContent: "center",
              width: 38,
            }}
          >
            <View
              style={{
                alignItems: "center",
                backgroundColor: COLORS.addNewBtn.innerCircle,
                borderRadius: 13,
                height: 26,
                justifyContent: "center",
                width: 26,
              }}
            >
              <FontAwesome5
                name="plus"
                size={15}
                color={COLORS.addNewBtn.plus}
              />
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    bottom: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    height: 60,
    width: 60,
    borderRadius: 30,
  },
  buttonHidden: {
    alignItems: "center",
  },
  buttonTitle: {
    textTransform: "uppercase",
    fontSize: 9,
  },

  content: {
    alignItems: "center",
    backgroundColor: COLORS.addNewBtn.outerCircle,
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
});

export default NewListingButton;
