import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useStateValue } from "../StateProvider";

// Custom Components
import { COLORS } from "../variables/color";

const AppRadioButton = ({ field, handleClick, style, selected }) => {
  const [{ rtl_support }] = useStateValue();
  const [active, setActive] = useState();

  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };
  return (
    <View style={[styles.container, style]}>
      {field.map((item) => (
        <TouchableOpacity
          key={`${item.id}`}
          onPress={() => {
            setActive(item.id);
            handleClick(item);
          }}
          disabled={active === item.id || selected === item.id}
          style={[styles.radioOption, rtlView]}
        >
          <View style={styles.radioBorder}>
            {(active === item.id || selected === item.id) && (
              <View style={styles.selected} />
            )}
          </View>
          <View style={styles.view}>
            <Text
              style={[
                styles.radioOptionText,
                {
                  marginLeft: rtl_support ? 15 : 5,
                  marginRight: rtl_support ? 5 : 15,
                },
                rtlTextA,
              ]}
            >
              {item.name}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioBorder: {
    height: 16,
    width: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioOptionText: {
    fontSize: 15,
    color: COLORS.text_gray,
  },
  selected: {
    height: 7,
    width: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});

export default AppRadioButton;
