import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Modal,
  Platform,
} from "react-native";

// {* Expo Libraries *}
import * as ImagePicker from "expo-image-picker";

// {* External Libraries *}
import { Formik } from "formik";
import * as Yup from "yup";
import moment from "moment";

// {* Vector Icons *}
import { Fontisto } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// {* Custom Components and Variables *}
import { useStateValue } from "../StateProvider";
import api, {
  setAuthToken,
  setMultipartHeader,
  removeAuthToken,
  removeMultipartHeader,
} from "../api/client";
import AppButton from "../components/AppButton";
import AppTextButton from "../components/AppTextButton";
import { COLORS } from "../variables/color";
import OHTimePicker from "../components/OHTimePicker";
import FlashNotification from "../components/FlashNotification";
import { getWeek, __ } from "../language/stringPicker";

const myStoreIcons = {
  bannerTitleIcon: require("../assets/gallery_icon.png"),
  logoTitleIcon: require("../assets/store_icon.png"),
  schedualTitleIcon: require("../assets/store_icon.png"),
  infoTitleIcon: require("../assets/store_icon.png"),
};

const myStoreFallBackImageURL = {
  banner: require("../assets/200X150.png"),
  logo: require("../assets/100x100.png"),
};

const week = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const defaultOpeningHours = {
  sunday: {
    active: 1,
    open: "8:00:00 AM",
    close: "10:00:00 PM",
  },
  monday: {
    active: 1,
    open: "8:00:00 AM",
    close: "10:00:00 PM",
  },
  tuesday: {
    active: 1,
    open: "8:00:00 AM",
    close: "10:00:00 PM",
  },
  wednesday: {
    active: 1,
    open: "8:00:00 AM",
    close: "10:00:00 PM",
  },
  thursday: {
    active: 1,
    open: "8:00:00 AM",
    close: "10:00:00 PM",
  },
  friday: {
    active: 1,
    open: "8:00:00 AM",
    close: "10:00:00 PM",
  },
  saturday: {
    active: 1,
    open: "8:00:00 AM",
    close: "10:00:00 PM",
  },
};

const { height: windowHeight } = Dimensions.get("window");

const MyStoreScreen = (props) => {
  const [{ auth_token, config, ios, appSettings, rtl_support }] =
    useStateValue();
  const [validationSchema, setValidationSchema] = useState(
    Yup.object().shape({
      title: Yup.string()
        .required(
          __("myStoreTexts.errorFieldNames.title", appSettings.lng) +
            " " +
            __("myStoreTexts.formValidation.requiredField", appSettings.lng)
        )
        .min(
          3,
          __("myStoreTexts.errorFieldNames.title", appSettings.lng) +
            " " +
            __("myStoreTexts.formValidation.minimumLength3", appSettings.lng)
        ),
      slug: Yup.string()
        .required(
          __("myStoreTexts.errorFieldNames.slug", appSettings.lng) +
            " " +
            __("myStoreTexts.formValidation.requiredField", appSettings.lng)
        )
        .min(
          3,
          __("myStoreTexts.errorFieldNames.slug", appSettings.lng) +
            " " +
            __("myStoreTexts.formValidation.minimumLength3", appSettings.lng)
        ),
      slogan: Yup.string().label(
        __("myStoreTexts.errorFieldNames.slogan", appSettings.lng)
      ),
      email: Yup.string()
        .required(
          __("myStoreTexts.errorFieldNames.email", appSettings.lng) +
            " " +
            __("myStoreTexts.formValidation.requiredField", appSettings.lng)
        )
        .email(__("myStoreTexts.formValidation.validEmail", appSettings.lng)),
      phone: Yup.string().min(
        5,
        __("myStoreTexts.errorFieldNames.phone", appSettings.lng) +
          " " +
          __("myStoreTexts.formValidation.minimumLength5", appSettings.lng)
      ),
      address: Yup.string().label(
        __("myStoreTexts.errorFieldNames.address", appSettings.lng)
      ),
      website: Yup.string().url(
        __("myStoreTexts.formValidation.validUrl", appSettings.lng)
      ),
      facebook: Yup.string().url(
        __("myStoreTexts.formValidation.validUrl", appSettings.lng)
      ),
      youtube: Yup.string().url(
        __("myStoreTexts.formValidation.validUrl", appSettings.lng)
      ),
      twitter: Yup.string().url(
        __("myStoreTexts.formValidation.validUrl", appSettings.lng)
      ),
      linkedin: Yup.string().url(
        __("myStoreTexts.formValidation.validUrl", appSettings.lng)
      ),
      description: Yup.string().label(
        __("myStoreTexts.errorFieldNames.description", appSettings.lng)
      ),
    })
  );
  const [loading, setLoading] = useState(true);
  const [logoLoading, setLogoLoading] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [storeUpdateLoading, setStoreUpdateLoading] = useState(false);
  const [storeData, setStoreData] = useState();
  const [storeLogo, setStoreLogo] = useState();
  const [storeBanner, setStoreBanner] = useState();
  const [storeOpeningHoursType, setStoreOpeningHoursType] = useState("always");
  const [storeOpeningHours, setStoreOpeningHours] = useState({});
  const [logoPickerVisible, setLogoPickerVisible] = useState(false);
  const [bannerPickerVisible, setBannerPickerVisible] = useState(false);
  const [storeOHTouched, setStoreOHTouched] = useState(false);
  const [flashNotification, setFlashNotification] = useState(false);
  const [flashNotificationMessage, setFlashNotificationMessage] = useState();
  const [userHasNoStore, setUserHasNoStore] = useState(false);
  const [weekDays, setWeekDays] = useState(getWeek(appSettings.lng) || {});

  // {* Initial Get Store Information Call *}
  useEffect(() => {
    getStore();
  }, []);

  const getStore = () => {
    setAuthToken(auth_token);
    api.get("my/store").then((res) => {
      if (res.ok) {
        if (res.data) {
          setStoreData(res.data);
          if (res.data.banner) {
            setStoreBanner(res.data.banner);
          }
          if (res.data.logo) {
            setStoreLogo(res.data.logo);
          }
          setStoreOpeningHoursType(res.data?.opening_hours?.type || "always");
          setStoreOpeningHours(
            res.data?.opening_hours?.hours || defaultOpeningHours
          );
        }
        setLoading(false);
        removeAuthToken();
      } else {
        if (res.status === 400) {
          setUserHasNoStore(true);
        } else {
          handleError(
            res?.data?.error_message ||
              res?.problem + " Code: " + res?.status ||
              __("myStoreTexts.errorNotification", appSettings.lng)
          );
        }
        // TODO handle error

        setLoading(false);
        removeAuthToken();
      }
    });
  };

  const LogoPickerModal = () => (
    <Modal animationType="fade" transparent={true} visible={logoPickerVisible}>
      <TouchableWithoutFeedback
        onPress={() =>
          setLogoPickerVisible(
            (prevLogoPickerVisible) => !prevLogoPickerVisible
          )
        }
      >
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalTitleWrap}>
            <Text style={[styles.modalTitle, rtlText]}>
              {__("myStoreTexts.imagePickerTitle", appSettings.lng)}
            </Text>
          </View>
          <View style={styles.contentWrap}>
            <TouchableOpacity
              style={styles.libraryWrap}
              onPress={() => requestCameraParmission("logo")}
              disabled={logoLoading || bannerLoading}
            >
              <FontAwesome
                name="camera-retro"
                size={40}
                color={COLORS.primary}
              />
              <Text style={[styles.libraryText, rtlText]}>
                {__("myStoreTexts.imagePickerCameraText", appSettings.lng)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.libraryWrap}
              onPress={() => requestGalleryParmission("logo")}
              disabled={logoLoading || bannerLoading}
            >
              <Ionicons name="md-images" size={40} color={COLORS.primary} />
              <Text style={[styles.libraryText, rtlText]}>
                {__("myStoreTexts.imagePickerGalleryText", appSettings.lng)}
              </Text>
            </TouchableOpacity>
          </View>
          <AppTextButton
            style={styles.cancelButton}
            title={__("myStoreTexts.cancelButtonTitle", appSettings.lng)}
            onPress={() =>
              setLogoPickerVisible(
                (prevLogoPickerVisible) => !prevLogoPickerVisible
              )
            }
          />
        </View>
      </View>
    </Modal>
  );

  const BannerPickerModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={bannerPickerVisible}
    >
      <TouchableWithoutFeedback
        onPress={() =>
          setBannerPickerVisible(
            (prevBannerPickerVisible) => !prevBannerPickerVisible
          )
        }
      >
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalTitleWrap}>
            <Text style={[styles.modalTitle, rtlText]}>
              {__("myStoreTexts.imagePickerTitle", appSettings.lng)}
            </Text>
          </View>
          <View style={styles.contentWrap}>
            <TouchableOpacity
              style={styles.libraryWrap}
              onPress={() => requestCameraParmission("banner")}
              disabled={logoLoading || bannerLoading}
            >
              <FontAwesome
                name="camera-retro"
                size={40}
                color={COLORS.primary}
              />
              <Text style={[styles.libraryText, , rtlText]}>
                {__("myStoreTexts.imagePickerCameraText", appSettings.lng)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.libraryWrap}
              onPress={() => requestGalleryParmission("banner")}
              disabled={logoLoading || bannerLoading}
            >
              <Ionicons name="md-images" size={40} color={COLORS.primary} />
              <Text style={[styles.libraryText, , rtlText]}>
                {__("myStoreTexts.imagePickerGalleryText", appSettings.lng)}
              </Text>
            </TouchableOpacity>
          </View>
          <AppTextButton
            style={styles.cancelButton}
            title={__("myStoreTexts.cancelButtonTitle", appSettings.lng)}
            onPress={() =>
              setBannerPickerVisible(
                (prevBannerPickerVisible) => !prevBannerPickerVisible
              )
            }
          />
        </View>
      </View>
    </Modal>
  );

  const handleAlwaysPress = () => {
    if (storeOpeningHoursType === "selected") {
      setStoreOpeningHoursType("always");
    }
    if (!storeOHTouched) {
      setStoreOHTouched(true);
    }
    return;
  };

  const handleSelectedPress = () => {
    if (storeOpeningHoursType === "always") {
      setStoreOpeningHoursType("selected");
    }
    if (!storeOHTouched) {
      setStoreOHTouched(true);
    }
    return;
  };
  const requestGalleryParmission = async (arg) => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert(__("myStoreTexts.cameraRollPermissionAlert", appSettings.lng));
      } else handleSelectGalleryImage(arg);
    }
  };

  const handleSelectGalleryImage = async (arg) => {
    if (!ios) {
      if (logoPickerVisible) setLogoPickerVisible(false);
      if (bannerPickerVisible) setBannerPickerVisible(false);
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      if (ios) {
        if (logoPickerVisible) setLogoPickerVisible(false);
        if (bannerPickerVisible) setBannerPickerVisible(false);
      }
      if (arg === "logo") {
        setLogoLoading(true);
      }
      if (arg === "banner") {
        setBannerLoading(true);
      }

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
      formData.append(`${arg}`, image);

      updateImage(formData, arg);
    }
  };

  const requestCameraParmission = async (arg) => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert(__("myStoreTexts.cameraPermissionAlert", appSettings.lng));
      } else handleSelectCameraImage(arg);
    }
  };

  const handleSelectCameraImage = async (arg) => {
    if (!ios) {
      if (logoPickerVisible) setLogoPickerVisible(false);
      if (bannerPickerVisible) setBannerPickerVisible(false);
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      if (ios) {
        if (logoPickerVisible) setLogoPickerVisible(false);
        if (bannerPickerVisible) setBannerPickerVisible(false);
      }
      if (arg === "logo") {
        setLogoLoading(true);
      }
      if (arg === "banner") {
        setBannerLoading(true);
      }

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
      formData.append(`${arg}`, image);

      updateImage(formData, arg);
    }
  };
  const updateImage = (formData, arg) => {
    api.post(`my/store/${arg}`, formData).then((res) => {
      if (res.ok) {
        removeAuthToken();
        removeMultipartHeader();
        if (arg === "logo") {
          setStoreLogo(res.data);
          setLogoLoading((prevLogoLoading) => !prevLogoLoading);
          handleSuccess(
            __("myStoreTexts.successNotifications.logo", appSettings.lng)
          );
        }
        if (arg === "banner") {
          setStoreBanner(res.data);
          setBannerLoading((prevBannerLoading) => !prevBannerLoading);
          handleSuccess(
            __("myStoreTexts.successNotifications.banner", appSettings.lng)
          );
        }
      } else {
        removeAuthToken();
        removeMultipartHeader();
        if (logoLoading) {
          setLogoLoading(false);
        }
        if (bannerLoading) {
          setBannerLoading(false);
        }
        handleError(
          res?.data?.error_message ||
            res?.data?.error ||
            res?.problem ||
            __("myStoreTexts.errorNotification", appSettings.lng)
        );
      }
    });
  };

  const handleDaySelection = (arg) => {
    let tempDay = { ...storeOpeningHours[arg] };

    if (!!tempDay.active) {
      delete tempDay["active"];
    } else {
      tempDay = { ...tempDay, ["active"]: 1 };
    }
    setStoreOpeningHours({ ...storeOpeningHours, [arg]: tempDay });
    if (!storeOHTouched) {
      setStoreOHTouched(true);
    }
  };

  const handlePickerPress = (day, type, payload) => {
    const format =
      config?.store?.time_options?.showMeridian !== false ? "h:mm A" : "H:mm";
    const dayObject = {
      ...storeOpeningHours[day],
      [type]: moment(payload).format(format),
    };
    const weekObject = { ...storeOpeningHours, [day]: dayObject };
    setStoreOpeningHours(weekObject);
    if (!storeOHTouched) {
      setStoreOHTouched(true);
    }
  };

  const handleUpdate = (values) => {
    setStoreUpdateLoading(true);

    let storeInfo = {
      title: values.title,
      slug: values.slug,
      email: values.email,
      phone: values.phone,
      address: values.address,
      website: values.website,
      description: values.description,
      slogan: values.slogan,
      oh_type: storeOpeningHoursType,
      oh_hours: storeOpeningHours,
      social_media: {
        facebook: values.facebook,
        youtube: values.youtube,
        linkedin: values.linkedin,
        twitter: values.twitter,
      },
    };

    setAuthToken(auth_token);
    api.post("my/store", storeInfo).then((res) => {
      if (res.ok) {
        setStoreUpdateLoading(false);
        handleSuccess(
          __("myStoreTexts.successNotifications.storeInfo", appSettings.lng)
        );
      } else {
        setStoreUpdateLoading(false);
        handleError(
          res?.data?.error_message ||
            res?.data?.error ||
            res?.problem ||
            __("myStoreTexts.errorNotification", appSettings.lng)
        );
      }
    });

    removeAuthToken();
  };

  const handleSuccess = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setFlashNotificationMessage();
      // navigation.goBack();
    }, 700);
  };

  const handleError = (message) => {
    setFlashNotificationMessage(message);
    setTimeout(() => {
      setFlashNotification(true);
    }, 10);
    setTimeout(() => {
      setFlashNotification(false);
      setFlashNotificationMessage();
    }, 1000);
  };

  const rtlTextA = rtl_support && {
    writingDirection: "rtl",
    textAlign: "right",
  };
  const rtlText = rtl_support && {
    writingDirection: "rtl",
  };
  const rtlView = rtl_support && {
    flexDirection: "row-reverse",
  };

  return loading ? (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  ) : (
    <>
      {userHasNoStore ? (
        <View style={styles.noStore}>
          <Text style={[styles.noStoreText, rtlText]}>
            {__("myStoreTexts.userHasNoStore", appSettings.lng)}
          </Text>
          <Text style={[styles.createStoreMessage, rtlText]}>
            {__("myStoreTexts.storeCreateMessage", appSettings.lng)}
          </Text>
          <AppButton
            title={__("myStoreTexts.createStoreButtonTitle", appSettings.lng)}
            style={styles.createStoreButton}
            onPress={() => setUserHasNoStore(false)}
            textStyle={{ writingDirection: rtl_support ? "rtl" : "ltr" }}
          />
        </View>
      ) : (
        <>
          <KeyboardAvoidingView
            behavior={ios ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={70}
          >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <View style={styles.storeSectionComponent}>
                <View style={[styles.storeSectionTitleWrap, rtlView]}>
                  <View style={styles.storeSectionTitleIconWrap}>
                    <Image
                      source={myStoreIcons.bannerTitleIcon}
                      style={styles.storeSectionTitleIcon}
                    />
                  </View>
                  <View
                    style={[
                      styles.storeSectionTitleTextWrap,
                      { alignItems: rtl_support ? "flex-end" : "flex-start" },
                    ]}
                  >
                    <Text style={[styles.storeSectionTitleText, rtlText]}>
                      {__("myStoreTexts.banner", appSettings.lng)}
                    </Text>
                  </View>
                </View>
                <View style={styles.storeSectionContentWrap}>
                  <View style={styles.bannerWrap}>
                    {bannerLoading ? (
                      <View style={styles.loading}>
                        <ActivityIndicator
                          size="large"
                          color={COLORS.primary}
                        />
                      </View>
                    ) : (
                      <Image
                        source={
                          storeBanner
                            ? { uri: storeBanner }
                            : myStoreFallBackImageURL.banner
                        }
                        style={styles.bannerImage}
                      />
                    )}
                  </View>
                  <View
                    style={[
                      rtl_support
                        ? styles.bannerButtonGroupWrapRtl
                        : styles.bannerButtonGroupWrap,
                      {
                        opacity: bannerLoading || bannerLoading ? 0.5 : 1,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.bannerButton}
                      onPress={() => setBannerPickerVisible(true)}
                      disabled={logoLoading || bannerLoading}
                    >
                      <FontAwesome name="plus" size={20} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View
                  style={[
                    styles.storeSectionBottomWrap,
                    { alignItems: rtl_support ? "flex-end" : "flex-start" },
                  ]}
                >
                  <Text style={[styles.storeSectionBottomText, rtlText]}>
                    <Text style={styles.star}>* </Text>
                    {__("myStoreTexts.recommendedSize", appSettings.lng)}
                    {storeData?.config?.banner?.width || "1230"}*
                    {storeData?.config?.banner?.height || "313"}) px.
                  </Text>

                  {!!config.image_size && (
                    <Text style={[styles.storeSectionBottomText, rtlText]}>
                      {__("myStoreTexts.maximum", appSettings.lng)}
                      {config.image_size}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.storeSectionComponent}>
                <View style={[styles.storeSectionTitleWrap, rtlView]}>
                  <View style={styles.storeSectionTitleIconWrap}>
                    <Image
                      source={myStoreIcons.logoTitleIcon}
                      style={styles.storeSectionTitleIcon}
                    />
                  </View>
                  <View
                    style={[
                      styles.storeSectionTitleTextWrap,
                      { alignItems: rtl_support ? "flex-end" : "flex-start" },
                    ]}
                  >
                    <Text style={[styles.storeSectionTitleText, rtlText]}>
                      {__("myStoreTexts.logo", appSettings.lng)}
                    </Text>
                  </View>
                </View>
                <View style={styles.storeSectionContentWrap}>
                  <View style={styles.logoWrap}>
                    {logoLoading ? (
                      <View style={styles.loading}>
                        <ActivityIndicator
                          size="large"
                          color={COLORS.primary}
                        />
                      </View>
                    ) : (
                      <Image
                        source={
                          storeLogo
                            ? { uri: storeLogo }
                            : myStoreFallBackImageURL.logo
                        }
                        style={styles.logoImage}
                      />
                    )}
                  </View>
                  <View
                    style={[
                      rtl_support
                        ? styles.logoButtonGroupWrapRtl
                        : styles.logoButtonGroupWrap,
                      {
                        opacity: logoLoading || bannerLoading ? 0.5 : 1,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.logoButton}
                      onPress={() => setLogoPickerVisible(true)}
                      disabled={logoLoading || bannerLoading}
                    >
                      <FontAwesome name="plus" size={16} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View
                  style={[
                    styles.storeSectionBottomWrap,
                    { alignItems: rtl_support ? "flex-end" : "flex-start" },
                  ]}
                >
                  <Text style={[styles.storeSectionBottomText, rtlText]}>
                    <Text style={styles.star}>* </Text>
                    {__("myStoreTexts.recommendedSize", appSettings.lng)}
                    {storeData?.config?.logo?.width || "180"}*
                    {storeData?.config?.logo?.height || "140"}) px.
                  </Text>

                  {!!config.image_size && (
                    <Text style={[styles.storeSectionBottomText, rtlText]}>
                      {__("myStoreTexts.maximum", appSettings.lng)}
                      {config.image_size}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.storeSectionComponent}>
                <View style={[styles.storeSectionTitleWrap, rtlView]}>
                  <View style={styles.storeSectionTitleIconWrap}>
                    <Image
                      source={myStoreIcons.schedualTitleIcon}
                      style={styles.storeSectionTitleIcon}
                    />
                  </View>
                  <View
                    style={[
                      styles.storeSectionTitleTextWrap,
                      { alignItems: rtl_support ? "flex-end" : "flex-start" },
                    ]}
                  >
                    <Text style={[styles.storeSectionTitleText, rtlText]}>
                      {__("myStoreTexts.schedule", appSettings.lng)}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    borderStyle: "dashed",
                    borderWidth: 1,
                    borderRadius: 1,
                  }}
                ></View>
                <View style={[styles.storeSectionTitleWrap, rtlView]}>
                  <View style={styles.storeSectionTitleIconWrap}>
                    <Fontisto name="clock" size={22} color={COLORS.primary} />
                  </View>
                  <View
                    style={[
                      styles.storeSectionTitleTextWrap,
                      { alignItems: rtl_support ? "flex-end" : "flex-start" },
                    ]}
                  >
                    <Text style={[styles.storeSectionTitleText, rtlText]}>
                      {__("myStoreTexts.hours", appSettings.lng)}
                    </Text>
                  </View>
                </View>

                <View style={styles.storeSectionContentWrap}>
                  <View style={[styles.radioButtonGroupWrap, rtlView]}>
                    <TouchableOpacity
                      style={[styles.radioButton, rtlView]}
                      onPress={handleAlwaysPress}
                    >
                      <View style={styles.radioOutLine}>
                        {storeOpeningHoursType === "always" && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <View
                        style={[
                          styles.radioButtonTextwrap,
                          { paddingHorizontal: 10 },
                        ]}
                      >
                        <Text style={[styles.radioButtonText, rtlText]}>
                          {__("myStoreTexts.alwaysOpen", appSettings.lng)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.radioButton, rtlView]}
                      onPress={handleSelectedPress}
                    >
                      <View style={styles.radioOutLine}>
                        {storeOpeningHoursType === "selected" && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <View
                        style={[
                          styles.radioButtonTextwrap,
                          {
                            paddingLeft: rtl_support ? 0 : 10,
                            paddingRight: rtl_support ? 10 : 0,
                          },
                        ]}
                      >
                        <Text style={[styles.radioButtonText, rtlText]}>
                          {__("myStoreTexts.selectHours", appSettings.lng)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  {storeOpeningHoursType === "selected" && (
                    <View style={styles.openingHourPickerWrap}>
                      {week.map((day, index) => (
                        <View
                          style={[styles.dayOHPickerWrap, rtlView]}
                          key={day}
                        >
                          <View
                            style={[
                              styles.dayOHPickerContent,
                              { flex: 4 },
                              rtlView,
                            ]}
                          >
                            <View style={styles.dayOHPickerCheckBoxWrap}>
                              <MaterialCommunityIcons
                                onPress={() => handleDaySelection(day)}
                                name={
                                  !!storeOpeningHours[day]?.active
                                    ? "checkbox-marked"
                                    : "checkbox-blank-outline"
                                }
                                size={20}
                                color={COLORS.primary}
                              />
                            </View>
                            <View
                              style={[
                                styles.dayOHPickerTextWrap,
                                {
                                  alignItems: rtl_support
                                    ? "flex-end"
                                    : "flex-start",
                                  paddingLeft: rtl_support ? 0 : 15,
                                  paddingRight: rtl_support ? 15 : 0,
                                },
                              ]}
                            >
                              <Text style={styles.dayOHPickerText}>
                                {weekDays[index]}
                              </Text>
                            </View>
                          </View>
                          {!!storeOpeningHours[day]?.active ? (
                            <View
                              style={[
                                styles.dayOHPickerContent,
                                {
                                  flex: 6,
                                  justifyContent: "space-evenly",
                                },
                                rtlView,
                              ]}
                            >
                              <OHTimePicker
                                value={
                                  storeOpeningHours[day]?.open || "8:00 AM"
                                }
                                type="open"
                                day={day}
                                onSelectTime={handlePickerPress}
                                is12hr={
                                  config.store?.time_options?.showMeridian ??
                                  true
                                }
                              />

                              <Text style={styles.dayOHPickerTimeSeparator}>
                                -
                              </Text>

                              <OHTimePicker
                                value={
                                  storeOpeningHours[day]?.close || "8:00 PM"
                                }
                                type="close"
                                day={day}
                                onSelectTime={handlePickerPress}
                                is12hr={
                                  config.store?.time_options?.showMeridian ||
                                  true
                                }
                              />
                            </View>
                          ) : (
                            <View
                              style={{
                                flex: 6,
                                alignItems: "center",
                              }}
                            >
                              <Text style={[styles.text, rtlText]}>
                                {__("myStoreTexts.closed", appSettings.lng)}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <Formik
                initialValues={{
                  slug: storeData?.slug || "",
                  title: storeData?.title || "",
                  slogan: storeData?.slogan || "",
                  email: storeData?.email || "",
                  phone: storeData?.phone || "",
                  website: storeData?.website || "",
                  address: storeData?.address || "",
                  description: storeData?.description || "",
                  facebook: storeData?.social?.facebook || "",
                  twitter: storeData?.social?.twitter || "",
                  youtube: storeData?.social?.youtube || "",
                  linkedin: storeData?.social?.linkedin || "",
                }}
                validationSchema={validationSchema}
                onSubmit={handleUpdate}
              >
                {({
                  handleChange,
                  handleSubmit,
                  values,
                  errors,
                  setFieldTouched,
                  touched,
                }) => (
                  <View style={styles.storeSectionComponent}>
                    <View style={[styles.storeSectionTitleWrap, rtlView]}>
                      <View style={styles.storeSectionTitleIconWrap}>
                        <Image
                          source={myStoreIcons.infoTitleIcon}
                          style={styles.storeSectionTitleIcon}
                        />
                      </View>
                      <View
                        style={[
                          styles.storeSectionTitleTextWrap,
                          {
                            alignItems: rtl_support ? "flex-end" : "flex-start",
                          },
                        ]}
                      >
                        <Text style={[styles.storeSectionTitleText, rtlText]}>
                          {__("myStoreTexts.info", appSettings.lng)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.storeSectionContentWrap}>
                      <View style={styles.storeInputWrap}>
                        <Text style={[styles.storeInputTitle, rtlTextA]}>
                          {__("myStoreTexts.slug", appSettings.lng)}{" "}
                          <Text
                            style={{ color: COLORS.red, fontWeight: "bold" }}
                          >
                            *
                          </Text>
                        </Text>
                        <TextInput
                          placeholder={__(
                            "myStoreTexts.placeHolders.slug",
                            appSettings.lng
                          )}
                          placeholderTextColor={COLORS.text_gray}
                          style={[styles.storeInput, rtlTextA]}
                          onChangeText={handleChange("slug")}
                          onBlur={() => setFieldTouched("slug")}
                          value={values.slug}
                          autoCorrect={false}
                          autoCapitalize="none"
                          keyboardType="default"
                          editable={!storeData?.slug}
                        />
                        <View style={styles.storeInputErrorWrap}>
                          {errors.slug && touched.slug && (
                            <Text style={[styles.storeInputError, rtlTextA]}>
                              {errors.slug}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.storeInputWrap}>
                        <Text style={[styles.storeInputTitle, rtlTextA]}>
                          {__("myStoreTexts.storeName", appSettings.lng)}{" "}
                          <Text
                            style={{ color: COLORS.red, fontWeight: "bold" }}
                          >
                            *
                          </Text>
                        </Text>
                        <TextInput
                          placeholder={__(
                            "myStoreTexts.placeHolders.title",
                            appSettings.lng
                          )}
                          placeholderTextColor={COLORS.text_gray}
                          style={[styles.storeInput, rtlTextA]}
                          onChangeText={handleChange("title")}
                          onBlur={() => setFieldTouched("title")}
                          value={values.title}
                          autoCorrect={false}
                          keyboardType="default"
                        />
                        <View style={styles.storeInputErrorWrap}>
                          {errors.title && touched.title && (
                            <Text style={[styles.storeInputError, rtlTextA]}>
                              {errors.title}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.storeInputWrap}>
                        <Text style={[styles.storeInputTitle, rtlTextA]}>
                          {__("myStoreTexts.storeSlogan", appSettings.lng)}
                        </Text>
                        <TextInput
                          placeholder={__(
                            "myStoreTexts.placeHolders.slogan",
                            appSettings.lng
                          )}
                          placeholderTextColor={COLORS.text_gray}
                          style={[styles.storeInput, rtlTextA]}
                          onChangeText={handleChange("slogan")}
                          onBlur={() => setFieldTouched("slogan")}
                          value={values.slogan}
                          autoCorrect={false}
                          keyboardType="default"
                        />
                        <View style={styles.storeInputErrorWrap}>
                          {errors.slogan && touched.slogan && (
                            <Text style={[styles.storeInputError, rtlTextA]}>
                              {errors.slogan}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.storeInputWrap}>
                        <Text style={[styles.storeInputTitle, rtlTextA]}>
                          {__("myStoreTexts.storeEmail", appSettings.lng)}{" "}
                          <Text
                            style={{ color: COLORS.red, fontWeight: "bold" }}
                          >
                            *
                          </Text>
                        </Text>
                        <TextInput
                          placeholder={__(
                            "myStoreTexts.placeHolders.email",
                            appSettings.lng
                          )}
                          placeholderTextColor={COLORS.text_gray}
                          style={[styles.storeInput, rtlTextA]}
                          onChangeText={handleChange("email")}
                          onBlur={() => setFieldTouched("email")}
                          value={values.email}
                          keyboardType="email-address"
                        />
                        <View style={styles.storeInputErrorWrap}>
                          {errors.email && touched.email && (
                            <Text style={[styles.storeInputError, rtlTextA]}>
                              {errors.email}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.storeInputWrap}>
                        <Text style={[styles.storeInputTitle, rtlTextA]}>
                          {__("myStoreTexts.storePhone", appSettings.lng)}
                        </Text>
                        <TextInput
                          placeholder={__(
                            "myStoreTexts.placeHolders.phone",
                            appSettings.lng
                          )}
                          placeholderTextColor={COLORS.text_gray}
                          style={[styles.storeInput, rtlTextA]}
                          onChangeText={handleChange("phone")}
                          onBlur={() => setFieldTouched("phone")}
                          value={values.phone}
                          autoCorrect={false}
                          autoCapitalize="none"
                          keyboardType="phone-pad"
                        />
                        <View style={styles.storeInputErrorWrap}>
                          {errors.phone && touched.phone && (
                            <Text style={[styles.storeInputError, rtlTextA]}>
                              {errors.phone}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.storeInputWrap}>
                        <Text style={[styles.storeInputTitle, rtlTextA]}>
                          {__("myStoreTexts.storeWebsite", appSettings.lng)}
                        </Text>
                        <TextInput
                          placeholder={__(
                            "myStoreTexts.placeHolders.website",
                            appSettings.lng
                          )}
                          placeholderTextColor={COLORS.text_gray}
                          style={[styles.storeInput, rtlTextA]}
                          onChangeText={handleChange("website")}
                          onBlur={() => setFieldTouched("website")}
                          value={values.website}
                          autoCorrect={false}
                          autoCapitalize="none"
                          keyboardType="default"
                        />
                        <View style={styles.storeInputErrorWrap}>
                          {errors.website && touched.website && (
                            <Text style={[styles.storeInputError, rtlTextA]}>
                              {errors.website}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.storeInputWrap}>
                        <Text style={[styles.storeInputTitle, rtlTextA]}>
                          {__("myStoreTexts.storeAddress", appSettings.lng)}
                        </Text>
                        <TextInput
                          placeholder={__(
                            "myStoreTexts.placeHolders.address",
                            appSettings.lng
                          )}
                          placeholderTextColor={COLORS.text_gray}
                          style={[styles.storeInputArea, rtlTextA]}
                          onChangeText={handleChange("address")}
                          onBlur={() => setFieldTouched("address")}
                          value={values.address}
                          multiline={true}
                          textAlignVertical="top"
                          keyboardType="default"
                        />
                        <View style={styles.storeInputErrorWrap}>
                          {errors.address && touched.address && (
                            <Text style={[styles.storeInputError, rtlTextA]}>
                              {errors.address}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.storeInputWrap}>
                        <Text style={[styles.storeInputTitle, rtlTextA]}>
                          {__("myStoreTexts.storeDescription", appSettings.lng)}
                        </Text>
                        <TextInput
                          placeholder={__(
                            "myStoreTexts.placeHolders.description",
                            appSettings.lng
                          )}
                          placeholderTextColor={COLORS.text_gray}
                          style={[styles.storeInputArea, rtlTextA]}
                          onChangeText={handleChange("description")}
                          onBlur={() => setFieldTouched("description")}
                          value={values.description}
                          keyboardType="default"
                          textAlignVertical="top"
                          multiline={true}
                        />
                        <View style={styles.storeInputErrorWrap}>
                          {errors.description && touched.description && (
                            <Text style={[styles.storeInputError, rtlTextA]}>
                              {errors.description}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Social Links */}
                      <Text
                        style={[
                          styles.storeInputTitle,
                          { marginBottom: ios ? 10 : 7 },
                          rtlTextA,
                        ]}
                      >
                        {__("myStoreTexts.storeSocial", appSettings.lng)}
                      </Text>
                      <View
                        style={[
                          styles.storeSocialInputWrap,
                          rtlView,
                          {
                            borderColor: "#008fd9",
                            backgroundColor: "#008fd9",
                          },
                        ]}
                      >
                        <View style={styles.socialIconWrap}>
                          <FontAwesome
                            name="facebook"
                            size={20}
                            color={COLORS.white}
                          />
                        </View>
                        <TextInput
                          style={[styles.storeSocialInput, rtlTextA]}
                          onChangeText={handleChange("facebook")}
                          onBlur={() => setFieldTouched("facebook")}
                          value={values.facebook}
                          placeholder={__(
                            "myStoreTexts.placeHolders.facebook",
                            appSettings.lng
                          )}
                          autoCorrect={false}
                          autoCapitalize="none"
                        />
                      </View>
                      <View style={styles.storeSocialInputErrorWrap}>
                        {errors.facebook && touched.facebook && (
                          <Text
                            style={[styles.storeSocialInputError, rtlTextA]}
                          >
                            {errors.facebook}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.storeSocialInputWrap,
                          rtlView,
                          {
                            borderColor: "#30d7f2",
                            backgroundColor: "#30d7f2",
                          },
                        ]}
                      >
                        <View style={styles.socialIconWrap}>
                          <FontAwesome
                            name="twitter"
                            size={20}
                            color={COLORS.white}
                          />
                        </View>
                        <TextInput
                          style={[styles.storeSocialInput, rtlTextA]}
                          onChangeText={handleChange("twitter")}
                          onBlur={() => setFieldTouched("twitter")}
                          value={values.twitter}
                          placeholder={__(
                            "myStoreTexts.placeHolders.twitter",
                            appSettings.lng
                          )}
                          autoCorrect={false}
                          autoCapitalize="none"
                        />
                      </View>
                      <View style={styles.storeSocialInputErrorWrap}>
                        {errors.twitter && touched.twitter && (
                          <Text
                            style={[styles.storeSocialInputError, rtlTextA]}
                          >
                            {errors.twitter}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.storeSocialInputWrap,
                          rtlView,
                          {
                            borderColor: "#f50000",
                            backgroundColor: "#f50000",
                          },
                        ]}
                      >
                        <View style={styles.socialIconWrap}>
                          <FontAwesome
                            name="youtube-play"
                            size={20}
                            color={COLORS.white}
                          />
                        </View>
                        <TextInput
                          style={[styles.storeSocialInput, rtlTextA]}
                          onChangeText={handleChange("youtube")}
                          onBlur={() => setFieldTouched("youtube")}
                          value={values.youtube}
                          placeholder={__(
                            "myStoreTexts.placeHolders.youtube",
                            appSettings.lng
                          )}
                          autoCorrect={false}
                          autoCapitalize="none"
                        />
                      </View>
                      <View style={styles.storeSocialInputErrorWrap}>
                        {errors.youtube && touched.youtube && (
                          <Text
                            style={[styles.storeSocialInputError, rtlTextA]}
                          >
                            {errors.youtube}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.storeSocialInputWrap,
                          rtlView,
                          {
                            borderColor: "#ee6d17",
                            backgroundColor: "#ee6d17",
                          },
                        ]}
                      >
                        <View style={styles.socialIconWrap}>
                          <FontAwesome
                            name="linkedin"
                            size={20}
                            color={COLORS.white}
                          />
                        </View>
                        <TextInput
                          style={[styles.storeSocialInput, rtlTextA]}
                          onChangeText={handleChange("linkedin")}
                          onBlur={() => setFieldTouched("linkedin")}
                          value={values.linkedin}
                          placeholder={__(
                            "myStoreTexts.placeHolders.linkedin",
                            appSettings.lng
                          )}
                          autoCorrect={false}
                          autoCapitalize="none"
                        />
                      </View>
                      <View style={styles.storeSocialInputErrorWrap}>
                        {errors.linkedin && touched.linkedin && (
                          <Text
                            style={[styles.storeSocialInputError, rtlTextA]}
                          >
                            {errors.linkedin}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.updateButtonWrap}>
                      <AppButton
                        title={__(
                          "myStoreTexts.updateStoreButtonTitle",
                          appSettings.lng
                        )}
                        onPress={handleSubmit}
                        disabled={
                          !Object.keys(values).length ||
                          (!storeOHTouched && !Object.keys(touched).length) ||
                          !!Object.keys(errors).length ||
                          !!storeUpdateLoading
                        }
                        loading={!!storeUpdateLoading}
                        style={{
                          borderRadius: 5,
                        }}
                      />
                    </View>
                  </View>
                )}
              </Formik>
            </ScrollView>
          </KeyboardAvoidingView>

          <LogoPickerModal />
          <BannerPickerModal />
        </>
      )}
      <FlashNotification
        falshShow={flashNotification}
        flashMessage={flashNotificationMessage}
      />
    </>
  );
};

const styles = StyleSheet.create({
  bannerImage: {
    height: 170,
    width: "100%",
    resizeMode: "cover",
  },
  bannerWrap: {
    height: 170,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 8,
  },
  bannerButtonGroupWrap: {
    height: 80,
    justifyContent: "space-between",
    position: "absolute",
    right: 10,
    top: 10,
  },
  bannerButtonGroupWrapRtl: {
    height: 80,
    justifyContent: "space-between",
    position: "absolute",
    left: 10,
    top: 10,
  },
  bannerButton: {
    height: 36,
    width: 36,
    backgroundColor: COLORS.primary,
    borderRadius: 36 / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cancelButton: {
    marginTop: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
  contentWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  createStoreMessage: {
    marginBottom: 15,
  },
  createStoreButton: {
    width: "60%",
  },
  dayOHPickerCheckBoxWrap: {
    height: 20,
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dayOHPickerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  dayOHPickerText: {
    textTransform: "capitalize",
  },
  dayOHPickerTextWrap: {
    justifyContent: "center",

    flex: 1,
  },
  dayOHPickerWrap: {
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.gray,
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  libraryText: {
    fontSize: 16,
    color: COLORS.text_gray,
    marginVertical: 10,
  },
  libraryWrap: {
    alignItems: "center",
    marginHorizontal: 15,
  },
  loading: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    flex: 1,
  },
  logoButton: {
    height: 26,
    width: 26,
    backgroundColor: COLORS.primary,
    borderRadius: 26 / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoButtonGroupWrap: {
    height: 60,
    // justifyContent: "space-between",
    position: "absolute",
    left: 150 - 26 - 10,
    top: 10,
  },
  logoButtonGroupWrapRtl: {
    height: 60,
    // justifyContent: "space-between",
    position: "absolute",
    left: 10,
    top: 10,
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 5,
    paddingVertical: 30,
    paddingHorizontal: 15,
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

  radioButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  radioButtonTextwrap: {},
  logoImage: {
    height: 150,
    width: 150,
    resizeMode: "cover",
  },
  logoWrap: {
    height: 150,
    width: 150,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: 8,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text_gray,
    marginBottom: 25,
  },
  noStore: {
    flex: 1,
    paddingHorizontal: "3%",
    paddingBottom: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  noStoreText: {
    fontSize: 18,
    marginBottom: 50,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButtonGroupWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 5,
    justifyContent: "center",
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 12 / 2,

    backgroundColor: COLORS.primary,
  },
  radioOutLine: {
    height: 20,
    width: 20,
    borderRadius: 20 / 2,
    borderWidth: 1,

    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContainer: {
    paddingHorizontal: "3%",
    paddingBottom: 20,
  },
  socialIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    width: 38,
    padding: 4,
  },
  star: { color: COLORS.red },
  storeInput: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    height: 35,
    marginTop: 10,
    marginBottom: 3,
    paddingHorizontal: 10,
  },
  storeInputArea: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    marginTop: 10,
    marginBottom: 3,
    paddingHorizontal: 10,
    minHeight: windowHeight / 10,
    paddingVertical: 8,
  },
  storeInputError: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.red,
  },
  storeInputErrorWrap: {
    height: 20,
  },
  storeInputTitle: {
    fontSize: 14.5,
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  storeSectionComponent: {
    marginBottom: 10,
  },
  storeSectionBottomText: {
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  storeSectionBottomWrap: {
    // flexDirection: "row",
    marginTop: 15,
  },
  storeSectionTitleTextWrap: {
    flex: 1,
    paddingHorizontal: 10,
  },
  storeSectionTitleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  storeSectionTitleIcon: {
    height: 25,
    width: 25,
  },
  storeSectionTitleIconWrap: {
    height: 25,
    width: 25,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  storeSectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  storeSocialInputError: {
    fontSize: 10,
    fontWeight: "bold",
    color: COLORS.red,
  },
  storeSocialInputErrorWrap: {
    height: 15,
    justifyContent: "center",
  },
  storeSocialInput: {
    backgroundColor: COLORS.white,
    flex: 1,
    paddingHorizontal: 5,
  },
  storeSocialInputWrap: {
    flexDirection: "row",
    backgroundColor: "yellow",
    borderWidth: 1,
  },
  updateButtonWrap: {
    marginVertical: 20,
  },
});

export default MyStoreScreen;
