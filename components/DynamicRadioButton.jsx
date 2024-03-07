import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { decodeString } from "../helper/helper";
import { useStateValue } from "../StateProvider";

// Custom Components
import { COLORS } from "../variables/color";

const DynamicRadioButton = ({ field, handleClick, style, selected }) => {
  const [{ rtl_support }] = useStateValue();
  const [active, setActive] = useState();
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
  return (
    <View style={[styles.container, style, rtlView]}>
      {field.options.choices.map((item) => (
        <TouchableOpacity
          key={`${item.id}`}
          onPress={() => {
            setActive(item.id);
            handleClick(item);
          }}
          style={[styles.radioOption, rtlView]}
        >
          <View style={styles.radioBorder}>
            {(active === item.id || selected === item.id) && (
              <View style={styles.selected} />
            )}
          </View>
          <Text
            style={[
              styles.radioOptionText,
              {
                marginLeft: rtl_support ? 15 : 5,
                marginRight: rtl_support ? 5 : 15,
              },
              rtlText,
            ]}
          >
            {decodeString(item.name)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
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
    marginTop: 5,
  },
  radioOptionText: {
    fontSize: 15,
    color: COLORS.text_dark,
  },
  selected: {
    height: 7,
    width: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
});

export default DynamicRadioButton;
