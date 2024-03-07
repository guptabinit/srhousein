import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ScrollView,
} from "react-native";

// Vector Fonts
import { FontAwesome5 } from "@expo/vector-icons";

// Custom Components & Constants
import { COLORS } from "../variables/color";
import { decodeString } from "../helper/helper";

const ListPicker = ({
  pickerVisible,
  pickerLabel,
  data,
  onClick,
  overlayClick,
  selected,
  pickerType,
  centeredContent,
}) => {
  return (
    <Modal animationType="slide" transparent={true} visible={pickerVisible}>
      <TouchableWithoutFeedback onPress={overlayClick}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {!!pickerLabel && <Text style={styles.modalText}>{pickerLabel}</Text>}
          <ScrollView
            contentContainerStyle={{
              display: "flex",
              width: "100%",
              alignItems: "flex-start",
              paddingTop: centeredContent ? 10 : 0,
            }}
          >
            {data.map((item) => (
              <TouchableOpacity
                style={styles.pickerOptions}
                key={`${item.id}`}
                onPress={() => onClick(item)}
              >
                {pickerType === "currency" ? (
                  <Text style={styles.pickerOptionsText}>
                    {decodeString(item.name) +
                      " (" +
                      decodeString(item.symbol) +
                      ")"}
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.pickerOptionsText,
                      centeredContent && { textAlign: "center" },
                    ]}
                  >
                    {decodeString(item.name)}
                  </Text>
                )}
                {selected && selected.id === item.id && (
                  <FontAwesome5 name="check" size={14} color="black" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
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

export default ListPicker;
