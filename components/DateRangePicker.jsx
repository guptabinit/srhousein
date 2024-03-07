import React, { useState } from "react";
import { View, StyleSheet, Text, Modal, TouchableOpacity } from "react-native";

// External Libraries
import DateTimePicker from "@react-native-community/datetimepicker";

// Custom Components & Constants
import AppButton from "./AppButton";
import AppSeparator from "./AppSeparator";
import { useStateValue } from "../StateProvider";
import { COLORS } from "../variables/color";
import { __ } from "../language/stringPicker";

const DatePicker = ({ value, onSelect, field }) => {
  const [{ appSettings, ios, rtl_support }] = useStateValue();
  const [date, setDate] = useState(new Date());
  const [dateEnd, setDateEnd] = useState(new Date());
  const [mode, setMode] = useState("date");
  const [modeEnd, setModeEnd] = useState("date");
  const [show, setShow] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

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
      onSelect("start", currentDate, field);
    } else {
      if (event.type === "set") {
        setShow(false);
        setDate(currentDate);
        onSelect("start", currentDate, field);
      } else {
        setShow(false);
      }
    }
  };

  const onChangeEnd = (event, selectedDate) => {
    const currentDate = selectedDate || dateEnd;
    if (ios) {
      setDateEnd(currentDate);
      onSelect("end", currentDate, field);
    } else {
      if (event.type === "set") {
        setShowEnd(false);
        setDateEnd(currentDate);
        onSelect("end", currentDate, field);
      } else {
        setShowEnd(false);
      }
    }
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };
  const showModeEnd = (currentMode) => {
    setShowEnd(true);
    setModeEnd(currentMode);
  };

  const showDatepicker = () => {
    showMode("date");
  };
  const showDatepickerEnd = () => {
    showModeEnd("date");
  };

  const showTimepicker = () => {
    showMode("time");
  };
  const showTimepickerEnd = () => {
    showModeEnd("time");
  };

  return ios ? (
    <View style={styles.view}>
      <View style={[styles.dateTimeWrap, rtlView]}>
        <AppButton
          style={styles.button}
          onPress={showDatepicker}
          title={
            value
              ? value[0].split(" ")[0]
              : __("dateRangePickerTexts.selectStartDate", appSettings.lng)
          }
        />
        <AppButton
          style={styles.button}
          onPress={showDatepickerEnd}
          title={
            value
              ? value[1].split(" ")[0]
              : __("dateRangePickerTexts.selectEndDate", appSettings.lng)
          }
        />
      </View>
      {field.date.type === "date_time_range" && (
        <>
          <AppSeparator style={styles.separator} />
          <View style={[styles.dateTimeWrap, rtlView]}>
            <AppButton
              style={styles.button}
              onPress={showTimepicker}
              title={
                value
                  ? value[0].split(" ")[1]
                  : __("dateRangePickerTexts.selectStartTime", appSettings.lng)
              }
            />
            <AppButton
              style={styles.button}
              onPress={showTimepickerEnd}
              title={
                value
                  ? value[1].split(" ")[1]
                  : __("dateRangePickerTexts.selectEndTime", appSettings.lng)
              }
            />
          </View>
        </>
      )}
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
                {__("dateRangePickerTexts.okButtonTitle", appSettings.lng)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal animationType="slide" transparent={true} visible={showEnd}>
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
                value={dateEnd}
                mode={modeEnd}
                display="default"
                onChange={onChangeEnd}
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
              onPress={() => setShowEnd(false)}
            >
              <Text
                style={[{ color: COLORS.white, fontWeight: "bold" }, rtlText]}
                onPress={() => setShowEnd(false)}
              >
                {__("dateRangePickerTexts.okButtonTitle", appSettings.lng)}
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
          style={styles.button}
          onPress={showDatepicker}
          title={
            value
              ? value[0].split(" ")[0]
              : __("dateRangePickerTexts.selectStartDate", appSettings.lng)
          }
        />
        <AppButton
          style={styles.button}
          onPress={showDatepickerEnd}
          title={
            value
              ? value[1].split(" ")[0]
              : __("dateRangePickerTexts.selectEndDate", appSettings.lng)
          }
        />
      </View>
      {field.date.type === "date_time_range" && (
        <>
          <AppSeparator style={styles.separator} />
          <View style={[styles.dateTimeWrap, rtlView]}>
            <AppButton
              style={styles.button}
              onPress={showTimepicker}
              title={
                value
                  ? value[0].split(" ")[1]
                  : __("dateRangePickerTexts.selectStartTime", appSettings.lng)
              }
            />
            <AppButton
              style={styles.button}
              onPress={showTimepickerEnd}
              title={
                value
                  ? value[1].split(" ")[1]
                  : __("dateRangePickerTexts.selectEndTime", appSettings.lng)
              }
            />
          </View>
        </>
      )}
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
      {showEnd && (
        <DateTimePicker
          testID="dateTimePicker"
          value={dateEnd}
          mode={modeEnd}
          display="default"
          onChange={onChangeEnd}
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
  separator: {
    width: "100%",
    marginVertical: 10,
  },
});

export default DatePicker;
