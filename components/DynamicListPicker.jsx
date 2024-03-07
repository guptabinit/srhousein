import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ScrollView,
} from "react-native";

// Vector Icons
import { FontAwesome5 } from "@expo/vector-icons";

// Custom Components
import { COLORS } from "../variables/color";
import { useStateValue } from "../StateProvider";
import { __ } from "../language/stringPicker";
import { decodeString } from "../helper/helper";

const DynamicListPicker = ({ onselect, selected, field, handleTouch }) => {
  const [{ appSettings, rtl_support }] = useStateValue();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerText, setPickerText] = useState(selected);
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
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.pickerFieldWrap, rtlView]}
        onPress={() => {
          handleTouch();
          setPickerVisible(!pickerVisible);
        }}
      >
        <Text style={[styles.priceTypePickerFieldText, rtlText]}>
          {pickerText
            ? pickerText
            : field.placeholder
            ? field.placeholder
            : `${__("dynamicListPickerTexts.selectText", appSettings.lng)} ${
                field.label
              }`}
        </Text>
        <FontAwesome5 name="chevron-down" size={14} color={COLORS.text_gray} />
      </TouchableOpacity>
      <Modal animationType="slide" transparent={true} visible={pickerVisible}>
        <TouchableWithoutFeedback onPress={() => setPickerVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text
              style={[styles.modalText, rtlText]}
            >{`== ${field.label} ==`}</Text>
            <ScrollView
              contentContainerStyle={{
                display: "flex",
                width: "100%",
                alignItems: "flex-start",
              }}
            >
              {field.options.choices.map((item) => (
                <TouchableOpacity
                  style={[styles.pickerOptions, rtlView]}
                  key={`${item.id}`}
                  onPress={() => {
                    onselect(item);
                    setPickerText(item.name);
                    setPickerVisible(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.pickerOptionsText, rtlTextA]}
                      numberOfLines={1}
                    >
                      {decodeString(item.name)}
                    </Text>
                  </View>
                  {pickerText &&
                    (pickerText === item.name || pickerText === item.id) && (
                      <FontAwesome5 name="check" size={14} color="black" />
                    )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  centeredModalview: {
    justifyContent: "center",
    alignItems: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  container: {},
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  modalText: {
    fontSize: 17,
    paddingBottom: 12,
  },
  modalView: {
    width: "94%",
    backgroundColor: "white",
    borderRadius: 3,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickerFieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: "#b6b6b6",
    height: 32,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  pickerOptions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  pickerOptionsText: {
    fontSize: 16,
    color: COLORS.text_dark,
    textTransform: "capitalize",
    flex: 1,
  },
});

export default DynamicListPicker;
