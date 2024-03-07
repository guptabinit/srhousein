import React, { useState } from "react";
import { View, StyleSheet, Text, Modal, TouchableOpacity } from "react-native";

// External Libraries
import DateTimePicker from "@react-native-community/datetimepicker";

// Custom Components & Constants
import AppButton from "./AppButton";
import { useStateValue } from "../StateProvider";
import { COLORS } from "../variables/color";
import { __ } from "../language/stringPicker";
import moment from "moment";

const DatePicker = ({ field, onSelect, value }) => {
  const [{ appSettings, ios, rtl_support }] = useStateValue();
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState("date");
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
      onSelect(currentDate, field);
    } else {
      if (event.type === "set") {
        setShow(false);
        setDate(currentDate);
        onSelect(currentDate, field);
      } else {
        setShow(false);
      }
    }
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode("date");
  };

  const showTimepicker = () => {
    showMode("time");
  };

  return ios ? (
    <View style={styles.view}>
      <View style={[styles.dateTimeWrap, rtlView]}>
        <AppButton
          onPress={showDatepicker}
          title={
            value
              ? field.date.type === "date"
                ? moment(value).format(field.date.jsFormat)
                : value.split(" ")[0]
              : __("datePickerTexts.selectDate", appSettings.lng)
          }
          style={styles.button}
        />
        {field.date.type === "date_time" && (
          <AppButton
            onPress={showTimepicker}
            title={
              value
                ? value.split(" ")[1]
                : __("datePickerTexts.selectTime", appSettings.lng)
            }
            style={styles.button}
          />
        )}
      </View>
      <Modal animationType="slide" transparent={true} visible={show}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            paddingHorizontal: "15%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: COLORS.bg_dark,
              justifyContent: "space-between",
              paddingHorizontal: "5%",
              height: "20%",
              borderRadius: 10,
              shadowColor: "#000",
              shadowOffset: {
                height: 0,
                width: 0,
              },
              shadowOpacity: 0.3,
              shadowRadius: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode={mode}
                display="default"
                onChange={onChange}
                is24Hour={true}
              />
            </View>
            <TouchableOpacity
              style={{
                paddingHorizontal: 20,

                paddingVertical: 8,
                backgroundColor: COLORS.primary,
                borderRadius: 5,
              }}
              onPress={() => setShow(false)}
            >
              <Text
                style={[{ color: COLORS.white, fontWeight: "bold" }, rtlText]}
                onPress={() => setShow(false)}
              >
                {__("datePickerTexts.okButtonTitle", appSettings.lng)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  ) : (
    <View style={styles.mainWrap}>
      <View style={[styles.dateTimeWrap, rtlView]}>
        <AppButton
          onPress={showDatepicker}
          title={
            value
              ? field.date.type === "date"
                ? moment(value).format(field.date.jsFormat)
                : value.split(" ")[0]
              : __("datePickerTexts.selectDate", appSettings.lng)
          }
          style={styles.button}
        />
        {field.date.type === "date_time" && (
          <AppButton
            onPress={showTimepicker}
            title={
              value
                ? value.split(" ")[1]
                : __("datePickerTexts.selectTime", appSettings.lng)
            }
            style={styles.button}
          />
        )}
      </View>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={mode}
          display="default"
          onChange={onChange}
          is24Hour={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "auto",
  },
  container: {},
  dateTimeWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    width: "100%",
  },
  mainWrap: {
    width: "100%",
  },
});

export default DatePicker;
