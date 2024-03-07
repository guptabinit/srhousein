import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("screen");
const FlashNotification = ({ falshShow, flashMessage, containerStyle }) => {
  const [modalVisible, setModatVisible] = useState(falshShow);
  useEffect(() => {
    setModatVisible(falshShow);
  }, [falshShow]);
  return (
    <Modal
      animationType="fade"
      visible={modalVisible}
      statusBarTranslucent={false}
      transparent={true}
    >
      <TouchableWithoutFeedback onPress={() => setModatVisible(false)}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      <View style={[styles.container, containerStyle]}>
        <View style={styles.content}>
          <Text style={styles.flashNotificationText}>{flashMessage}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: "80%",
    right: 0,
    bottom: "10%",
    left: 0,
  },
  content: {
    backgroundColor: "gray",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: screenWidth / 2,
  },
  flashNotificationText: {
    fontSize: screenHeight * 0.018,
    color: "white",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 1,
  },
});

export default FlashNotification;
