import React, { useState } from "react";
import { View, StyleSheet, Text, Modal, TouchableOpacity } from "react-native";

// External Libraries
import DateTimePicker from "@react-native-community/datetimepicker";

// Custom Components & Constants
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";

const OHTimePicker = ({ day, type, onSelectTime, value, is12Hour }) => {
  const [{ ios, appSettings }] = useStateValue();
  const [time, setTime] = useState(new Date());

  const [show, setShow] = useState(false);

  const onChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    if (ios) {
      setTime(currentTime);
      onSelectTime(day, type, currentTime);
    } else {
      if (event.type === "set") {
        setShow(ios);
        setTime(currentTime);
        onSelectTime(day, type, currentTime);
      } else {
        setShow(ios);
      }
    }
  };

  const showTimepicker = () => {
    setShow(true);
  };
  return ios ? (
    <View style={styles.container}>
      <Text style={styles.text} onPress={showTimepicker}>
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
                alignItems: "stretch",
              }}
            >
              <DateTimePicker
                testID="dateTimePicker"
                value={time}
                mode="time"
                display={ios ? "compact" : "default"}
                onChange={onChange}
                is24Hour={!is12Hour}
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
              onPress={() => setShow(false)}
            >
              <Text
                style={{ color: COLORS.white }}
                onPress={() => setShow(false)}
              >
                {__("OHTimePickerTexts.okButtonTitle", appSettings.lng)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  ) : (
    <View style={styles.container}>
      <Text style={styles.text} onPress={showTimepicker}>
        {value}
      </Text>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={time}
          mode="time"
          display={ios ? "compact" : "default"}
          onChange={onChange}
          is24Hour={!is12Hour}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default OHTimePicker;
