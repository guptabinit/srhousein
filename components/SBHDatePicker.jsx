import React, { useState } from "react";
import { View, StyleSheet, Text, Modal, TouchableOpacity } from "react-native";

// External Libraries
import DateTimePicker from "@react-native-community/datetimepicker";

// Custom Components & Constants
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";

const SBHDatePicker = ({ day, onSelectDate, value }) => {
  const [{ ios, appSettings, rtl_support }] = useStateValue();
  const [date, setDate] = useState(new Date());

  const [show, setShow] = useState(false);
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

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    if (ios) {
      setDate(currentDate);
    } else {
      if (event.type === "set") {
        setShow(ios);
        setDate(currentDate);
        onSelectDate(day, currentDate);
      } else {
        setShow(ios);
      }
    }
  };

  const showDatepicker = () => {
    setShow(true);
  };
  return ios ? (
    <View style={styles.container}>
      <Text style={[styles.text, rtlTextA]} onPress={showDatepicker}>
        {value}
      </Text>

      <Modal animationType="slide" transparent={true} visible={show}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <View
            style={{
              width: "50%",
              alignItems: "center",
              backgroundColor: COLORS.bg_light,
              paddingVertical: 30,
            }}
          >
            <View
              style={{
                width: "50%",
              }}
            >
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="date"
                display={ios ? "compact" : "default"}
                onChange={onChange}
              />
            </View>
            <TouchableOpacity
              style={{
                paddingHorizontal: 20,
                marginTop: 20,
                paddingVertical: 5,
                backgroundColor: COLORS.primary,
                borderRadius: 10,
              }}
              onPress={() => {
                setShow(false);
                onSelectDate(day, date);
              }}
            >
              <Text style={{ color: COLORS.white }}>
                {__("OHTimePickerTexts.okButtonTitle", appSettings.lng)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  ) : (
    <View style={styles.container}>
      <Text style={styles.text} onPress={showDatepicker}>
        {value}
      </Text>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          display={ios ? "compact" : "default"}
          onChange={onChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default SBHDatePicker;
