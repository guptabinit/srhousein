import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Modal,
  Linking,
  Platform,
} from "react-native";
import api, {
  removeAuthToken,
  removeMultipartHeader,
  setAuthToken,
  setMultipartHeader,
} from "../api/client";
import { useStateValue } from "../StateProvider";
import { COLORS } from "../variables/color";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome } from "@expo/vector-icons";
import AppTextButton from "../components/AppTextButton";
import FlashNotification from "../components/FlashNotification";
import { __ } from "../language/stringPicker";
import CameraButtonIcon from "../components/svgComponents/CameraButtonIcon";
import GalleryButtonIcon from "../components/svgComponents/GalleryButtonIcon";
import * as DocumentPicker from "expo-document-picker";

const MyDocumentsScreen = (props) => {
  const [{ user, appSettings, rtl_support, auth_token, config }] =
    useStateValue();
  const [loading, setLoading] = useState(true);
  const [idData, setIdData] = useState(null);
  const [otherData, setOtherData] = useState(null);
  const [idLoading, setIdLoading] = useState(false);
  const [otherLoading, setOtherLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState("");
  const [flashNotification, setFlashNotification] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    getMyDocs();
  }, []);
  const getMyDocs = () => {
    setAuthToken(auth_token);
    api
      .get("my/documents")
      .then((res) => {
        if (isFocused) {
          if (res.ok) {
            setIdData(res.data.photo_id);
            setOtherData(res.data.other_document);
          }
        }
      })
      .catch((error) => {
        //TODO handle Error
      })
      .finally(() => {
        removeAuthToken();
        setLoading(false);
      });
  };

  const requestGalleryParmission = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert(
          __(
            "editPersonalDetailScreenTexts.cameraRollPermissionAlert",
            appSettings.lng
          )
        );
      } else handleSelectGalleryImage();
    }
  };
  const requestCameraParmission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert(
          __(
            "editPersonalDetailScreenTexts.cameraPermissionAlert",
            appSettings.lng
          )
        );
      } else handleSelectCameraImage();
    }
  };

  const handleSelectGalleryImage = async () => {
    // if (Platform.OS === "android") {
    //   setModalVisible((prevModalVisible) => false);
    // }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    // if (
    //   ios && !result.canceled) {
    //   }
    if (!result.canceled) {
      setPickerVisible(false);
      setIdLoading(true);
      setAuthToken(auth_token);
      setMultipartHeader();
      let localUri = result.assets[0].uri;
      let filename = localUri.split("/").pop();
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;
      const image = {
        uri: localUri,
        name: filename,
        type,
      };
      // Upload the image using the fetch and FormData APIs
      let formData = new FormData();
      // Assume "photo" is the name of the form field the server expects
      formData.append("image", image);
      updateImage(formData, "photo_id");
    }
  };

  const handleSelectCameraImage = async () => {
    // if (Platform.OS === "android") {
    //   setModalVisible((prevModalVisible) => false);
    // }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    // if (ios && !result.canceled) {
    // }

    if (!result.canceled) {
      setPickerVisible(false);
      setIdLoading(true);
      setAuthToken(auth_token);
      setMultipartHeader();
      let localUri = result.assets[0].uri;
      let filename = localUri.split("/").pop();
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;
      const image = {
        uri: localUri,
        name: filename,
        type,
      };
      // Upload the image using the fetch and FormData APIs
      let formData = new FormData();
      // Assume "photo" is the name of the form field the server expects
      formData.append("image", image);
      updateImage(formData, "photo_id");
    }
  };

  const handleDocuploadBtn = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: false,
      type: "application/pdf",
    });
    if (result?.type === "success" && result?.uri && result?.size > 5242880) {
      handleError(
        __("myDocScreenTexts.errorMsg.otherDoc.maxSize", appSettings.lng)
      );
      return;
    }
    if (
      result?.type === "success" &&
      result?.uri &&
      result?.mimeType !== "application/pdf"
    ) {
      handleError(
        __("myDocScreenTexts.errorMsg.otherDoc.types", appSettings.lng)
      );
      return;
    }
    if (result?.type === "success" && result?.uri) {
      handleDocUploadAction(result);
    }
  };

  const handleDocUploadAction = (item) => {
    setOtherLoading(true);
    setAuthToken(auth_token);
    setMultipartHeader();
    const doc = {
      uri: item.uri,
      name: item.name,
      type: item.mimeType,
    };
    // Upload the image using the fetch and FormData APIs
    let formData = new FormData();
    // Assume "photo" is the name of the form field the server expects
    formData.append("other", doc);
    updateImage(formData, "other");
  };

  const handleDownloadPress = () => {
    Linking.openURL(otherData);
  };

  const updateImage = (formData, type) => {
    api
      .post(
        `my/documents/${type === "photo_id" ? "photo_id" : "other"}`,
        formData
      )
      .then((res) => {
        if (isFocused && res?.ok) {
          type === "photo_id" ? setIdData(res.data) : setOtherData(res.data);
          handleSuccess("Success");
        }
      })
      .catch((error) => {
        if (isFocused) {
          handleError(
            res?.data?.error_message || res?.data?.error || res?.problem
          );
        }
      })
      .finally(() => {
        removeAuthToken();
        removeMultipartHeader();
        type === "photo_id" ? setIdLoading(false) : setOtherLoading(false);
      });
  };

  const handleSuccess = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setFlashNotificationMessage();
    }, 1000);
  };
  const handleError = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setFlashNotificationMessage();
    }, 1200);
  };
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
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.idSection}>
            <View style={[styles.titleWrap, rtlView]}>
              <Text style={[styles.title, rtlText]}>
                {__("myDocScreenTexts.titles.photoId", appSettings.lng)}
              </Text>
            </View>
            <View style={styles.idContentWrap}>
              {!user?.seller_verified && (
                <TouchableOpacity
                  onPress={() => setPickerVisible(true)}
                  style={styles.addPhotoButton}
                  disabled={loading || idLoading || otherLoading}
                >
                  <FontAwesome color={COLORS.primary} size={17} name="plus" />
                </TouchableOpacity>
              )}
              <View style={styles.idImageWrap}>
                {idLoading ? (
                  <View style={styles.loadingWrap}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  </View>
                ) : (
                  <Image
                    source={
                      idData
                        ? { uri: `${idData}` }
                        : require("../assets/photo_id.png")
                    }
                    style={styles.idImage}
                  />
                )}
              </View>
            </View>
            {(!!config?.image_size || !!config?.image_type?.length) && (
              <View style={styles.noteWrap}>
                <Text style={[styles.note, rtlTextA]}>
                  {__(
                    "myDocScreenTexts.notes.photoId.maxSize",
                    appSettings.lng
                  )}
                  {` : ${config.image_size}`}
                </Text>
                <Text style={[styles.note, rtlTextA]}>
                  {__("myDocScreenTexts.notes.photoId.types", appSettings.lng)}
                  {` : (${config.image_type.map((type) => type).join(", ")})`}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.otherDocSection}>
            <View style={[styles.titleWrap, rtlView]}>
              <Text style={[styles.title, rtlText]}>
                {__("myDocScreenTexts.titles.otherDoc", appSettings.lng)}
              </Text>
            </View>
            <View style={styles.docContent}>
              {otherLoading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size={"small"} color={COLORS.primary} />
                </View>
              ) : (
                <>
                  {otherData ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-evenly",
                        width: "100%",
                      }}
                    >
                      <TouchableWithoutFeedback
                        disabled={otherLoading}
                        onPress={handleDownloadPress}
                      >
                        <View style={[styles.docUploadBtnWrap, rtlView]}>
                          <View style={styles.upLoadIconWrap}>
                            <FontAwesome
                              color={COLORS.primary}
                              size={18}
                              name="download"
                            />
                          </View>
                          <View style={styles.upLoadBtnTxtWrap}>
                            <Text
                              style={[
                                styles.uploadBtnTxt,
                                rtlText,
                                { color: COLORS.dodgerblue },
                              ]}
                            >
                              {__(
                                "myDocScreenTexts.buttons.download",
                                appSettings.lng
                              )}
                            </Text>
                          </View>
                        </View>
                      </TouchableWithoutFeedback>
                      {!user?.seller_verified && (
                        <TouchableWithoutFeedback
                          onPress={handleDocuploadBtn}
                          disabled={loading || idLoading || otherLoading}
                        >
                          <View style={[styles.docUploadBtnWrap, rtlView]}>
                            <View style={styles.upLoadIconWrap}>
                              <FontAwesome
                                color={COLORS.primary}
                                size={18}
                                name="upload"
                              />
                            </View>
                            <View style={styles.upLoadBtnTxtWrap}>
                              <Text style={[styles.uploadBtnTxt, rtlText]}>
                                {__(
                                  "myDocScreenTexts.buttons.change",
                                  appSettings.lng
                                )}
                              </Text>
                            </View>
                          </View>
                        </TouchableWithoutFeedback>
                      )}
                    </View>
                  ) : (
                    <TouchableWithoutFeedback
                      disabled={loading || idLoading || otherLoading}
                      onPress={handleDocuploadBtn}
                    >
                      <View style={[styles.docUploadBtnWrap, rtlView]}>
                        <View style={styles.upLoadIconWrap}>
                          <FontAwesome
                            color={COLORS.primary}
                            size={18}
                            name="upload"
                          />
                        </View>
                        <View style={styles.upLoadBtnTxtWrap}>
                          <Text style={[styles.uploadBtnTxt, rtlText]}>
                            {__(
                              "myDocScreenTexts.buttons.upload",
                              appSettings.lng
                            )}
                          </Text>
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  )}
                </>
              )}
            </View>
            <View style={styles.noteWrap}>
              <Text style={[styles.note, rtlTextA]}>
                {__("myDocScreenTexts.notes.otherDoc.maxSize", appSettings.lng)}
              </Text>
              <Text style={[styles.note, rtlTextA]}>
                {__("myDocScreenTexts.notes.otherDoc.types", appSettings.lng)}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pickerVisible}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback
          onPress={() =>
            setPickerVisible((prevPickerVisible) => !prevPickerVisible)
          }
        >
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalTitleWrap}>
              <Text style={styles.modalTitle}>
                {__(
                  "editPersonalDetailScreenTexts.addPhotoTitle",
                  appSettings.lng
                )}
              </Text>
            </View>
            <View style={styles.contentWrap}>
              <TouchableOpacity
                style={styles.libraryWrap}
                onPress={() => requestCameraParmission()}
              >
                <CameraButtonIcon
                  fillColor={COLORS.bg_primary}
                  strokeColor={COLORS.primary}
                  iconColor={COLORS.primary}
                />
                <Text style={styles.libraryText}>
                  {__(
                    "editPersonalDetailScreenTexts.takePhotoButtonTitle",
                    appSettings.lng
                  )}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.libraryWrap}
                onPress={() => requestGalleryParmission()}
              >
                <GalleryButtonIcon
                  fillColor="#EBF9FF"
                  strokeColor="#2267ED"
                  iconColor="#2267ED"
                />
                <Text style={styles.libraryText}>
                  {__(
                    "editPersonalDetailScreenTexts.fromGalleryButtonTitle",
                    appSettings.lng
                  )}
                </Text>
              </TouchableOpacity>
            </View>
            <AppTextButton
              style={styles.cancelButton}
              title={__("imageInputTexts.cancelButtonTitle", appSettings.lng)}
              onPress={() => {
                setPickerVisible((prevPickerVisible) => !prevPickerVisible);
              }}
              textStyle={{ color: COLORS.text_dark, fontWeight: "bold" }}
            />
          </View>
        </View>
      </Modal>

      <FlashNotification
        falshShow={flashNotification}
        flashMessage={flashNotificationMessage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cancelButton: {
    marginTop: 10,
    backgroundColor: "#e5e5e5",
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 6,
  },
  libraryText: {
    fontSize: 14.5,
    color: COLORS.text_gray,
    marginVertical: 10,
  },
  libraryWrap: {
    alignItems: "center",
    marginHorizontal: 15,
  },
  contentWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    marginHorizontal: "3%",
  },
  idImageWrap: {
    height: 150,
    width: 250,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  idImage: {
    height: 150,
    width: 250,
    resizeMode: "cover",
  },
  scrollContainer: {
    paddingTop: 15,
  },
  titleWrap: {
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  idContentWrap: {
    width: "100%",
    alignItems: "center",
    height: 230,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border_light,
    marginBottom: 10,
  },
  addPhotoButton: {
    height: 26,
    width: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderRadius: 13,
    position: "absolute",
    top: "6%",
    right: "5%",
  },
  noteWrap: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: COLORS.bg_primary,
    borderRadius: 3,
    marginBottom: 10,
  },
  note: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text_gray,
  },
  otherDocSection: {
    marginTop: 20,
  },
  docContent: {
    height: 70,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border_light,
    borderRadius: 3,
  },
  docUploadBtnWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  upLoadIconWrap: {
    paddingHorizontal: 5,
  },
  uploadBtnTxt: {
    fontSize: 15,
    color: COLORS.text_gray,
  },
  loadingWrap: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text_dark,
    marginBottom: 15,
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 25,
    alignItems: "center",
  },
});

export default MyDocumentsScreen;
