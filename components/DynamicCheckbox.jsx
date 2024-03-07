import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

// Vector Icons
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Custom Components
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";

const DynamicCheckbox = ({ field, style, handleClick, selected }) => {
  const [{ rtl_support }] = useStateValue();
  const [checked, setChecked] = useState(selected ? selected : []);
  const [initial, setInitial] = useState(true);
  const handleCheck = (item) => {
    if (!checked.includes(item.id)) {
      setChecked((checked) => [...checked, item.id]);
    } else {
      setChecked((checked) => checked.filter((i) => i !== item.id));
    }
  };

  useEffect(() => {
    if (initial) return;
    handleClick(checked);
  }, [checked]);
  useEffect(() => {
    if (!initial) return;
    setInitial(false);
  }, []);

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
    <View style={[styles.container, style]}>
      {field.options.choices.map((item) => (
        <TouchableOpacity
          key={`${item.id}`}
          onPress={() => {
            handleCheck(item);
          }}
          style={[styles.radioOption, rtlView]}
        >
          <MaterialCommunityIcons
            name={
              !checked.includes(item.id)
                ? "checkbox-blank-outline"
                : "checkbox-marked"
            }
            size={20}
            color={COLORS.primary}
          />
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
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
  },
  radioBorder: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "red",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOption: {
    flexDirection: "row",
    marginVertical: 5,
  },
  radioOptionText: {
    fontSize: 15,
    color: COLORS.text_dark,
  },
  selected: {
    height: 14,
    width: 14,
    borderRadius: 7,
    backgroundColor: "red",
  },
});

export default DynamicCheckbox;
