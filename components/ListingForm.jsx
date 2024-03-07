import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Image,
  Alert,
  Platform,
} from "react-native";

// Expo Libraries
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

// Vector Icons
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  FontAwesome,
  MaterialCommunityIcons,
  AntDesign,
} from "@expo/vector-icons";

// External Libraries
import { debounce } from "lodash";
import { Formik } from "formik";
import * as Yup from "yup";
import moment from "moment";
import * as Progress from "react-native-progress";
import MapView, { Marker } from "react-native-maps";
import Geocoder from "react-native-geocoding";
import { GooglePlacesAutocomplete } from "./map/GooglePlacesAutocomplete";

// Custom Components & Variables
import { COLORS } from "../variables/color";
import AppSeparator from "./AppSeparator";
import AppButton from "./AppButton";
import AppTextButton from "./AppTextButton";
import DynamicListPicker from "./DynamicListPicker";
import ImageInputList from "./ImageInputList";
import api, {
  setAuthToken,
  setMultipartHeader,
  removeMultipartHeader,
  removeAuthToken,
} from "../api/client";
import DynamicRadioButton from "./DynamicRadioButton";
import DynamicCheckbox from "./DynamicCheckbox";
import { useStateValue } from "../StateProvider";
import { getCurrencySymbol, decodeString } from "../helper/helper";
import DatePicker from "./DatePicker";
import DateRangePicker from "./DateRangePicker";
import DoneIndicator from "./DoneIndicator";
import UploadingIndicator from "./UploadingIndicator";
import ErrorIndicator from "./ErrorIndicator";
import { getTnC } from "../language/stringPicker";
import AppRadioButton from "./AppRadioButton";
import { __ } from "../language/stringPicker";
import BHTimePicker from "./BHTimePicker";
import SBHDatePicker from "./SBHDatePicker";
import mime from "mime";
import osmApi, { reverseParams, searchParams } from "../api/osmClient";
import WebView from "react-native-webview";
import { routes } from "../navigation/routes";
import { useNavigation } from "@react-navigation/native";
import { miscConfig } from "../app/services/miscConfig";
import CameraButtonIcon from "./svgComponents/CameraButtonIcon";
import GalleryButtonIcon from "./svgComponents/GalleryButtonIcon";

const { width: screenWidth, height: screenHeight } = Dimensions.get("screen");

const ListingForm = ({ catId, type, goBack, osmOverlay, changeOsmOverlay }) => {
  const [
    {
      auth_token,
      user,
      listing_locations,
      config,
      ios,
      appSettings,
      rtl_support,
    },
    dispatch,
  ] = useStateValue();
  const [validationSchema_contact, setValidationSchema_contact] = useState(
    Yup.object().shape({
      name: Yup.string().required(
        __("listingFormTexts.nameLabel", appSettings.lng) +
          " " +
          __("listingFormTexts.formValidation.requiredField", appSettings.lng)
      ),
      zipcode: Yup.string().min(
        3,
        __("listingFormTexts.zipCodeLabel", appSettings.lng) +
          " " +
          __("listingFormTexts.formValidation.minimumLength3", appSettings.lng)
      ),
      website: Yup.string().matches(
        /((https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/,
        __("listingFormTexts.websiteErrorLabel", appSettings.lng)
      ),
      address: Yup.string().label(
        __("listingFormTexts.addressLabel", appSettings.lng)
      ),
      email: Yup.string()
        .required(
          __("listingFormTexts.emailLabel", appSettings.lng) +
            " " +
            __("listingFormTexts.formValidation.requiredField", appSettings.lng)
        )
        .email(
          __("listingFormTexts.formValidation.validEmail", appSettings.lng)
        ),
      phone: Yup.string().min(
        5,
        __("listingFormTexts.phoneLabel", appSettings.lng) +
          " " +
          __("listingFormTexts.formValidation.minimumLength5", appSettings.lng)
      ),
      whatsapp_number: Yup.string().min(
        5,
        __("listingFormTexts.whatsappLabel", appSettings.lng) +
          " " +
          __("listingFormTexts.formValidation.minimumLength5", appSettings.lng)
      ),
    })
  );
  const [imageUris, setImageUris] = useState([]);
  const [imageObjects, setImageObjects] = useState([]);
  const [panoramaUri, setPanoramaUri] = useState([]);
  const [panoramaObject, setPanoramaObject] = useState([]);
  const [listingData, setListingData] = useState({});
  const [tnCData, setTnCData] = useState(getTnC(appSettings.lng));
  const [listingCommonData, setListingCommonData] = useState({});
  const [loading, setLoading] = useState(true);

  const [priceUnitPickerVisible, setPriceUnitPickerVisible] = useState(false);
  const [formData, setFormData] = useState();
  const [customFieldsErrors, setCustomFieldsError] = useState({});
  const [commonFieldsErrors, setCommonFieldsError] = useState(false);
  const [commonRequiredFields, setCommonRequiredFields] = useState([
    "title",
    "price_type",
    "pricing_type",
  ]);
  const [touchedFields, setTouchedFields] = useState([]);
  const [socialErrors, setSocialErrors] = useState([]);
  const [validateCfDependency, setValidateCfDependency] = useState([]);

  const [tnCToggle, setTnCToggle] = useState(false);
  const [tnCVisible, setTnCVisible] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [hasImage, setHasImage] = useState();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState();
  const [error, setError] = useState();
  const [mapType, setMapType] = useState("standard");
  const [markerPosition, setMarkerPosition] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [region, setRegion] = useState({ latitude: 0, longitude: 0 });
  const [hideMap, setHideMap] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [listingGeoAddress, setListingGeoAddress] = useState("");
  const [geoCoderFail, setGeoCoderFail] = useState(false);
  const [geoCoderFailedMessage, setGeoCoderFailedMessage] = useState("");
  const [videoUrlValid, setVideoUrlValid] = useState(true);
  const [locationRequired, setLocationRequired] = useState(
    config.location_type === "local" ? false : true
  );
  const [socialProfiles, setSocialProfiles] = useState({});
  const [bHActive, setBHActive] = useState(false);
  const [defaultBH, setDefaultBH] = useState({
    0: { open: false },
    1: { open: false },
    2: { open: false },
    3: { open: false },
    4: { open: false },
    5: { open: false },
    6: { open: false },
  });
  const [defaultSBH, setDefaultSBH] = useState([]);
  const [imgModal, setImgModal] = useState(false);
  const [floorPlanImgObjects, setfloorPlanImgObjects] = useState([]);
  const [floorPlanInfos, setfloorPlanInfos] = useState([]);
  const [currentImgInd, setCurrentImgInd] = useState(null);
  const [fPIUpdating, setFPIUpdating] = useState(false);
  const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [addingPhoto, setAddingPhoto] = useState(false);
  const [imageRequired, setImageRequired] = useState(false);

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

  const mapViewRef = useRef();
  const mapRef = useRef();
  const navigation = useNavigation();

  const isNumeric = (n) => {
    return n !== "" && !isNaN(parseFloat(n)) && isFinite(n);
  };

  const isEqualToNumber = (v1, v2) => {
    return parseFloat(v1) === parseFloat(v2);
  };

  const isEqualTo = (v1, v2) => {
    return parseString(v1).toLowerCase() === parseString(v2).toLowerCase();
  };

  const containsString = (haystack, needle) => {
    return parseString(haystack).indexOf(parseString(needle)) > -1;
  };
  const matchesPattern = (v1, pattern) => {
    const regexp = new RegExp(parseString(pattern), "gi");
    return parseString(v1).match(regexp);
  };

  const parseString = (str) => {
    return str ? "" + str : "";
  };

  const cfValidated = (rule, cfs) => {
    let isValid = 0;
    const field_id = rule.field;

    const operator = rule.operator;
    const dependFieldArray = cfs ? cfs.filter((_) => _.id == field_id) : [];
    let dependField = dependFieldArray.length ? dependFieldArray[0] : "";
    if (dependField) {
      const dependentFieldValue = listingData["_field_" + field_id] || "";
      //TODO: Check if filed is exist at custom field object
      if (operator === "==empty") {
        // hasNoValue
        isValid = Array.isArray(dependentFieldValue)
          ? !dependentFieldValue.length
          : !dependentFieldValue;
      } else if (operator === "!=empty") {
        // hasValue  -- ANY value
        isValid = Array.isArray(dependentFieldValue)
          ? !!dependentFieldValue.length
          : !!dependentFieldValue;
      } else if (operator === "==") {
        // equalTo
        if (isNumeric(rule.value)) {
          return isEqualToNumber(rule.value, dependentFieldValue);
        } else {
          return isEqualTo(rule.value, dependentFieldValue);
        }
      } else if (operator === "!=") {
        // notEqualTo
        if (isNumeric(rule.value)) {
          return !isEqualToNumber(rule.value, dependentFieldValue);
        } else {
          return !isEqualTo(rule.value, dependentFieldValue);
        }
      } else if (operator === "==pattern") {
        // patternMatch
        return matchesPattern(dependentFieldValue, rule.value);
      } else if (operator === "==contains") {
        // contains
        return containsString(dependentFieldValue, rule.value);
      }
    }
    isValid = isValid === 0 || isValid === 1 ? !!isValid : isValid;
    return isValid;
  };

  const cfDependencyValidateor = (field, cfs) => {
    if (!field.dependency) {
      return true;
    }
    const con = [];
    field.dependency.map((rules) => {
      const conInner = [];
      rules.map((rule) => {
        conInner.push(cfValidated(rule, cfs));
      });
      con.push(conInner);
    });
    if (con.map((item) => !item.includes(false)).includes(true)) {
      return true;
    }
    return false;
  };

  const initialCFDependencyCheck = (cfs) => {
    const tempCfFieldIds = [];
    if (cfs.length) {
      cfs.map((_cf) => {
        if (cfDependencyValidateor(_cf, cfs)) {
          tempCfFieldIds.push(_cf.id);
        }
      });
    }

    setValidateCfDependency(tempCfFieldIds);
  };

  useEffect(() => {
    if (!formData) return;
    initialCFDependencyCheck(formData.custom_fields);
  }, [listingData]);

  // Load listing form
  useEffect(() => {
    if (formData) return;
    setAuthToken(auth_token);
    api.get("listing/form", { category_id: catId }).then((res) => {
      if (res.ok) {
        setFormData(res.data);
        if (res?.data?.config?.gallery?.image_required) {
          setImageRequired(true);
        }
        initialCFDependencyCheck(res.data.custom_fields);
        let tempListingCommonData = {};
        tempListingCommonData["pricing_type"] = "price";

        if (res?.data?.config?.hidden_fields?.includes("price_type")) {
          const tmpCmnReqFlds = commonRequiredFields.filter(
            (_fld) => _fld !== "price_type"
          );
        }
        tempListingCommonData["price_type"] = "fixed";

        setListingCommonData(tempListingCommonData);

        if (res.data.config.hidden_fields) {
          setCommonRequiredFields((prevCommonRequiredFields) =>
            prevCommonRequiredFields.filter(
              (common) => !res.data.config.hidden_fields.includes(common)
            )
          );
        }
        if ("google" === config?.map?.type && config?.map?.api_key) {
          Geocoder.init(config.map.api_key);
        }
        let geoAddress = [];
        if (user.address) {
          geoAddress.push(user.address);
        }
        if (user.zipcode) {
          geoAddress.push(user.zipcode);
        }
        if (config.location_type === "local" && listing_locations.length) {
          listing_locations.map((_location) => geoAddress.push(_location.name));
        }
        if (
          geoAddress.length &&
          config?.map &&
          config?.location_type === "geo"
        ) {
          if ("google" === config?.map?.type) {
            Geocoder.from(decodeString(geoAddress.join(", ")))
              .then((json) => {
                var location = json.results[0].geometry.location;
                const initialMarkerPosition = {
                  latitude: location.lat,
                  longitude: location.lng,
                };
                setRegion(initialMarkerPosition);
                setMarkerPosition(initialMarkerPosition);
              })
              .catch((error) => {
                if (
                  error?.origin?.status === "ZERO_RESULTS" &&
                  config.location_type === "local" &&
                  listing_locations.length
                ) {
                  let onlyAddress = listing_locations.map(
                    (_location) => _location.name
                  );
                  Geocoder.from(decodeString(onlyAddress.join(", ")))
                    .then((json) => {
                      var location = json.results[0].geometry.location;
                      const initialMarkerPosition2 = {
                        latitude: location.lat,
                        longitude: location.lng,
                      };
                      setRegion(initialMarkerPosition2);
                      setMarkerPosition(initialMarkerPosition2);
                      setLoading(false);
                    })
                    .catch((error) => {
                      if (error?.origin?.status === "REQUEST_DENIED") {
                        setGeoCoderFailedMessage(error.origin.error_message);
                        setGeoCoderFail(true);
                        setLoading(false);
                      }
                    });
                }
                if (error?.origin?.status === "REQUEST_DENIED") {
                  setGeoCoderFailedMessage(error.origin.error_message);
                  setGeoCoderFail(true);
                  setLoading(false);
                }
              })
              .then(() => {
                setLoading(false);
              });
          } else {
            const params = searchParams(decodeString(geoAddress.join(", ")));
            osmApi
              .get("search", params)
              .then((res) => {
                if (res.data?.length) {
                  const initialMarkerPosition = {
                    latitude: res.data[0].lat,
                    longitude: res.data[0].lng,
                  };
                  setRegion(initialMarkerPosition);
                  setMarkerPosition(initialMarkerPosition);
                } else {
                  if (
                    config.location_type === "local" &&
                    listing_locations.length
                  ) {
                    const onlyAddress = listing_locations.map(
                      (_location) => _location.name
                    );
                    const params = searchParams(
                      decodeString(onlyAddress.join(", "))
                    );
                    osmApi.get("search", params).then((res) => {
                      if (res.data?.length) {
                        const initialMarkerPosition = {
                          latitude: res.data[0].lat,
                          longitude: res.data[0].lng,
                        };
                        setRegion(initialMarkerPosition);
                        setMarkerPosition(initialMarkerPosition);
                      } else {
                        setGeoCoderFail(true);
                      }
                    });
                  }
                }
              })
              .then(() => {
                setLoading(false);
              });
          }
        } else {
          if (config?.map?.center) {
            const initialMarkerPosition = {
              latitude: parseFloat(config.map.center.lat),
              longitude: parseFloat(config.map.center.lng),
            };
            setRegion(initialMarkerPosition);
            setMarkerPosition(initialMarkerPosition);
          } else {
            const initialMarkerPosition = {
              latitude: 0,
              longitude: 0,
            };
            setRegion(initialMarkerPosition);
            setMarkerPosition(initialMarkerPosition);
          }
          setLoading(false);
          // TODO add event
        }
        removeAuthToken();
      } else {
        alert(res?.data?.error_message || res?.data?.error || res?.problem);
        // TODO add error storing
        removeAuthToken();
        setLoading(false);
      }
    });
  }, [formData]);

  //  custom fields validation
  useEffect(() => {
    if (!formData) return;
    custom_fieldsValidation(listingData, formData, validateCfDependency);
  }, [listingData, tnCToggle, validateCfDependency]);

  //  common fields validation
  useEffect(() => {
    if (!formData) return;
    commonFieldsValidation();
  }, [listingCommonData, touchedFields, tnCToggle]);

  // Video URL Validation
  useEffect(() => {
    videoURLValidation();
  }, [listingCommonData.video_urls]);

  const videoURLValidation = () => {
    let url = listingCommonData?.video_urls || "";
    if (url != undefined || url != "") {
      const pattern = new RegExp(
        "(https?://)(www.)?(youtube.com/watch[?]v=([a-zA-Z0-9_-]{11}))"
      );
      if (pattern.test(url)) {
        if (videoUrlValid === false) {
          setVideoUrlValid(true);
        }
      } else {
        if (videoUrlValid) {
          setVideoUrlValid(false);
        }
      }
    }
  };

  const handleTextData = (key, value) => {
    setListingData((listingData) => {
      return { ...listingData, [key]: value };
    });
  };

  const handleAddPanorama = (uri) => {
    setPanoramaUri([uri]);
    let localUri = uri;
    let filename = localUri.split("/").pop();
    let match = /\.(\w+)$/.exec(filename);

    const image = {
      uri: localUri,
      name: filename,
      type: mime.getType(localUri),
    };

    setPanoramaObject([image]);
  };

  const handleAddMultipleImage = (assets) => {
    if (Array.isArray(assets)) {
      const currentImageCount = imageUris.length + assets.length;
      if (
        formData?.config?.gallery?.max_image_limit &&
        currentImageCount > formData.config.gallery.max_image_limit
      ) {
        alert(__("listingFormTexts.maxCountLimitReached", appSettings.lng));
        return;
      }
      const tempUris = assets.map((asset) => asset.uri);
      setImageUris([...tempUris, ...imageUris]);
      const tempImages = assets.map((asset) => {
        return {
          uri: asset.uri,
          name: asset.uri.split("/").pop(),
          type: mime.getType(asset.uri),
        };
      });

      setImageObjects([...imageObjects, ...tempImages]);
    } else {
      handleAddImage(assets);
    }
  };
  const handleAddImage = (uri) => {
    setImageUris([uri, ...imageUris]);
    let localUri = uri;
    let filename = localUri.split("/").pop();
    let match = /\.(\w+)$/.exec(filename);

    const image = {
      uri: localUri,
      name: filename,
      type: mime.getType(localUri),
    };

    setImageObjects([...imageObjects, image]);
  };
  const handleRemovePanorama = (uri) => {
    setPanoramaUri([]);
    setPanoramaObject([]);
  };
  const handleRemoveImage = (uri) => {
    setImageUris(imageUris.filter((imageUri) => imageUri !== uri));
    setImageObjects((imageObjects) => [
      ...imageObjects.filter((item) => item.uri !== uri),
    ]);
  };

  // Form Submission
  const handleListingFormSubmit = (contact) => {
    setUploadProgress(0);
    setSubmitLoading(true);

    const tempCFData = { ...listingData };
    Object.keys(listingData).map((_key) => {
      if (
        !validateCfDependency.includes(
          parseInt(_key.replace("_field_", ""), 10)
        )
      ) {
        delete tempCFData[_key];
      }
    });

    const data = {
      ["custom_fields"]: tempCFData,
      ...listingCommonData,
      ...contact,
      ["locations"]: [],
      ["category_id"]: catId,
      ["agree"]: 1,
      ["gallery"]: imageObjects,
      ["panorama_img"]: panoramaObject,
      ["floor_plans"]: floorPlanInfos,
      ["listing_type"]: type.id,
      ["hide_map"]: hideMap ? 1 : 0,
      ...markerPosition,
      ["social_profiles"]: { ...socialProfiles },
      ["active_bhs"]: bHActive ? 1 : 0,
      ["active_special_bhs"]: defaultSBH.length ? 1 : 0,
      bhs: defaultBH,
      special_bhs: defaultSBH,
    };
    let fPICount = 0;
    if (floorPlanImgObjects?.length) {
      floorPlanImgObjects.map((imageObj, index) => {
        if (imageObj && imageObj?.uri) {
          fPICount++;
          data[`floor_plan_imgs_${index}`] = [imageObj];
        }
      });
    }

    if (config.location_type === "local" && listing_locations.length) {
      for (const item of listing_locations) {
        data.locations.push(item.term_id);
      }
    }
    if (config.location_type === "geo" && listingGeoAddress) {
      data["geo_address"] = listingGeoAddress;
    }

    if (
      !!formData?.config?.gallery?.image_required &&
      data.gallery.length < 1
    ) {
      alert(__("listingFormTexts.imageRequired", appSettings.lng));
      setUploadProgress(0);
      setSubmitLoading(false);
      return;
    }

    setAuthToken(auth_token);
    if (data?.gallery?.length || data?.panorama_img?.length || fPICount) {
      setHasImage(true);
      const formData = new FormData();
      Object.keys(data).map((key) => {
        if (key === "custom_fields") {
          Object.keys(data[key]).map((innerKey) => {
            formData.append(
              "custom_fields[" + innerKey + "]",
              Array.isArray(data[key][innerKey])
                ? JSON.stringify(data[key][innerKey])
                : data[key][innerKey]
            );
          });
        } else if (key === "bhs" || key === "special_bhs") {
          Object.keys(data[key]).map((innerKey) => {
            const main_key = key + "[" + innerKey + "]";
            const main_value = data[key][innerKey];

            if (main_value && main_value.constructor === {}.constructor) {
              Object.keys(main_value).map((_ik) => {
                const _iv = main_value[_ik];
                if (_ik === "times" && Array.isArray(_iv) && _iv.length) {
                  _iv.map((_iTimesOb, _index) => {
                    if (_iTimesOb.start && _iTimesOb.end) {
                      formData.append(
                        `${main_key}[${_ik}][${_index}][end]`,
                        _iTimesOb.end
                      );
                      formData.append(
                        `${main_key}[${_ik}][${_index}][start]`,
                        _iTimesOb.start
                      );
                    }
                  });
                } else if (_ik === "open") {
                  formData.append(main_key + "[" + _ik + "]", !!_iv);
                } else {
                  formData.append(main_key + "[" + _ik + "]", _iv);
                }
              });
            }
          });
        } else if (key === "floor_plans") {
          if (data[key].length) {
            data[key].map((item, _i) => {
              Object.keys(item).map((_ik) => {
                formData.append(`${key}[${_i}][${_ik}]`, item[_ik]);
              });
            });
          }
        } else if (
          data[key] &&
          Array.isArray(data[key]) &&
          key != "floor_plans"
        ) {
          data[key].length &&
            data[key].map((image) => {
              formData.append(key + "[]", image);
            });
        } else if (data[key] && data[key].constructor === {}.constructor) {
          Object.keys(data[key]).map((innerKey) => {
            formData.append(key + "[" + innerKey + "]", data[key][innerKey]);
          });
        } else {
          formData.append(key, data[key]);
        }
      });

      setMultipartHeader();
      api
        .post("listing/form", formData, {
          onUploadProgress: (value) => progressValue(value),
        })
        .then((res) => {
          if (res.ok) {
            removeMultipartHeader();
            removeAuthToken();
            setHasImage(false);
            setSuccess(true);
          } else {
            // TODO add error storing

            removeMultipartHeader();
            removeAuthToken();
            setHasImage(false);
            setError(true);
            // setSubmitLoading((submitLoading) => false);
          }
        });
    } else {
      if (data?.gallery) {
        delete data.gallery;
      }
      if (data?.panorama_img) {
        delete data.panorama_img;
      }
      api.post("listing/form", data).then((res) => {
        if (res.ok) {
          removeAuthToken();
          setSuccess(true);
        } else {
          // TODO add error storing

          removeAuthToken();
          setError(true);
        }
      });
    }
  };

  const progressValue = (value) => {
    setUploadProgress(value.loaded / value.total);
  };

  const custom_fieldsValidation = (
    listingData,
    formData,
    validateCfDependency
  ) => {
    const requiredFields = formData.custom_fields.filter(
      (field) => field.required && validateCfDependency.includes(field.id)
    );

    const errorData = requiredFields.filter((item) => {
      if (item.type === "checkbox") {
        if (listingData[item.meta_key]) {
          return listingData[item.meta_key].length < 1;
        } else {
          return true;
        }
      } else {
        return !listingData[item.meta_key];
      }
    });
    const errorsObject = {};
    errorData.map((err) => {
      const val = `${err.label} is required`;
      errorsObject[err.meta_key] = val;
    });
    setCustomFieldsError(errorsObject);
  };
  const commonFieldsValidation = () => {
    const errorData = commonRequiredFields.filter((item) => {
      if (listingCommonData[item]) {
        return false;
      } else {
        return true;
      }
    });
    setCommonFieldsError(errorData);
  };

  const handleDateTime = (payLoad, field) => {
    setListingData((prevListingData) => {
      return {
        ...prevListingData,
        [field.meta_key]: moment(payLoad).format(field.date.jsFormat),
      };
    });
    setTouchedFields((prevtouchedFields) =>
      Array.from(new Set([...prevtouchedFields, field.meta_key]))
    );
  };

  const handleDateTimeRange = (type, payLoad, field) => {
    if (type === "start") {
      const newRangeStart = [
        moment(payLoad).format(field.date.jsFormat),
        listingData[field.meta_key]
          ? listingData[field.meta_key][1]
            ? listingData[field.meta_key][1]
            : moment(payLoad).format(field.date.jsFormat)
          : moment(payLoad).format(field.date.jsFormat),
      ];
      setListingData((prevListingData) => {
        return { ...prevListingData, [field.meta_key]: newRangeStart };
      });
    } else {
      const newRangeEnd = [
        listingData[field.meta_key]
          ? listingData[field.meta_key][0]
            ? listingData[field.meta_key][0]
            : moment(payLoad).format(field.date.jsFormat)
          : moment(payLoad).format(field.date.jsFormat),
        moment(payLoad).format(field.date.jsFormat),
      ];
      setListingData((prevListingData) => {
        return { ...prevListingData, [field.meta_key]: newRangeEnd };
      });
    }
    setTouchedFields((prevtouchedFields) =>
      Array.from(new Set([...prevtouchedFields, field.meta_key]))
    );
  };

  const handleTnCShow = () => {
    setTnCVisible(!tnCVisible);
  };

  const handleImageReorder = (data) => {
    setImageUris(data);

    const reorderedImageData = data.map((_uri) => {
      let localUri = _uri;
      let filename = localUri.split("/").pop();
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;

      return {
        uri: localUri,
        name: filename,
        type,
      };
    });
    setImageObjects(reorderedImageData);
  };

  const handleEventOnAnimationDone = () => {
    setSuccess(false);
    if (success) {
      setSubmitLoading(false);
      // goBack();
      dispatch({
        type: "SET_NEW_LISTING_SCREEN",
        newListingScreen: false,
      });
      navigation.replace(routes.drawerNavigator);
    }
  };

  const updatePriceType = (item) => {
    setListingCommonData((prevListingCommonData) => {
      return {
        ...prevListingCommonData,
        ["price_type"]: item.id,
      };
    });
    if (item.id === "on_call") {
      const tempComReqFields = commonRequiredFields.filter(
        (field) => !["price", "max_price"].includes(field)
      );
      setCommonRequiredFields(tempComReqFields);
    } else {
      if (listingCommonData.pricing_type === "range") {
        const tempComReqFields = Array.from(
          new Set([...commonRequiredFields, "price", "max_price"])
        );
        setCommonRequiredFields(tempComReqFields);
      }
      if (listingCommonData.pricing_type === "price") {
        const tempComReqFields = Array.from(
          new Set([...commonRequiredFields, "price"])
        );
        setCommonRequiredFields(tempComReqFields);
      }
    }
  };

  const updatePricingType = (item) => {
    setListingCommonData((prevListingCommonData) => {
      return {
        ...prevListingCommonData,
        ["pricing_type"]: item.id,
      };
    });
    if (item.id === "disabled") {
      const tempComReqFields = commonRequiredFields.filter(
        (field) => !["price", "max_price", "price_type"].includes(field)
      );
      setCommonRequiredFields(tempComReqFields);
    } else {
      if (item.id === "price") {
        const tempComReqFields = Array.from(
          new Set([...commonRequiredFields, "price"])
        ).filter((field) => field !== "max_price");

        setCommonRequiredFields(tempComReqFields);
        if (Object.keys(listingCommonData).includes("max_price")) {
          delete listingCommonData.max_price;
        }
      }
      if (item.id === "range") {
        const tempComReqFields = Array.from(
          new Set([...commonRequiredFields, "price", "max_price"])
        );
        setCommonRequiredFields(tempComReqFields);
      }
    }
  };

  const handleMapTypeChange = () => {
    if (mapType == "standard") {
      setMapType("hybrid");
    } else {
      setMapType("standard");
    }
  };

  const handleMarkerReleaseEvent = (coords, func) => {
    setLocationLoading(true);
    setRegion(coords);
    setMarkerPosition(coords);

    if ("google" === config.map?.type) {
      Geocoder.from(coords.latitude, coords.longitude)
        .then((json) => {
          var addressComponent = json.results[0].formatted_address;
          if (config.location_type === "local") {
            if (addressComponent) {
              func("address", addressComponent);
            }
            const postalCode = json.results[0].address_components.filter(
              (comp) => comp.types.includes("postal_code")
            );
            if (postalCode.length) {
              func("zipcode", postalCode[0].long_name);
            } else {
              func("zipcode", "");
            }
          } else {
            if (addressComponent) {
              setListingGeoAddress(addressComponent);
            }
          }
        })
        .catch((error) => {
          console.warn(error);
        })
        .then(() => {
          setLocationLoading(false);
        });
    } else {
      const params = reverseParams({
        lat: coords.latitude,
        lon: coords.longitude,
      });
      osmApi
        .get("reverse", params)
        .then((res) => {
          if (res.ok) {
            const addressComponent = res.data?.display_name;
            if (config.location_type === "local") {
              if (addressComponent) {
                func("address", addressComponent);
              }
              if (res.data?.address?.postcode) {
                func("zipcode", res.data.address.postcode);
              } else {
                func("zipcode", "");
              }
            } else {
              if (addressComponent) {
                setListingGeoAddress(addressComponent);
              }
            }
          }
        })
        .then(() => {
          setLocationLoading(false);
        });
    }
  };

  const handleReGeocoding = (values, payload) => {
    let geoAddress = [];
    if (payload.address) {
      geoAddress.push(payload.address);
    } else {
      geoAddress.push(values.address);
    }
    if (payload.zipcode) {
      geoAddress.push(payload.zipcode);
    } else {
      geoAddress.push(values.zipcode);
    }
    if (config.location_type === "local" && listing_locations.length) {
      listing_locations.map((_location) => geoAddress.push(_location.name));
    }
    geoAddress = geoAddress.length ? decodeString(geoAddress.join(", ")) : "";
    handleGetGeoLatLng(geoAddress);
  };

  const handleGetGeoLatLng = useCallback(
    debounce((data) => {
      setLocationLoading(true);

      Geocoder.from(data)
        .then((json) => {
          var location = json.results[0].geometry.location;
          const position = {
            latitude: location.lat,
            longitude: location.lng,
          };
          setRegion(position);
          setMarkerPosition(position);
          setLocationLoading(false);
        })
        .catch((error) => {
          // TODO : error notice
          setLocationLoading(false);
        });
    }, 500),
    []
  );

  const handleGetDeviceLocation = (func) => {
    setLocationLoading(true);
    getLocationPermissionAsync(func);
  };

  const getLocationPermissionAsync = async (func) => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Need to enable Location permission to use this feature");
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    setMarkerPosition({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    if (config?.map?.type === "google") {
      Geocoder.from(location.coords.latitude, location.coords.longitude)
        .then((json) => {
          var addressComponent = json.results[0].formatted_address;
          if (config.location_type === "local") {
            if (addressComponent) {
              func("address", addressComponent);
            } else {
              func("address", "");
            }
            const postalCode = json.results[0].address_components.filter(
              (comp) => comp.types.includes("postal_code")
            );
            if (postalCode.length) {
              func("zipcode", postalCode[0].long_name);
            } else {
              func("zipcode", "");
            }
          } else {
            if (addressComponent) {
              setListingGeoAddress(addressComponent);
            }
          }
        })
        .catch((error) => {
          console.warn(error);
          // TODO  display error
        })
        .then(() => {
          setLocationLoading(false);
        });
    } else {
      const params = reverseParams({
        lat: location.coords.latitude,
        lon: location.coords.longitude,
      });
      osmApi
        .get("reverse", params)
        .then((res) => {
          if (res.ok) {
            const addressComponent = res.data?.display_name;
            if (config.location_type === "local") {
              if (addressComponent) {
                func("address", addressComponent);
              } else {
                func("address", "");
              }

              if (res.data?.address?.postcode) {
                func("zipcode", res.data.address.postcode);
              } else {
                func("zipcode", "");
              }
            } else {
              if (addressComponent) {
                setListingGeoAddress(addressComponent);
              }
            }
          }
        })
        .then(() => {
          setLocationLoading(false);
        });
    }
  };

  const handleSocialProfilesValues = (text, profile) => {
    const tempSclPrfl = { ...socialProfiles, [profile]: text.trim() };
    setSocialProfiles(tempSclPrfl);
    socialProfileValidation(text.trim(), profile);
  };

  const socialProfileValidation = useCallback(
    debounce((text, profile) => {
      let url = text;
      if (url.length > 0) {
        const valid =
          /((http|https?):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?$/.test(
            url
          );
        if (valid) {
          const tempErr = socialErrors.filter((_err) => _err !== profile);
          setSocialErrors(tempErr);
        } else {
          setSocialErrors((prevSocialErrors) =>
            Array.from(new Set([...prevSocialErrors, profile]))
          );
        }
      } else {
        const tempErr = socialErrors.filter((_err) => _err !== profile);
        setSocialErrors(tempErr);
      }
    }, 500),
    []
  );

  const handleBHToggle = () => {
    setBHActive((prevBHActive) => !prevBHActive);
  };

  const BHComponent = ({ day, dayName }) => (
    <View style={[styles.bHDayWrap, rtlView]}>
      <View
        style={[
          styles.bHDayLeftWrap,
          { alignItems: rtl_support ? "flex-end" : "flex-start" },
        ]}
      >
        <Text style={[styles.bHDayName, rtlText]} numberOfLines={1}>
          {dayName}
        </Text>
      </View>
      <View
        style={[
          styles.bHDayRightWrap,
          { alignItems: rtl_support ? "flex-end" : "flex-start" },
        ]}
      >
        <TouchableOpacity
          style={[styles.openButtonWrap, rtlView]}
          onPress={() => handleBHDayOpenBtnPress(day)}
        >
          <MaterialCommunityIcons
            name={
              defaultBH[day].open ? "checkbox-marked" : "checkbox-blank-outline"
            }
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.text}>
            {__("listingFormTexts.bHOpenBtnTitle", appSettings.lng)}
          </Text>
        </TouchableOpacity>
        {defaultBH[day].open && (
          <>
            <TouchableOpacity
              style={[styles.timeSlotToggleBtnWrap, rtlView]}
              onPress={() => handletimeSlotToggleBtnPress(day)}
            >
              <MaterialCommunityIcons
                name={
                  !!defaultBH[day]?.times
                    ? "checkbox-marked"
                    : "checkbox-blank-outline"
                }
                size={24}
                color={COLORS.primary}
              />
              <View
                style={{
                  flex: 1,
                  alignItems: rtl_support ? "flex-end" : "flex-start",
                }}
              >
                <Text style={[styles.text, rtlText]}>
                  {__("listingFormTexts.timeSlotToggleButton", appSettings.lng)}
                </Text>
              </View>
            </TouchableOpacity>
            {!!defaultBH[day]?.times && (
              <View
                style={{
                  width: "100%",
                  alignItems: rtl_support ? "flex-end" : "flex-start",
                }}
              >
                {defaultBH[day].times.map((_slot, index, arr) => (
                  <View style={[styles.timeSlot, rtlView]} key={index}>
                    <View
                      style={[
                        styles.timeSltStartWrap,
                        {
                          marginRight: rtl_support ? 0 : 10,
                          marginLeft: rtl_support ? 10 : 0,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.bHDayName,
                          { marginBottom: 5 },
                          rtlTextA,
                        ]}
                      >
                        {__(
                          "listingFormTexts.timeSlotStartTitle",
                          appSettings.lng
                        )}
                      </Text>
                      <View style={styles.slotTimeWrap}>
                        <BHTimePicker
                          value={_slot.start}
                          type="start"
                          day={day}
                          onSelectTime={handleBHTimePickerEvent}
                          serial={index}
                          is12hr={
                            config.store?.time_options?.showMeridian ?? true
                          }
                        />
                      </View>
                    </View>
                    <View style={styles.timeSltEndWrap}>
                      <Text
                        style={[
                          styles.bHDayName,
                          { marginBottom: 5 },
                          rtlTextA,
                        ]}
                      >
                        {__(
                          "listingFormTexts.timeSlotEndTitle",
                          appSettings.lng
                        )}
                      </Text>
                      <View style={styles.slotTimeWrap}>
                        <BHTimePicker
                          value={_slot.end}
                          type="end"
                          day={day}
                          onSelectTime={handleBHTimePickerEvent}
                          serial={index}
                          is12hr={
                            config.store?.time_options?.showMeridian ?? true
                          }
                        />
                      </View>
                    </View>
                    <View style={[styles.btnWrap, rtlView]}>
                      {arr.length > 1 && (
                        <TouchableOpacity
                          style={[styles.sltDltBtn, { flex: 0.5 }]}
                          onPress={() => handleTimeSltDlt(day, index)}
                        >
                          <FontAwesome
                            name="minus-circle"
                            size={20}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>
                      )}

                      {index === arr.length - 1 && (
                        <TouchableOpacity
                          style={[styles.sltAddBtn, { flex: 0.5 }]}
                          onPress={() => handleTimeSltAdd(day, index)}
                        >
                          <FontAwesome
                            name="plus-circle"
                            size={20}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );

  const handleBHDayOpenBtnPress = (day) => {
    const tempBHDay = { ...defaultBH[day], open: !defaultBH[day].open };
    if (!tempBHDay.open) {
      delete tempBHDay.times;
    }
    setDefaultBH({ ...defaultBH, [day]: tempBHDay });
  };

  const handletimeSlotToggleBtnPress = (day) => {
    const format = config.datetime_fmt.time || "h:mm a";
    const tempTimeSlot = {
      start: moment("8:00 am", "h:mm a").format(format),
      end: moment("8:00 pm", "h:mm a").format(format),
    };
    let tempBHDay = { ...defaultBH[day] };
    if (!!tempBHDay?.times) {
      delete tempBHDay.times;
    } else {
      tempBHDay["times"] = [tempTimeSlot];
    }
    setDefaultBH({ ...defaultBH, [day]: tempBHDay });
  };

  const handleTimeSltAdd = (day) => {
    const format = config.datetime_fmt.time || "h:mm a";
    const tempTimeSlot = {
      start: moment("8:00 am", "h:mm a").format(format),
      end: moment("8:00 pm", "h:mm a").format(format),
    };
    const tempBHDay = {
      ...defaultBH[day],
      times: [...defaultBH[day].times, tempTimeSlot],
    };
    const tempBH = { ...defaultBH, [day]: tempBHDay };
    setDefaultBH(tempBH);
  };

  const handleTimeSltDlt = (day, index) => {
    const tempTimes = defaultBH[day].times.filter(
      (_timeSlots, _index) => _index !== index
    );

    const tempBH = {
      ...defaultBH,
      [day]: {
        ...defaultBH[day],
        times: tempTimes,
      },
    };
    setDefaultBH(tempBH);
  };

  const handleBHTimePickerEvent = (day, type, payload, serial) => {
    const format = config.datetime_fmt.time || "h:mm a";

    let tempBHDay = { ...defaultBH[day] };
    let tempTimeSlts = [...defaultBH[day].times];
    let temptimeSlt = { ...defaultBH[day].times[serial] };

    if (type === "start") {
      temptimeSlt["start"] = moment(payload).format(format);
    } else {
      temptimeSlt["end"] = moment(payload).format(format);
    }
    tempTimeSlts[serial] = temptimeSlt;
    tempBHDay["times"] = tempTimeSlts;

    setDefaultBH({ ...defaultBH, [day]: tempBHDay });
  };

  const SBHComponent = ({ specialDay, dataArray }) => (
    <View
      style={[
        styles.bHDayWrap,
        { alignItems: defaultSBH[specialDay].open ? "flex-start" : "center" },
        rtlView,
      ]}
    >
      <View
        style={{
          borderRadius: 2,
          borderWidth: 1,
          borderColor: COLORS.gray,
          flex: 1,
          overflow: "hidden",
        }}
      >
        <View style={{ padding: 5 }}>
          <SBHDatePicker
            day={specialDay}
            onSelectDate={handleSBHDateEvent}
            value={defaultSBH[specialDay].date}
          />
        </View>
      </View>
      <View style={styles.bHDayRightWrap}>
        <View
          style={{
            paddingLeft: rtl_support ? 0 : 5,
            paddingRight: rtl_support ? 5 : 0,
          }}
        >
          <View
            style={{
              flexDirection: rtl_support ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              style={[styles.openButtonWrap, { flex: 1 }, rtlView]}
              onPress={() => handleSBHDayOpenBtnPress(specialDay)}
            >
              <MaterialCommunityIcons
                name={
                  defaultSBH[specialDay].open
                    ? "checkbox-marked"
                    : "checkbox-blank-outline"
                }
                size={24}
                color={COLORS.primary}
              />
              <Text style={[styles.text, rtlTextA]}>
                {__("listingFormTexts.bHOpenBtnTitle", appSettings.lng)}
              </Text>
            </TouchableOpacity>

            {dataArray.length > 1 && (
              <TouchableOpacity
                style={[styles.sltDltBtn, { marginHorizontal: 10 }]}
                onPress={() => handleSpecialDayDlt(specialDay)}
              >
                <FontAwesome
                  name="minus-circle"
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}

            {specialDay === dataArray.length - 1 && (
              <TouchableOpacity
                style={[styles.sltAddBtn, {}]}
                onPress={() => handleSpecialDayAdd()}
              >
                <FontAwesome
                  name="plus-circle"
                  size={20}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            )}
          </View>
          {defaultSBH[specialDay].open && (
            <>
              <TouchableOpacity
                style={[styles.timeSlotToggleBtnWrap, rtlView]}
                onPress={() => handleSBHtimeSlotToggleBtnPress(specialDay)}
              >
                <MaterialCommunityIcons
                  name={
                    !!defaultSBH[specialDay]?.times
                      ? "checkbox-marked"
                      : "checkbox-blank-outline"
                  }
                  size={24}
                  color={COLORS.primary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.text, rtlTextA]}>
                    {__(
                      "listingFormTexts.timeSlotToggleButton",
                      appSettings.lng
                    )}
                  </Text>
                </View>
              </TouchableOpacity>
              {!!defaultSBH[specialDay]?.times && (
                <View style={styles.timeSlotsWrap}>
                  {defaultSBH[specialDay].times.map((_slot, index, arr) => (
                    <View style={[styles.timeSlot, rtlView]} key={index}>
                      <View style={styles.timeSltStartWrap}>
                        <Text
                          style={[
                            styles.bHDayName,
                            { marginBottom: 5 },
                            rtlTextA,
                          ]}
                        >
                          {__(
                            "listingFormTexts.timeSlotStartTitle",
                            appSettings.lng
                          )}
                        </Text>

                        <View style={styles.slotTimeWrap}>
                          <BHTimePicker
                            value={_slot.start}
                            type="start"
                            day={specialDay}
                            onSelectTime={handleSBHTimePickerEvent}
                            serial={index}
                            is12hr={
                              config.store?.time_options?.showMeridian ?? true
                            }
                          />
                        </View>
                      </View>
                      <View style={styles.timeSltEndWrap}>
                        <Text
                          style={[
                            styles.bHDayName,
                            { marginBottom: 5 },
                            rtlTextA,
                          ]}
                        >
                          {__(
                            "listingFormTexts.timeSlotEndTitle",
                            appSettings.lng
                          )}
                        </Text>

                        <View style={styles.slotTimeWrap}>
                          <BHTimePicker
                            value={_slot.end}
                            type="end"
                            day={specialDay}
                            onSelectTime={handleSBHTimePickerEvent}
                            serial={index}
                            is12hr={
                              config.store?.time_options?.showMeridian ?? true
                            }
                          />
                        </View>
                      </View>
                      <View style={[styles.btnWrap, rtlView]}>
                        {arr.length > 1 && (
                          <TouchableOpacity
                            style={[styles.sltDltBtn, { flex: 0.5 }]}
                            onPress={() =>
                              handleSpecialTimeSltDlt(specialDay, index)
                            }
                          >
                            <FontAwesome
                              name="minus-circle"
                              size={20}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>
                        )}

                        {index === arr.length - 1 && (
                          <TouchableOpacity
                            style={[styles.sltAddBtn, { flex: 0.5 }]}
                            onPress={() =>
                              handleSpecialTimeSltAdd(specialDay, index)
                            }
                          >
                            <FontAwesome
                              name="plus-circle"
                              size={20}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </View>
  );

  const handleSBHDateEvent = (day, payload) => {
    const format = config.datetime_fmt.date || "MMMM D, YYYY";
    const tempSBHDayObj = {
      ...defaultSBH[day],
      date: moment(payload).format(format),
    };

    let tempSBHs = [...defaultSBH];
    tempSBHs[day] = tempSBHDayObj;
    setDefaultSBH(tempSBHs);
  };

  const handleSBHToggle = () => {
    if (defaultSBH.length) {
      setDefaultSBH([]);
    } else {
      setDefaultSBH([
        {
          open: false,
          date: moment(new Date()).format(
            config.datetime_fmt.date || "MMMM D, YYYY"
          ),
        },
      ]);
    }
  };

  const handleSBHDayOpenBtnPress = (index) => {
    const tempSBHObj = { ...defaultSBH[index], open: !defaultSBH[index].open };
    let tempSBHs = [...defaultSBH];
    tempSBHs[index] = tempSBHObj;
    setDefaultSBH(tempSBHs);
  };

  const handleSBHtimeSlotToggleBtnPress = (index) => {
    const format = config.datetime_fmt.time || "h:mm a";

    const tempTimeSlot = {
      start: moment(new Date()).format(format),
      end: moment(new Date()).format(format),
    };
    let tempSBHObj = { ...defaultSBH[index] };
    if (!!tempSBHObj?.times) {
      delete tempSBHObj.times;
    } else {
      tempSBHObj["times"] = [tempTimeSlot];
    }
    let tempSBHs = [...defaultSBH];
    tempSBHs[index] = tempSBHObj;
    setDefaultSBH(tempSBHs);
  };

  const handleSpecialTimeSltAdd = (specialDay) => {
    const format = config.datetime_fmt.time || "h:mm a";
    const tempTimeSlot = {
      start: moment(new Date()).format(format),
      end: moment(new Date()).format(format),
    };

    const tempSBHOBJ = {
      ...defaultSBH[specialDay],
      times: [...defaultSBH[specialDay].times, tempTimeSlot],
    };
    let tempSBH = [...defaultSBH];
    tempSBH[specialDay] = tempSBHOBJ;
    setDefaultSBH(tempSBH);
  };

  const handleSpecialTimeSltDlt = (specialDay, index) => {
    const tempTimes = defaultSBH[specialDay].times.filter(
      (_timeSlt, _index) => _index !== index
    );
    let tempSBH = [...defaultSBH];
    tempSBH[specialDay] = { ...defaultSBH[specialDay], times: tempTimes };
    setDefaultSBH(tempSBH);
  };

  const handleSpecialDayAdd = () => {
    setDefaultSBH((prevSBH) => [
      ...prevSBH,
      {
        open: false,
        date: moment(new Date()).format(
          config.datetime_fmt.date || "MMMM D, YYYY"
        ),
      },
    ]);
  };

  const handleSpecialDayDlt = (specialDay) => {
    const tempSBH = defaultSBH.filter((_sbh, index) => index !== specialDay);
    setDefaultSBH(tempSBH);
  };

  const handleSBHTimePickerEvent = (day, type, payload, serial) => {
    const format = config.datetime_fmt.time || "h:mm a";

    let tempSBHDay = { ...defaultSBH[day] };
    let tempTimeSlts = [...defaultSBH[day].times];
    let temptimeSlt = { ...defaultSBH[day].times[serial] };
    let tempSBH = [...defaultSBH];

    if (type === "start") {
      temptimeSlt["start"] = moment(payload).format(format);
    } else {
      temptimeSlt["end"] = moment(payload).format(format);
    }
    tempTimeSlts[serial] = temptimeSlt;
    tempSBHDay["times"] = tempTimeSlts;
    tempSBH[day] = tempSBHDay;

    setDefaultSBH(tempSBH);
  };

  const html_script = `
<!DOCTYPE html>
<html>
<head>
	<title>Quick Start - Leaflet</title>
	<meta charset="utf-8" />
	<meta name="viewport" content="initial-scale=1.0">
	<link rel="shortcut icon" type="image/x-icon" href="docs/images/favicon.ico" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css" integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ==" crossorigin=""/>
    <script src="https://unpkg.com/leaflet@1.6.0/dist/leaflet.js" integrity="sha512-gZwIG9x3wUXg2hdXF6+rVkLF/0Vi9U8D2Ntg4Ga5I5BZpVkVxlJWbSQtXPSiUTtC0TjtGOmxa1AJPuV0CPthew==" crossorigin=""></script>	
</head>
<body style="padding: 0; margin: 0">
<div id="map" style="width: 100%; height: 100vh;"></div>
<script>
var osmLayer = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }
);
var map = L.map('map', {
  zoom: 10,
  maxZoom: 18,
  center: [${region.latitude || config?.map?.center?.lat || 0}, ${
    region.longitude || config?.map?.center?.lng || 0
  }],
  layers: [osmLayer],
});
const marker = L.marker([${
    markerPosition.latitude || config?.map?.center?.lat || 0
  }, ${
    markerPosition.longitude || config?.map?.center?.lng || 0
  }], {  draggable: true, autoPan: true  }).addTo(map);
  marker.on("dragend", function () {
      var latLng = marker.getLatLng();
      window.ReactNativeWebView.postMessage(JSON.stringify(latLng));
  });
marker.setPopupContent("Address jhfashf asdjhfskjhdfk").openPopup();  
</script>
</body>
</html>
`;

  const handleYelpCategories = (catName) => {
    if (listingCommonData?.yelp_categories) {
      const tempYelpCat = [...listingCommonData.yelp_categories];
      if (tempYelpCat.includes(catName)) {
        const filteredCat = tempYelpCat.filter(
          (_tempCat) => _tempCat !== catName
        );
        setListingCommonData((prevCommData) => {
          return { ...prevCommData, yelp_categories: [...filteredCat] };
        });
      } else {
        setListingCommonData((prevCommData) => {
          return {
            ...prevCommData,
            yelp_categories: [...tempYelpCat, catName],
          };
        });
      }
    } else {
      setListingCommonData((prevCommData) => {
        return { ...prevCommData, yelp_categories: [catName] };
      });
    }
  };

  const handleFloorPlanAdd = () => {
    const tempFPInfo = {
      title:
        __("listingFormTexts.floorTitlePrefill", appSettings.lng) +
        " " +
        (floorPlanInfos.length + 1),
      description: "",
      bed: "",
      bath: "",
      size: "",
      parking: "",
    };
    setfloorPlanImgObjects((prevFPIOs) => [...floorPlanImgObjects, null]);
    setfloorPlanInfos((prevFPIs) => [...prevFPIs, tempFPInfo]);
  };

  const handleFPIRemoveAlert = (infoIndex) => {
    Alert.alert(
      "",
      `${__("listingFormTexts.floorPlanRemoveAlert", appSettings.lng)}`,
      [
        {
          text: __("listingFormTexts.cancel", appSettings.lng),
        },
        {
          text: __("listingFormTexts.remove", appSettings.lng),
          onPress: () => handleDeleteFPI(infoIndex),
        },
      ],
      { cancelable: false }
    );
  };

  const handleDeleteFPI = (itemIndex) => {
    const tempFPIOs = [...floorPlanImgObjects];
    tempFPIOs.splice(itemIndex, 1);
    const tempFPInfos = [...floorPlanInfos];
    tempFPInfos.splice(itemIndex, 1);
    setfloorPlanImgObjects(tempFPIOs);
    setfloorPlanInfos(tempFPInfos);
  };

  const handleFPAttributeUpdate = (value, key, item, index) => {
    const tempFPI = { ...item, [key]: value };
    const tempFPIs = [...floorPlanInfos];
    tempFPIs[index] = tempFPI;
    setfloorPlanInfos(tempFPIs);
  };

  const handleFPIAdding = (imageIndex, updating) => {
    if (updating) {
      setFPIUpdating(true);
    }
    setCurrentImgInd(imageIndex);
    setImgModal(true);
  };

  const requestGalleryParmission = async (imageType) => {
    setAddingPhoto(true);
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      alert(
        __("imageInputTexts.ifImageLibraryPermissionDenied", appSettings.lng)
      );
      setAddingPhoto(false);
    } else {
      handleSelectGalleryImage(imageType);
    }
  };

  const handleFPCameraReq = () => {
    requestCameraParmission("fp");
  };
  const handlePanoAdd = () => {
    requestGalleryParmission("pano");
  };
  const handleFPGalleryReq = () => {
    requestGalleryParmission("fp");
  };
  const handleImageCameraReq = () => {
    requestCameraParmission("image");
  };
  const handleImageGalleryReq = () => {
    requestGalleryParmission("image");
  };
  const requestCameraParmission = async (imageType) => {
    setAddingPhoto(true);
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      alert(__("imageInputTexts.ifCameraPermissionDenied", appSettings.lng));
      setAddingPhoto(false);
    } else {
      handleSelectCameraImage(imageType);
    }
  };

  const handleSelectGalleryImage = async (imageType) => {
    if (Platform.OS === "android") {
      if (imageType === "fp") {
        setImgModal(false);
      }
      if (imageType === "image") {
        setPhotoModalVisible(false);
        setAddingPhoto(false);
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: miscConfig?.allowMultipleImageSelection
          ? false
          : miscConfig?.allowImageEditing || false,
        quality: 0.8,
        allowsMultipleSelection:
          (imageType === "image" && miscConfig?.allowMultipleImageSelection) ||
          false,
      });
      if (!result.canceled) {
        if (ios) {
          if (imageType === "fp") {
            setImgModal(false);
          }
          if (imageType === "image") {
            setPhotoModalVisible((prevPMV) => !prevPMV);
            setAddingPhoto(false);
          }
        }
        // console.log(JSON.stringify(result, null, 2));

        if (imageType === "pano") {
          handleAddPanorama(result.assets[0].uri);
        }
        if (imageType === "fp") {
          let localUri = result.assets[0].uri;
          let filename = localUri.split("/").pop();
          let match = /\.(\w+)$/.exec(filename);
          let type = mime.getType(result.assets[0].uri);
          const image = {
            uri: localUri,
            name: filename,
            type,
          };
          const tempFPIOs = [...floorPlanImgObjects];
          tempFPIOs[currentImgInd] = image;
          setfloorPlanImgObjects(tempFPIOs);
          if (fPIUpdating) {
            const tempFPInfo = { ...floorPlanInfos[currentImgInd] };
            if (tempFPInfo?.floor_img) {
              delete tempFPInfo["floor_img"];
              const tempFPInfos = [...floorPlanInfos];
              tempFPInfos[currentImgInd] = tempFPInfo;
              setfloorPlanInfos(tempFPInfos);
            }
            setFPIUpdating(false);
          }
          setCurrentImgInd(undefined);
        }
        if (imageType === "image") {
          if (miscConfig?.allowMultipleImageSelection) {
            handleAddMultipleImage(result.assets);
          } else {
            handleAddImage(result.assets[0].uri);
          }
        }
      }
    } catch (error) {
      if (imageType === "fp") {
        setImgModal(false);
      }
      if (imageType === "image") {
        setPhotoModalVisible((prevPMV) => !prevPMV);
        setAddingPhoto(false);
      }
    }
  };

  const handleSelectCameraImage = async (imageType) => {
    if (Platform.OS === "android") {
      if (imageType === "fp") {
        setImgModal(false);
      }
      if (imageType === "image") {
        setPhotoModalVisible(false);
        setAddingPhoto(false);
      }
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      if (ios) {
        if (imageType === "fp") {
          setImgModal(false);
        }
        if (imageType === "image") {
          setPhotoModalVisible((prevPMV) => !prevPMV);
          setAddingPhoto(false);
        }
      }

      // setImageLoading(true);
      // setAuthToken(auth_token);
      // setMultipartHeader();
      let localUri = result.assets[0].uri;
      if (imageType === "image") {
        handleAddImage(localUri);
        return;
      }
      let filename = localUri.split("/").pop();
      let match = /\.(\w+)$/.exec(filename);
      let type = mime.getType(result.assets[0].uri);
      const image = {
        uri: localUri,
        name: filename,
        type,
      };
      if (imageType === "fp") {
        const tempFPIOs = [...floorPlanImgObjects];
        tempFPIOs[currentImgInd] = image;
        setfloorPlanImgObjects(tempFPIOs);
        if (fPIUpdating) {
          const tempFPInfo = { ...floorPlanInfos[currentImgInd] };
          if (tempFPInfo?.floor_img) {
            delete tempFPInfo["floor_img"];
            const tempFPInfos = [...floorPlanInfos];
            tempFPInfos[currentImgInd] = tempFPInfo;
            setfloorPlanInfos(tempFPInfos);
          }
          setFPIUpdating(false);
        }
        setCurrentImgInd(undefined);
      }
    }
  };

  const handleFPImgRemoveAlert = (imgIndex) => {
    Alert.alert(
      "",
      `${__("listingFormTexts.floorPlanImgRemoveAlert", appSettings.lng)}`,
      [
        {
          text: __("listingFormTexts.cancel", appSettings.lng),
        },
        {
          text: __("listingFormTexts.remove", appSettings.lng),
          onPress: () => handleDeleteFPImg(imgIndex),
        },
      ],
      { cancelable: false }
    );
  };
  const handleFPImgUpdateAlert = (imgIndex) => {
    Alert.alert(
      "",
      `${__("listingFormTexts.floorPlanImgChangeAlert", appSettings.lng)}`,
      [
        {
          text: __("listingFormTexts.cancel", appSettings.lng),
        },
        {
          text: __("listingFormTexts.change", appSettings.lng),
          onPress: () => handleFPIAdding(imgIndex, true),
        },
      ],
      { cancelable: false }
    );
  };

  const handleDeleteFPImg = (imgIndex) => {
    const tempFPImgObjs = [...floorPlanImgObjects];
    tempFPImgObjs[imgIndex] = null;
    setfloorPlanImgObjects(tempFPImgObjs);
    const tempFPInfo = { ...floorPlanInfos[imgIndex] };
    if (tempFPInfo?.floor_img) {
      delete tempFPInfo["floor_img"];
      const tempFPInfos = [...floorPlanInfos];
      tempFPInfos[imgIndex] = tempFPInfo;
      setfloorPlanInfos(tempFPInfos);
    }
  };

  const getCurrencySymbolLocal = (args) => {
    if (listingCommonData?.rtcl_price_currency) {
      return listingCommonData?.rtcl_price_currency;
    } else {
      return getCurrencySymbol(args);
    }
  };

  const priceValidation = (price) => {
    const myRegEx = RegExp(/^\d*\.?\d*$/);
    return myRegEx.test(price);
  };

  return (
    <View style={styles.container}>
      {/* Initial Loading Component */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {/* Common Fields (Image, Title, Pricing Type, Price Type, Price) */}
          <View style={styles.commonFieldsWrap}>
            {/* Floor Plan Section */}
            {config?.floor_plane && (
              <View style={{ paddingBottom: 20 }}>
                {/*Section Title */}
                <View style={[styles.imageInputTitleWrap, rtlView]}>
                  <View style={styles.iconWrap}>
                    <Image
                      style={{
                        height: 25,
                        width: 25,
                        resizeMode: "contain",
                      }}
                      source={require("../assets/floor_plan.png")}
                    />
                  </View>

                  <Text
                    style={[
                      styles.imageInputLabel,
                      {
                        marginLeft: rtl_support ? 0 : 10,
                        marginRight: rtl_support ? 10 : 0,
                      },
                    ]}
                  >
                    {__("listingFormTexts.floorPlanTitle", appSettings.lng)}
                  </Text>
                </View>
                {/* Section Content */}
                {floorPlanInfos.map((fPI, index) => (
                  <View
                    key={`${index}`}
                    style={{ paddingHorizontal: "3%", paddingVertical: 15 }}
                  >
                    {/* Floor Remove Button */}
                    <TouchableOpacity
                      style={{
                        alignSelf: rtl_support ? "flex-start" : "flex-end",
                      }}
                      onPress={() => handleFPIRemoveAlert(index)}
                    >
                      <FontAwesome
                        name="times-circle-o"
                        size={24}
                        color={COLORS.red}
                      />
                    </TouchableOpacity>
                    <View style={{}}>
                      <View style={{ paddingVertical: 5 }}>
                        <TextInput
                          style={[
                            {
                              borderWidth: 1,
                              borderColor: "#b6b6b6",
                              borderRadius: 3,
                              paddingHorizontal: 5,
                              minHeight: 32,
                            },
                            rtlTextA,
                          ]}
                          onChangeText={(value) =>
                            handleFPAttributeUpdate(value, "title", fPI, index)
                          }
                          placeholder={__(
                            "listingFormTexts.titleLabel",
                            appSettings.lng
                          )}
                          value={fPI?.title}
                        />
                      </View>
                      <View style={{ paddingVertical: 5 }}>
                        <TextInput
                          style={[
                            {
                              borderWidth: 1,
                              borderColor: "#b6b6b6",
                              borderRadius: 3,
                              paddingHorizontal: 5,
                              minHeight: 32,
                            },
                            {
                              minHeight: 70,
                              textAlignVertical: "top",
                              paddingVertical: 5,
                            },
                            rtlTextA,
                          ]}
                          onChangeText={(value) =>
                            handleFPAttributeUpdate(
                              value,
                              "description",
                              fPI,
                              index
                            )
                          }
                          placeholder={__(
                            "listingFormTexts.descriptionLabel",
                            appSettings.lng
                          )}
                          value={fPI?.description || ""}
                          multiline
                        />
                      </View>
                      <View
                        style={{
                          flexDirection: rtl_support ? "row-reverse" : "row",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <View
                          style={{
                            paddingVertical: 5,
                            width: "50%",
                            paddingRight: rtl_support ? 0 : 5,
                            paddingLeft: rtl_support ? 5 : 0,
                          }}
                        >
                          <TextInput
                            style={[
                              {
                                borderWidth: 1,
                                borderColor: "#b6b6b6",
                                borderRadius: 3,
                                paddingHorizontal: 5,
                                minHeight: 32,
                              },
                              rtlTextA,
                            ]}
                            onChangeText={(value) =>
                              handleFPAttributeUpdate(value, "bed", fPI, index)
                            }
                            placeholder={__(
                              "listingFormTexts.bedLabel",
                              appSettings.lng
                            )}
                            value={fPI?.bed || ""}
                            keyboardType="numeric"
                          />
                        </View>
                        <View
                          style={{
                            paddingVertical: 5,
                            width: "50%",
                            paddingRight: rtl_support ? 5 : 0,
                            paddingLeft: rtl_support ? 0 : 5,
                          }}
                        >
                          <TextInput
                            style={[
                              {
                                borderWidth: 1,
                                borderColor: "#b6b6b6",
                                borderRadius: 3,
                                paddingHorizontal: 5,
                                minHeight: 32,
                              },
                              rtlTextA,
                            ]}
                            onChangeText={(value) =>
                              handleFPAttributeUpdate(value, "bath", fPI, index)
                            }
                            placeholder={__(
                              "listingFormTexts.bathLabel",
                              appSettings.lng
                            )}
                            value={fPI?.bath || ""}
                            keyboardType="numeric"
                          />
                        </View>
                        <View
                          style={{
                            paddingVertical: 5,
                            width: "50%",
                            paddingRight: rtl_support ? 0 : 5,
                            paddingLeft: rtl_support ? 5 : 0,
                          }}
                        >
                          <TextInput
                            style={[
                              {
                                borderWidth: 1,
                                borderColor: "#b6b6b6",
                                borderRadius: 3,
                                paddingHorizontal: 5,
                                minHeight: 32,
                              },
                              rtlTextA,
                            ]}
                            onChangeText={(value) =>
                              handleFPAttributeUpdate(
                                value,
                                "parking",
                                fPI,
                                index
                              )
                            }
                            placeholder={__(
                              "listingFormTexts.parkingLabel",
                              appSettings.lng
                            )}
                            value={fPI?.parking || ""}
                          />
                        </View>
                        <View
                          style={{
                            paddingVertical: 5,
                            width: "50%",
                            paddingRight: rtl_support ? 5 : 0,
                            paddingLeft: rtl_support ? 0 : 5,
                          }}
                        >
                          <TextInput
                            style={[
                              {
                                borderWidth: 1,
                                borderColor: "#b6b6b6",
                                borderRadius: 3,
                                paddingHorizontal: 5,
                                minHeight: 32,
                              },
                              rtlTextA,
                            ]}
                            onChangeText={(value) =>
                              handleFPAttributeUpdate(value, "size", fPI, index)
                            }
                            placeholder={__(
                              "listingFormTexts.areaLabel",
                              appSettings.lng
                            )}
                            value={fPI?.size || ""}
                          />
                        </View>
                      </View>
                    </View>
                    {!!floorPlanImgObjects[index] ? (
                      <View style={styles.view}>
                        <View
                          style={{
                            // position: "absolute",
                            // top: -30,
                            alignSelf: rtl_support ? "flex-start" : "flex-end",
                            flexDirection: rtl_support ? "row-reverse" : "row",
                            alignItems: "center",
                            paddingVertical: 5,
                          }}
                        >
                          <TouchableOpacity
                            style={{
                              paddingHorizontal: 5,
                            }}
                            onPress={() => handleFPImgRemoveAlert(index)}
                          >
                            <FontAwesome
                              name="times-circle-o"
                              size={24}
                              color={COLORS.red}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{
                              paddingHorizontal: 5,
                            }}
                            onPress={() => handleFPImgUpdateAlert(index)}
                          >
                            <FontAwesome
                              name="refresh"
                              size={22}
                              color={COLORS.primary}
                            />
                          </TouchableOpacity>
                        </View>
                        <View
                          style={{
                            height: 200,
                            width: "100%",
                            marginTop: 10,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {!!floorPlanImgObjects[index]?.uri ? (
                            <Image
                              source={{ uri: floorPlanImgObjects[index].uri }}
                              style={{
                                height: 200,
                                width: "100%",
                                resizeMode: "contain",
                              }}
                            />
                          ) : (
                            <Image
                              source={{ uri: floorPlanImgObjects[index] }}
                              style={{
                                height: 200,
                                width: "100%",
                                resizeMode: "contain",
                              }}
                            />
                          )}
                        </View>
                      </View>
                    ) : (
                      <View
                        style={{
                          width: "100%",
                          backgroundColor: COLORS.bg_dark,
                          height: 60,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <TouchableWithoutFeedback
                          onPress={() => handleFPIAdding(index)}
                        >
                          <Text style={{ fontSize: 15, color: COLORS.primary }}>
                            {__("listingFormTexts.chooseFile", appSettings.lng)}
                          </Text>
                        </TouchableWithoutFeedback>
                      </View>
                    )}
                  </View>
                ))}
                <View style={{ alignItems: "center", paddingTop: 15 }}>
                  <TouchableOpacity
                    onPress={handleFloorPlanAdd}
                    style={{
                      paddingHorizontal: 15,
                      paddingVertical: 5,
                      borderRadius: 5,
                      backgroundColor: COLORS.bg_primary,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: COLORS.primary,
                      }}
                    >
                      {__("listingFormTexts.addFloorBtnTitle", appSettings.lng)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 360 Panorama Component */}
            {config?.panorama && (
              <View style={styles.imageInputWrap}>
                {/* Form Section Title Component */}
                <View style={[styles.imageInputTitleWrap, rtlView]}>
                  <View style={styles.iconWrap}>
                    <Image
                      style={{
                        height: 25,
                        width: 25,
                        resizeMode: "contain",
                      }}
                      source={require("../assets/panorama.png")}
                    />
                  </View>

                  <Text
                    style={[
                      styles.imageInputLabel,
                      {
                        marginLeft: rtl_support ? 0 : 10,
                        marginRight: rtl_support ? 10 : 0,
                      },
                    ]}
                  >
                    {__("listingFormTexts.panoramaTitle", appSettings.lng)}
                  </Text>
                </View>
                <View style={styles.imageInputNotes}>
                  <Text style={[styles.imageInputNotesText, rtlTextA]}>
                    {__("listingFormTexts.panoramaDetail", appSettings.lng)}
                  </Text>
                </View>
                {/* === */}
                <View style={{ opacity: panoramaUri?.length > 0 ? 0.5 : 1 }}>
                  <TouchableOpacity
                    style={{ alignItems: "center", paddingHorizontal: 5 }}
                    onPress={handlePanoAdd}
                    disabled={loading || panoramaUri?.length > 0}
                  >
                    <View
                      style={{
                        backgroundColor: COLORS.primary,
                        height: 50,
                        width: 50,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 25,
                        marginTop: 20,
                      }}
                    >
                      {photoModalVisible ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                      ) : (
                        <AntDesign name="plus" size={28} color={COLORS.white} />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
                {/* === */}
                <ImageInputList
                  type="pano"
                  imageUris={panoramaUri}
                  onAddImage={handleAddPanorama}
                  onRemoveImage={handleRemovePanorama}
                  maxCount={1}
                  // reorder={handleImageReorder}
                />
              </View>
            )}

            {/* Image Input Component */}
            {formData?.config?.gallery && (
              <View style={styles.imageInputWrap}>
                {/* Form Section Title Component */}
                <View style={[styles.imageInputTitleWrap, rtlView]}>
                  <View style={styles.iconWrap}>
                    <Image
                      style={{
                        height: 25,
                        width: 25,
                        resizeMode: "contain",
                      }}
                      source={require("../assets/gallery_icon.png")}
                    />
                  </View>

                  <Text
                    style={[
                      styles.imageInputLabel,
                      {
                        marginLeft: rtl_support ? 0 : 10,
                        marginRight: rtl_support ? 10 : 0,
                      },
                    ]}
                  >
                    {__("listingFormTexts.imagesLabel", appSettings.lng)}
                    {!!formData?.config?.gallery?.image_required && (
                      <Text style={styles.required}> *</Text>
                    )}
                  </Text>
                </View>
                <View style={styles.imageInputNotes}>
                  {!!formData.config.gallery.max_image_limit && (
                    <Text style={[styles.imageInputNotesText, rtlTextA]}>
                      {__("listingFormTexts.maxImageCount", appSettings.lng)}
                      {formData.config.gallery.max_image_limit}
                      {__("listingFormTexts.images", appSettings.lng)}
                    </Text>
                  )}
                  {(!formData.config.gallery.max_image_limit ||
                    formData.config.gallery.max_image_limit > 1) && (
                    <Text style={[styles.imageInputNotesText, rtlTextA]}>
                      {__("listingFormTexts.dragSortText", appSettings.lng)}
                    </Text>
                  )}
                  {!!formData?.config?.gallery?.image_required &&
                    imageUris.length < 1 && (
                      <Text
                        style={[
                          styles.imageInputNotesText,
                          { color: COLORS.red },
                          rtlTextA,
                        ]}
                      >
                        {__("listingFormTexts.imageRequired", appSettings.lng)}
                      </Text>
                    )}
                </View>
                {/* === */}
                <View style={styles.view}>
                  <TouchableOpacity
                    style={{ alignItems: "center", paddingHorizontal: 5 }}
                    onPress={() => {
                      if (
                        imageUris.length >=
                        formData.config.gallery.max_image_limit
                      ) {
                        alert(
                          __(
                            "listingFormTexts.maxImageWarning",
                            appSettings.lng
                          )
                        );
                      } else {
                        setPhotoModalVisible(true);
                      }
                    }}
                    disabled={photoModalVisible}
                  >
                    <View
                      style={{
                        backgroundColor: COLORS.primary,
                        height: 50,
                        width: 50,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 25,
                        marginTop: 20,
                      }}
                    >
                      {photoModalVisible ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                      ) : (
                        <AntDesign name="plus" size={28} color={COLORS.white} />
                      )}
                    </View>

                    <View style={{ paddingTop: 5 }}>
                      <Text style={{ fontSize: 12, color: COLORS.text_light }}>
                        {!formData.config.gallery.max_image_limit ||
                        formData.config.gallery.max_image_limit == 1
                          ? __(
                              "imageInputListTexts.addPhotoButtonTitle",
                              appSettings.lng
                            )
                          : __(
                              "imageInputListTexts.addPhotosButtonTitle",
                              appSettings.lng
                            )}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
                {/* === */}
                <ImageInputList
                  imageUris={imageUris}
                  onAddImage={
                    miscConfig?.allowMultipleImageSelection
                      ? handleAddMultipleImage
                      : handleAddImage
                  }
                  onRemoveImage={handleRemoveImage}
                  maxCount={formData.config.gallery.max_image_limit}
                  reorder={handleImageReorder}
                  type={null}
                />
              </View>
            )}
            {/* Form Section Title Component */}
            <View style={[styles.titleWrap, rtlView]}>
              <View style={styles.iconWrap}>
                <Image
                  style={{
                    height: 25,
                    width: 25,
                    resizeMode: "contain",
                  }}
                  source={require("../assets/product_info_icon.png")}
                />
              </View>
              <Text
                style={[
                  styles.title,
                  {
                    marginLeft: rtl_support ? 0 : 10,
                    marginRight: rtl_support ? 10 : 0,
                  },
                ]}
              >
                {__("listingFormTexts.formTitle", appSettings.lng)}
              </Text>
            </View>
            <AppSeparator style={styles.separator} />
            {/* Title Input Component */}
            <View style={styles.inputWrap}>
              {ios ? (
                <Text style={[styles.label, rtlTextA]}>
                  {__("listingFormTexts.listingTitleLabel", appSettings.lng)}
                  <Text style={styles.required}> *</Text>
                </Text>
              ) : (
                <Text style={[styles.label, rtlTextA]}>
                  <Text style={styles.required}>* </Text>
                  {__("listingFormTexts.listingTitleLabel", appSettings.lng)}
                </Text>
              )}
              <TextInput
                style={[styles.commonField_Text, rtlTextA]}
                onChangeText={(value) => {
                  setListingCommonData((listingCommonData) => {
                    return { ...listingCommonData, ["title"]: value };
                  });
                }}
                onBlur={() =>
                  setTouchedFields((prevTouchedFields) =>
                    Array.from(new Set([...prevTouchedFields, "title"]))
                  )
                }
                value={listingCommonData.title}
              />
              <View style={styles.errorWrap}>
                {touchedFields.includes("title") &&
                  !listingCommonData.title && (
                    <Text style={[styles.errorMessage, rtlTextA]}>
                      {__(
                        "listingFormTexts.fieldRequiredErrorMessage",
                        appSettings.lng
                      )}
                    </Text>
                  )}
              </View>
            </View>

            {/* Pricing Type Input Component */}
            {!formData?.config?.hidden_fields?.includes("pricing_type") &&
              formData?.config?.pricing_types && (
                <View style={styles.inputWrap}>
                  {ios ? (
                    <Text style={[styles.label, rtlTextA]}>
                      {__("listingFormTexts.pricingLabel", appSettings.lng)}
                      <Text style={styles.required}> *</Text>
                    </Text>
                  ) : (
                    <Text style={[styles.label, rtlTextA]}>
                      <Text style={styles.required}>* </Text>
                      {__("listingFormTexts.pricingLabel", appSettings.lng)}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.priceTypePickerWrap,
                      { alignItems: rtl_support ? "flex-end" : "flex-start" },
                    ]}
                  >
                    <AppRadioButton
                      field={formData.config.pricing_types}
                      handleClick={updatePricingType}
                      selected={listingCommonData.pricing_type}
                    />
                  </View>
                  <View style={styles.errorWrap}>
                    {touchedFields.includes("pricing_type") &&
                      !listingCommonData.pricing_type && (
                        <Text style={[styles.errorMessage, rtlTextA]}>
                          {__(
                            "listingFormTexts.fieldRequiredErrorMessage",
                            appSettings.lng
                          )}
                        </Text>
                      )}
                  </View>
                </View>
              )}

            {/* Price Type Input Component */}
            {!formData?.config?.hidden_fields?.includes("price_type") &&
              listingCommonData.pricing_type !== "disabled" && (
                <View style={styles.inputWrap}>
                  {ios ? (
                    <Text style={[styles.label, rtlTextA]}>
                      {__("listingFormTexts.priceTypeLabel", appSettings.lng)}
                      <Text style={styles.required}> *</Text>
                    </Text>
                  ) : (
                    <Text style={[styles.label, rtlTextA]}>
                      <Text style={styles.required}>* </Text>
                      {__("listingFormTexts.priceTypeLabel", appSettings.lng)}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.priceTypePickerWrap,
                      { alignItems: rtl_support ? "flex-end" : "flex-start" },
                    ]}
                  >
                    <AppRadioButton
                      field={formData.config.price_types}
                      handleClick={updatePriceType}
                      selected={listingCommonData.price_type}
                    />
                  </View>
                  <View style={styles.errorWrap}>
                    {touchedFields.includes("price_type") &&
                      !listingCommonData.price_type && (
                        <Text style={[styles.errorMessage, rtlTextA]}>
                          {__(
                            "listingFormTexts.fieldRequiredErrorMessage",
                            appSettings.lng
                          )}
                        </Text>
                      )}
                  </View>
                </View>
              )}
            {/* Price Unit Input Component */}
            {formData?.config?.price_units?.length > 0 &&
              listingCommonData.pricing_type !== "disabled" &&
              listingCommonData.price_type !== "on_call" && (
                <View style={styles.inputWrap}>
                  {ios ? (
                    <Text style={[styles.label, rtlTextA]}>
                      {__("listingFormTexts.priceUnitLabel", appSettings.lng)}
                      <Text style={styles.required}> *</Text>
                    </Text>
                  ) : (
                    <Text style={[styles.label, rtlTextA]}>
                      <Text style={styles.required}>* </Text>
                      {__("listingFormTexts.priceUnitLabel", appSettings.lng)}
                    </Text>
                  )}
                  <View style={styles.priceTypePickerWrap}>
                    <TouchableOpacity
                      style={[styles.priceTypePicker, rtlView]}
                      onPress={() => {
                        setPriceUnitPickerVisible(!priceUnitPickerVisible);
                        setListingCommonData((listingCommonData) => {
                          return {
                            ...listingCommonData,
                            ["price_unit"]: null,
                          };
                        });
                      }}
                    >
                      <Text style={styles.text}>
                        {listingCommonData.price_unit
                          ? `${
                              formData.config.price_units.filter(
                                (item) =>
                                  item.id === listingCommonData.price_unit
                              )[0].name
                            } (${
                              formData.config.price_units.filter(
                                (item) =>
                                  item.id === listingCommonData.price_unit
                              )[0].short
                            })`
                          : // ? `${listingCommonData.price_unit.name} (${listingCommonData.price_unit.short})`
                            __(
                              "listingFormTexts.priceUnitLabel",
                              appSettings.lng
                            )}
                      </Text>
                      <FontAwesome5
                        name="chevron-down"
                        size={14}
                        color={COLORS.text_gray}
                      />
                    </TouchableOpacity>
                    <Modal
                      animationType="slide"
                      transparent={true}
                      visible={priceUnitPickerVisible}
                    >
                      <TouchableWithoutFeedback
                        onPress={() => setPriceUnitPickerVisible(false)}
                      >
                        <View style={styles.modalOverlay} />
                      </TouchableWithoutFeedback>
                      <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                          <Text style={styles.modalText}>{`== ${__(
                            "listingFormTexts.priceUnitLabel",
                            appSettings.lng
                          )} ==`}</Text>
                          <ScrollView
                            contentContainerStyle={{
                              display: "flex",
                              width: "100%",
                              alignItems: "flex-start",
                            }}
                          >
                            {formData.config.price_units.map((item) => (
                              <TouchableOpacity
                                style={styles.pickerOptions}
                                key={`${item.id}`}
                                onPress={() => {
                                  setPriceUnitPickerVisible(false);
                                  setListingCommonData((listingCommonData) => {
                                    return {
                                      ...listingCommonData,
                                      ["price_unit"]: item.id,
                                    };
                                  });
                                }}
                              >
                                <Text
                                  style={[styles.pickerOptionsText, rtlTextA]}
                                >
                                  {item.name} ({item.short})
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                    </Modal>
                  </View>
                  <View style={styles.errorWrap}>
                    {touchedFields.includes("price_unit") &&
                      !listingCommonData.price_unit && (
                        <Text style={[styles.errorMessage, rtlTextA]}>
                          {__(
                            "listingFormTexts.fieldRequiredErrorMessage",
                            appSettings.lng
                          )}
                        </Text>
                      )}
                  </View>
                </View>
              )}

            {config?.multiCurrency &&
              config.multiCurrency.type === "static" && (
                <View style={styles.inputWrap}>
                  {rtl_support ? (
                    <Text style={[styles.label, rtlTextA]}>
                      {/* <Text style={styles.required}>* </Text> */}
                      {__("listingFormTexts.currencyLabel", appSettings.lng)}
                    </Text>
                  ) : (
                    <Text style={[styles.label, rtlTextA]}>
                      {__("listingFormTexts.currencyLabel", appSettings.lng)}
                      {/* <Text style={styles.required}> *</Text> */}
                    </Text>
                  )}
                  <View style={styles.priceTypePickerWrap}>
                    <TouchableOpacity
                      style={[styles.priceTypePicker, rtlView]}
                      onPress={() => {
                        setCurrencyPickerVisible(
                          (prevCurrencyPickerVisible) =>
                            !prevCurrencyPickerVisible
                        );
                        if (!listingCommonData?.rtcl_price_currency) {
                          setListingCommonData((listingCommonData) => {
                            return {
                              ...listingCommonData,
                              ["rtcl_price_currency"]: null,
                            };
                          });
                        }
                      }}
                    >
                      <Text style={styles.label}>
                        {listingCommonData.rtcl_price_currency
                          ? decodeString(
                              config.multiCurrency.currencyList.filter(
                                (cu) =>
                                  cu.id ===
                                  listingCommonData.rtcl_price_currency
                              )[0].name +
                                " (" +
                                config.multiCurrency.currencyList.filter(
                                  (cu) =>
                                    cu.id ===
                                    listingCommonData.rtcl_price_currency
                                )[0].symbol +
                                ")"
                            )
                          : __(
                              "listingFormTexts.currencyLabel",
                              appSettings.lng
                            )}
                      </Text>
                      <FontAwesome5
                        name="chevron-down"
                        size={14}
                        color={COLORS.text_gray}
                      />
                    </TouchableOpacity>
                    <Modal
                      animationType="slide"
                      transparent={true}
                      visible={currencyPickerVisible}
                    >
                      <TouchableWithoutFeedback
                        onPress={() => setCurrencyPickerVisible(false)}
                      >
                        <View style={styles.modalOverlay} />
                      </TouchableWithoutFeedback>
                      <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                          <Text style={styles.modalText}>{`== ${__(
                            "listingFormTexts.currencyLabel",
                            appSettings.lng
                          )} ==`}</Text>
                          <ScrollView
                            contentContainerStyle={{
                              display: "flex",
                              width: "100%",
                              alignItems: "flex-start",
                            }}
                          >
                            {config.multiCurrency.currencyList.map((item) => (
                              <TouchableOpacity
                                style={styles.pickerOptions}
                                key={`${item.id}`}
                                onPress={() => {
                                  setCurrencyPickerVisible(false);
                                  setListingCommonData((listingCommonData) => {
                                    return {
                                      ...listingCommonData,
                                      ["rtcl_price_currency"]: item.id,
                                    };
                                  });
                                }}
                              >
                                <Text
                                  style={[styles.pickerOptionsText, rtlTextA]}
                                >
                                  {item.name} ({decodeString(item.symbol)})
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                    </Modal>
                  </View>
                  <View style={styles.errorWrap}>
                    {touchedFields.includes("price_unit") &&
                      !listingCommonData.price_unit && (
                        <Text style={[styles.errorMessage, rtlTextA]}>
                          {__(
                            "listingFormTexts.fieldRequiredErrorMessage",
                            appSettings.lng
                          )}
                        </Text>
                      )}
                  </View>
                </View>
              )}

            {/* Price Input Component */}
            {!formData?.config?.hidden_fields?.includes("price") &&
              listingCommonData.pricing_type !== "disabled" &&
              listingCommonData.price_type !== "on_call" && (
                <>
                  {listingCommonData.pricing_type !== "range" ? (
                    <View style={styles.inputWrap}>
                      {ios ? (
                        <Text style={[styles.label, rtlTextA]}>
                          {`${__(
                            "listingFormTexts.priceLabel",
                            appSettings.lng
                          )} (${getCurrencySymbolLocal(config.currency)})`}
                          {listingCommonData.price_type !== "on_call" && (
                            <Text style={styles.required}> *</Text>
                          )}
                        </Text>
                      ) : (
                        <Text style={[styles.label, rtlTextA]}>
                          {listingCommonData.price_type !== "on_call" && (
                            <Text style={styles.required}>* </Text>
                          )}
                          {`${__(
                            "listingFormTexts.priceLabel",
                            appSettings.lng
                          )} (${getCurrencySymbolLocal(config.currency)})`}
                        </Text>
                      )}
                      <TextInput
                        style={[styles.commonField_Text, rtlTextA]}
                        onChangeText={(value) => {
                          if (priceValidation(value)) {
                            setListingCommonData((listingCommonData) => {
                              return {
                                ...listingCommonData,
                                ["price"]: value,
                              };
                            });
                          }
                        }}
                        value={listingCommonData.price}
                        keyboardType="decimal-pad"
                        onBlur={() =>
                          setTouchedFields((prevTouchedFields) =>
                            Array.from(new Set([...prevTouchedFields, "price"]))
                          )
                        }
                      />
                      <View style={styles.errorWrap}>
                        {touchedFields.includes("price") &&
                          listingCommonData.price_type !== "on_call" &&
                          !listingCommonData.price && (
                            <Text style={[styles.errorMessage, rtlTextA]}>
                              {__(
                                "listingFormTexts.fieldRequiredErrorMessage",
                                appSettings.lng
                              )}
                            </Text>
                          )}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.inputWrap}>
                      <View
                        style={{
                          flexDirection: rtl_support ? "row-reverse" : "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View style={{ width: "48.5%" }}>
                          {ios ? (
                            <Text style={[styles.label, rtlTextA]}>
                              {`${__(
                                "listingFormTexts.minPriceLabel",
                                appSettings.lng
                              )} (${getCurrencySymbolLocal(config.currency)})`}
                              {listingCommonData.price_type !== "on_call" && (
                                <Text style={styles.required}> *</Text>
                              )}
                            </Text>
                          ) : (
                            <Text style={[styles.label, rtlTextA]}>
                              {listingCommonData.price_type !== "on_call" && (
                                <Text style={styles.required}>* </Text>
                              )}
                              {`${__(
                                "listingFormTexts.minPriceLabel",
                                appSettings.lng
                              )} (${getCurrencySymbolLocal(config.currency)})`}
                            </Text>
                          )}
                          <TextInput
                            style={[styles.commonField_Text, rtlTextA]}
                            onChangeText={(value) => {
                              if (priceValidation(value)) {
                                setListingCommonData((listingCommonData) => {
                                  return {
                                    ...listingCommonData,
                                    ["price"]: value,
                                  };
                                });
                              }
                            }}
                            value={listingCommonData.price}
                            keyboardType="decimal-pad"
                            onBlur={() =>
                              setTouchedFields((prevTouchedFields) =>
                                Array.from(
                                  new Set([...prevTouchedFields, "price"])
                                )
                              )
                            }
                          />
                          <View style={styles.errorWrap}>
                            {touchedFields.includes("price") &&
                              listingCommonData.price_type !== "on_call" &&
                              !listingCommonData.price && (
                                <Text style={[styles.errorMessage, rtlTextA]}>
                                  {__(
                                    "listingFormTexts.fieldRequiredErrorMessage",
                                    appSettings.lng
                                  )}
                                </Text>
                              )}
                          </View>
                        </View>
                        <View style={{ width: "48.5%" }}>
                          {ios ? (
                            <Text style={[styles.label, rtlTextA]}>
                              {`${__(
                                "listingFormTexts.maxPriceLabel",
                                appSettings.lng
                              )} (${getCurrencySymbolLocal(config.currency)})`}
                              {listingCommonData.price_type !== "on_call" &&
                                listingCommonData.pricing_type === "range" && (
                                  <Text style={styles.required}> *</Text>
                                )}
                            </Text>
                          ) : (
                            <Text style={[styles.label, rtlTextA]}>
                              {listingCommonData.price_type !== "on_call" &&
                                listingCommonData.pricing_type === "range" && (
                                  <Text style={styles.required}>* </Text>
                                )}
                              {`${__(
                                "listingFormTexts.maxPriceLabel",
                                appSettings.lng
                              )} (${getCurrencySymbolLocal(config.currency)})`}
                            </Text>
                          )}
                          <TextInput
                            style={[styles.commonField_Text, rtlTextA]}
                            onChangeText={(value) => {
                              if (priceValidation(value)) {
                                setListingCommonData((listingCommonData) => {
                                  return {
                                    ...listingCommonData,
                                    ["max_price"]: value,
                                  };
                                });
                              }
                            }}
                            value={listingCommonData.max_price}
                            keyboardType="decimal-pad"
                            onBlur={() =>
                              setTouchedFields((prevTouchedFields) =>
                                Array.from(
                                  new Set([...prevTouchedFields, "max_price"])
                                )
                              )
                            }
                          />
                          <View style={styles.errorWrap}>
                            {touchedFields.includes("max_price") &&
                              listingCommonData.price_type !== "on_call" &&
                              listingCommonData.pricing_type === "range" &&
                              !listingCommonData.max_price && (
                                <Text style={[styles.errorMessage, rtlTextA]}>
                                  {__(
                                    "listingFormTexts.fieldRequiredErrorMessage",
                                    appSettings.lng
                                  )}
                                </Text>
                              )}
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </>
              )}
          </View>
          {/* Custom Fields */}
          {!!formData?.custom_fields?.length && (
            <View style={styles.customFieldsWrap}>
              {formData.custom_fields.map((field) => (
                <View key={field.meta_key} style={styles.metaField}>
                  {validateCfDependency.includes(field.id) && (
                    <>
                      {ios ? (
                        <Text style={[styles.label, rtlTextA]}>
                          {decodeString(field.label)}
                          {field.required && (
                            <Text style={styles.required}> *</Text>
                          )}
                        </Text>
                      ) : (
                        <Text style={[styles.label, rtlTextA]}>
                          {field.required && (
                            <Text style={styles.required}>* </Text>
                          )}
                          {decodeString(field.label)}
                        </Text>
                      )}
                      {(field.type === "text" ||
                        field.type === "textarea" ||
                        field.type === "url" ||
                        field.type === "number") && (
                        <TextInput
                          style={[
                            field.type === "textarea"
                              ? styles.metaField_TextArea
                              : styles.metaField_Text,
                            rtlTextA,
                          ]}
                          onChangeText={(value) => {
                            handleTextData(field.meta_key, value);
                          }}
                          value={
                            listingData[field.meta_key]
                              ? listingData[field.meta_key]
                              : ""
                          }
                          textAlignVertical={
                            field.type === "textarea" ? "top" : "auto"
                          }
                          multiline={field.type === "textarea"}
                          keyboardType={
                            field.type === "number" ? "decimal-pad" : "default"
                          }
                          contextMenuHidden={field.type === "number"}
                          placeholder={field.placeholder}
                          onBlur={() =>
                            setTouchedFields((prevtouchedFields) =>
                              Array.from(
                                new Set([...prevtouchedFields, field.meta_key])
                              )
                            )
                          }
                        />
                      )}
                      {field.type === "select" && (
                        <View style={styles.dynamicPickerWrap}>
                          <DynamicListPicker
                            field={field}
                            handleTouch={() =>
                              setTouchedFields((prevtouchedFields) =>
                                Array.from(
                                  new Set([
                                    ...prevtouchedFields,
                                    field.meta_key,
                                  ])
                                )
                              )
                            }
                            onselect={(item) => {
                              setListingData((listingData) => {
                                return {
                                  ...listingData,
                                  [field.meta_key]: item.id,
                                };
                              });
                            }}
                          />
                        </View>
                      )}
                      {field.type === "radio" && (
                        <View style={styles.dynamicRadioWrap}>
                          <DynamicRadioButton
                            field={field}
                            handleClick={(item) => {
                              setListingData((listingData) => {
                                return {
                                  ...listingData,
                                  [field.meta_key]: item.id,
                                };
                              });
                              setTouchedFields((prevtouchedFields) =>
                                Array.from(
                                  new Set([
                                    ...prevtouchedFields,
                                    field.meta_key,
                                  ])
                                )
                              );
                            }}
                          />
                        </View>
                      )}
                      {field.type === "checkbox" && (
                        <View style={styles.dynamicCheckboxWrap}>
                          <DynamicCheckbox
                            field={field}
                            handleClick={(value) => {
                              setListingData((listingData) => {
                                return {
                                  ...listingData,
                                  [field.meta_key]: value,
                                };
                              });
                              setTouchedFields((prevtouchedFields) =>
                                Array.from(
                                  new Set([
                                    ...prevtouchedFields,
                                    field.meta_key,
                                  ])
                                )
                              );
                            }}
                          />
                        </View>
                      )}
                      {field.type === "date" && (
                        <View style={styles.dateFieldWrap}>
                          {["date", "date_time"].includes(field.date.type) && (
                            <DatePicker
                              field={field}
                              onSelect={handleDateTime}
                              value={
                                listingData[field.meta_key]
                                  ? listingData[field.meta_key]
                                  : null
                              }
                            />
                          )}
                          {["date_range", "date_time_range"].includes(
                            field.date.type
                          ) && (
                            <DateRangePicker
                              field={field}
                              value={
                                listingData[field.meta_key]
                                  ? listingData[field.meta_key]
                                  : null
                              }
                              onSelect={handleDateTimeRange}
                            />
                          )}
                        </View>
                      )}
                      <View style={styles.errorWrap}>
                        {customFieldsErrors[field.meta_key] &&
                          touchedFields.includes(field.meta_key) && (
                            <Text style={[styles.errorMessage, rtlTextA]}>
                              {customFieldsErrors[field.meta_key]}
                            </Text>
                          )}
                      </View>
                    </>
                  )}
                </View>
              ))}
            </View>
          )}
          {/* Common Fields (Description, Video URL) */}
          <View style={styles.commonFieldsWrap}>
            {formData?.config?.video_urls && (
              <View style={styles.inputWrap}>
                <Text style={[styles.label, rtlTextA]}>
                  {__("listingFormTexts.videoURLLabel", appSettings.lng)}
                </Text>
                <TextInput
                  style={[
                    styles.commonField_Text,
                    { textAlign: rtl_support ? "right" : "left" },
                  ]}
                  onChangeText={(value) => {
                    setListingCommonData((listingCommonData) => {
                      return { ...listingCommonData, ["video_urls"]: value };
                    });
                  }}
                  onBlur={() =>
                    setTouchedFields((prevTouchedFields) =>
                      Array.from(new Set([...prevTouchedFields, "video_urls"]))
                    )
                  }
                  value={listingCommonData.video_urls}
                />
                <Text style={[styles.Text, rtlTextA]}>
                  {__("listingFormTexts.videoURLNote", appSettings.lng)}
                </Text>
                <View
                  style={[
                    styles.errorWrap,
                    { alignItems: rtl_support ? "flex-end" : "flex-start" },
                  ]}
                >
                  {touchedFields.includes("video_urls") &&
                    !videoUrlValid &&
                    !!listingCommonData.video_urls && (
                      <Text style={[styles.errorMessage, rtlText]}>
                        {__(
                          "listingFormTexts.videoURLInvalid",
                          appSettings.lng
                        )}
                      </Text>
                    )}
                </View>
              </View>
            )}

            {!formData?.config?.hidden_fields?.includes("description") && (
              <View style={styles.inputWrap}>
                <Text style={[styles.label, rtlTextA]}>
                  {__(
                    "listingFormTexts.listingDescriptionLabel",
                    appSettings.lng
                  )}
                </Text>
                <TextInput
                  style={[
                    styles.metaField_TextArea,
                    { textAlign: rtl_support ? "right" : "left" },
                  ]}
                  onChangeText={(value) => {
                    setListingCommonData((listingCommonData) => {
                      return {
                        ...listingCommonData,
                        ["description"]: value,
                      };
                    });
                  }}
                  value={listingCommonData.description}
                  textAlignVertical="top"
                  multiline
                  placeholder={__(
                    "listingFormTexts.listingDescriptionLabel",
                    appSettings.lng
                  )}
                />
              </View>
            )}
          </View>
          {/* Business Hours Componenet */}
          {formData?.config?.bhs && (
            <View style={styles.bHWrap}>
              <View style={[styles.contactTitleWrap, rtlView]}>
                <View style={styles.iconWrap}>
                  <FontAwesome
                    name="clock-o"
                    size={24}
                    color={COLORS.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.title,
                    {
                      marginLeft: rtl_support ? 0 : 10,
                      marginRight: rtl_support ? 10 : 0,
                    },
                    rtlText,
                  ]}
                >
                  {__("listingFormTexts.businessHoursTitle", appSettings.lng)}
                </Text>
              </View>
              <AppSeparator style={styles.separator} />
              <View style={styles.bHContentWrap}>
                <View style={[styles.bHToggleBtnWrap, rtlView]}>
                  <TouchableWithoutFeedback
                    style={styles.bHToggleBtnIcon}
                    onPress={handleBHToggle}
                  >
                    <MaterialCommunityIcons
                      name={
                        bHActive ? "checkbox-marked" : "checkbox-blank-outline"
                      }
                      size={24}
                      color={COLORS.primary}
                    />
                  </TouchableWithoutFeedback>
                  <TouchableWithoutFeedback
                    style={styles.bHToggleBtnTextWrap}
                    onPress={handleBHToggle}
                  >
                    <Text
                      style={[
                        styles.bHToggleBtnText,
                        {
                          marginLeft: rtl_support ? 0 : 10,
                          marginRight: rtl_support ? 10 : 0,
                        },
                        rtlText,
                      ]}
                    >
                      {__(
                        "listingFormTexts.businessHoursToggleTitle",
                        appSettings.lng
                      )}
                    </Text>
                  </TouchableWithoutFeedback>
                </View>

                {bHActive && (
                  <>
                    <View
                      style={[
                        styles.bHToggleNoteWrap,
                        { alignItems: rtl_support ? "flex-end" : "flex-start" },
                      ]}
                    >
                      <Text style={[styles.bHToggleNote, rtlText]}>
                        {__(
                          "listingFormTexts.businessHoursToggleNote",
                          appSettings.lng
                        )}
                      </Text>
                    </View>
                    <View style={styles.bHs}>
                      {config.week_days.map((_day) => (
                        <BHComponent
                          day={_day.id}
                          dayName={_day.name}
                          key={_day.id}
                        />
                      ))}
                    </View>
                    <View style={styles.sBHs}>
                      <View style={[styles.bHToggleBtnWrap, rtlView]}>
                        <TouchableWithoutFeedback
                          style={styles.bHToggleBtnIcon}
                          onPress={handleSBHToggle}
                        >
                          <MaterialCommunityIcons
                            name={
                              !!defaultSBH?.length
                                ? "checkbox-marked"
                                : "checkbox-blank-outline"
                            }
                            size={24}
                            color={COLORS.primary}
                          />
                        </TouchableWithoutFeedback>
                        <TouchableWithoutFeedback
                          style={styles.bHToggleBtnTextWrap}
                          onPress={handleSBHToggle}
                        >
                          <Text
                            style={[
                              styles.bHToggleBtnText,
                              {
                                marginLeft: rtl_support ? 0 : 10,
                                marginRight: rtl_support ? 10 : 0,
                              },
                              rtlText,
                            ]}
                          >
                            {__(
                              "listingFormTexts.specialHoursToggleTitle",
                              appSettings.lng
                            )}
                          </Text>
                        </TouchableWithoutFeedback>
                      </View>
                      <View style={[styles.bHToggleNoteWrap, rtlView]}>
                        <Text style={[styles.bHToggleNote, rtlText]}>
                          {__(
                            "listingFormTexts.specialHoursToggleNote",
                            appSettings.lng
                          )}
                        </Text>
                      </View>
                      {defaultSBH.map((_sbh, index, arr) => (
                        <SBHComponent
                          specialDay={index}
                          dataArray={arr}
                          key={index}
                        />
                      ))}
                    </View>
                  </>
                )}
              </View>
            </View>
          )}
          {/* Yelp Nearby Places Section */}
          {config?.yelp && (
            <View style={styles.contactSectionWrap}>
              <View style={[styles.contactTitleWrap, rtlView]}>
                <View style={styles.iconWrap}>
                  <Image
                    style={{
                      height: 25,
                      width: 25,
                      resizeMode: "contain",
                    }}
                    source={require("../assets/yelp.png")}
                  />
                </View>
                <Text
                  style={[
                    styles.title,
                    {
                      marginLeft: rtl_support ? 0 : 10,
                      marginRight: rtl_support ? 10 : 0,
                    },
                    rtlText,
                  ]}
                >
                  {__("listingFormTexts.yelpTitle", appSettings.lng)}
                </Text>
              </View>
              <AppSeparator style={styles.separator} />

              <View style={styles.inputWrap}>
                <Text style={[styles.label, rtlTextA]}>
                  {__("listingFormTexts.yelpCategoriesTitle", appSettings.lng)}
                </Text>
                <View
                  style={{
                    width: "100%",
                    flexDirection: rtl_support ? "row-reverse" : "row",
                    flexWrap: "wrap",
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  {Object.keys(config.yelp.categories).map(
                    (_catName, index) => (
                      <TouchableOpacity
                        onPress={() => handleYelpCategories(_catName)}
                        key={`${index}`}
                        style={{
                          flexDirection: rtl_support ? "row-reverse" : "row",
                          width: "50%",
                          paddingVertical: 5,
                          alignItems: "center",
                        }}
                      >
                        <View style={styles.view}>
                          <MaterialCommunityIcons
                            name={
                              listingCommonData?.yelp_categories?.includes(
                                _catName
                              )
                                ? "checkbox-marked"
                                : "checkbox-blank-outline"
                            }
                            size={20}
                            color={
                              listingCommonData?.yelp_categories?.includes(
                                _catName
                              )
                                ? COLORS.primary
                                : COLORS.gray
                            }
                          />
                        </View>
                        <View style={{ flex: 1, paddingHorizontal: 5 }}>
                          <Text
                            style={{
                              fontSize: 15,
                              color:
                                listingCommonData?.yelp_categories?.includes(
                                  _catName
                                )
                                  ? COLORS.primary
                                  : COLORS.gray,
                            }}
                          >
                            {decodeString(
                              config.yelp.categories[_catName].title
                            )}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            </View>
          )}
          {/* Contact Information Section */}
          <View style={styles.contactSectionWrap}>
            <View style={[styles.contactTitleWrap, rtlView]}>
              <View style={styles.iconWrap}>
                <Image
                  style={{
                    height: 25,
                    width: 25,
                    resizeMode: "contain",
                  }}
                  source={require("../assets/my_profile.png")}
                />
              </View>
              <Text
                style={[
                  styles.title,
                  {
                    marginLeft: rtl_support ? 0 : 10,
                    marginRight: rtl_support ? 10 : 0,
                  },
                  rtlText,
                ]}
              >
                {__("listingFormTexts.contactTitle", appSettings.lng)}
              </Text>
            </View>
            <AppSeparator style={styles.separator} />
            <Formik
              initialValues={{
                zipcode: user.zipcode ? user.zipcode : "",
                address: user.address ? user.address : "",
                phone: user ? user.phone : "",
                whatsapp_number: user.whatsapp_number
                  ? user.whatsapp_number
                  : "",
                website: user.website ? user.website : "",
                email: user ? user.email : "",
                name: user ? `${user.first_name} ${user.last_name}` : "",
              }}
              onSubmit={handleListingFormSubmit}
              validationSchema={validationSchema_contact}
            >
              {({
                handleChange,
                handleSubmit,
                values,
                errors,
                setFieldTouched,
                touched,
                setFieldValue,
              }) => (
                <View>
                  {!osmOverlay && !ios && (
                    <View
                      style={{
                        position: "absolute",
                        zIndex: 2,
                        top: 0,
                        bottom: 0,
                        right: 0,
                        left: 0,
                        opacity: 0,
                      }}
                    >
                      <TouchableWithoutFeedback
                        onPress={() => changeOsmOverlay(true)}
                      >
                        <View
                          style={{
                            height: "100%",
                            width: "100%",
                          }}
                        />
                      </TouchableWithoutFeedback>
                    </View>
                  )}
                  {!formData.config.hidden_fields.includes("name") && (
                    <View style={styles.inputWrap}>
                      <Text style={[styles.label, rtlTextA]}>
                        {__("listingFormTexts.nameLabel", appSettings.lng)}
                        <Text style={styles.required}> *</Text>
                      </Text>
                      <TextInput
                        style={[
                          styles.commonField_Text,
                          { textAlign: rtl_support ? "right" : "left" },
                        ]}
                        onChangeText={handleChange("name")}
                        onBlur={() => setFieldTouched("name")}
                        value={values.name}
                        placeholder={__(
                          "listingFormTexts.nameLabel",
                          appSettings.lng
                        )}
                        editable={!user.first_name && !user.last_name}
                      />
                      <View
                        style={[
                          styles.errorWrap,
                          {
                            alignItems: rtl_support ? "flex-end" : "flex-start",
                          },
                        ]}
                      >
                        {errors.name && touched.name && (
                          <Text style={[styles.errorMessage, rtlText]}>
                            {errors.name}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {!formData.config.hidden_fields.includes("phone") && (
                    <View style={styles.inputWrap}>
                      <Text style={[styles.label, rtlTextA]}>
                        {__("listingFormTexts.phoneLabel", appSettings.lng)}
                      </Text>
                      <TextInput
                        style={[
                          styles.commonField_Text,
                          { textAlign: rtl_support ? "right" : "left" },
                        ]}
                        onChangeText={handleChange("phone")}
                        onBlur={() => setFieldTouched("phone")}
                        value={values.phone}
                        placeholder={__(
                          "listingFormTexts.phoneLabel",
                          appSettings.lng
                        )}
                        keyboardType="phone-pad"
                      />
                      <View
                        style={[
                          styles.errorWrap,
                          {
                            alignItems: rtl_support ? "flex-end" : "flex-start",
                          },
                        ]}
                      >
                        {errors.phone && touched.phone && (
                          <Text style={[styles.errorMessage, rtlText]}>
                            {errors.phone}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                  {!formData.config.hidden_fields.includes(
                    "whatsapp_number"
                  ) && (
                    <View style={styles.inputWrap}>
                      <Text style={[styles.label, rtlTextA]}>
                        {__("listingFormTexts.whatsappLabel", appSettings.lng)}
                      </Text>
                      <TextInput
                        style={[
                          styles.commonField_Text,
                          { textAlign: rtl_support ? "right" : "left" },
                        ]}
                        onChangeText={handleChange("whatsapp_number")}
                        onBlur={() => setFieldTouched("whatsapp_number")}
                        value={values.whatsapp_number}
                        placeholder={__(
                          "listingFormTexts.whatsappLabel",
                          appSettings.lng
                        )}
                        keyboardType="phone-pad"
                      />
                      <Text style={[styles.Text, rtlTextA]}>
                        {__("listingFormTexts.whatsappNote", appSettings.lng)}
                      </Text>
                      <View
                        style={[
                          styles.errorWrap,
                          {
                            alignItems: rtl_support ? "flex-end" : "flex-start",
                          },
                        ]}
                      >
                        {errors.whatsapp_number && touched.whatsapp_number && (
                          <Text style={[styles.errorMessage, rtlText]}>
                            {errors.whatsapp_number}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                  {!formData.config.hidden_fields.includes("email") && (
                    <View style={styles.inputWrap}>
                      <Text style={[styles.label, rtlTextA]}>
                        {__("listingFormTexts.emailLabel", appSettings.lng)}
                        <Text style={styles.required}> *</Text>
                      </Text>
                      <TextInput
                        style={[
                          styles.commonField_Text,
                          { textAlign: rtl_support ? "right" : "left" },
                        ]}
                        onChangeText={handleChange("email")}
                        onBlur={() => setFieldTouched("email")}
                        value={values.email}
                        placeholder={__(
                          "listingFormTexts.emailLabel",
                          appSettings.lng
                        )}
                        keyboardType="email-address"
                      />
                      <View
                        style={[
                          styles.errorWrap,
                          {
                            alignItems: rtl_support ? "flex-end" : "flex-start",
                          },
                        ]}
                      >
                        {errors.email && touched.email && (
                          <Text style={[styles.errorMessage, rtlText]}>
                            {errors.email}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                  {!formData.config.hidden_fields.includes("website") && (
                    <View style={styles.inputWrap}>
                      <Text style={[styles.label, rtlTextA]}>
                        {__("listingFormTexts.websiteLabel", appSettings.lng)}
                      </Text>
                      <TextInput
                        style={[
                          styles.commonField_Text,
                          { textAlign: rtl_support ? "right" : "left" },
                        ]}
                        onChangeText={handleChange("website")}
                        onBlur={() => setFieldTouched("website")}
                        value={values.website}
                        placeholder={__(
                          "listingFormTexts.websiteLabel",
                          appSettings.lng
                        )}
                      />
                      <View
                        style={[
                          styles.errorWrap,
                          {
                            alignItems: rtl_support ? "flex-end" : "flex-start",
                          },
                        ]}
                      >
                        {errors.website && touched.website && (
                          <Text style={[styles.errorMessage, rtlText]}>
                            {errors.website}{" "}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {!formData.config.hidden_fields.includes("zipcode") &&
                    config.location_type === "local" && (
                      <View style={styles.inputWrap}>
                        <Text style={[styles.label, rtlTextA]}>
                          {__("listingFormTexts.zipCodeLabel", appSettings.lng)}
                        </Text>
                        <TextInput
                          style={[
                            styles.commonField_Text,
                            { textAlign: rtl_support ? "right" : "left" },
                          ]}
                          onChangeText={(text) => {
                            setFieldValue("zipcode", text);
                            if (!geoCoderFail) {
                              handleReGeocoding(values, { zipcode: text });
                            }
                          }}
                          onBlur={() => setFieldTouched("zipcode")}
                          value={values.zipcode}
                          placeholder={__(
                            "listingFormTexts.zipCodeLabel",
                            appSettings.lng
                          )}
                        />
                        <View
                          style={[
                            styles.errorWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          {errors.zipcode && touched.zipcode && (
                            <Text style={[styles.errorMessage, rtlText]}>
                              {errors.zipcode}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}
                  {!formData.config.hidden_fields.includes("address") &&
                    config.location_type === "local" && (
                      <View style={styles.inputWrap}>
                        <Text style={[styles.label, rtlTextA]}>
                          {__("listingFormTexts.addressLabel", appSettings.lng)}
                        </Text>
                        <TextInput
                          style={[
                            styles.commonField_Text,
                            { textAlign: rtl_support ? "right" : "left" },
                          ]}
                          onChangeText={(text) => {
                            setFieldValue("address", text);
                            if (!geoCoderFail) {
                              handleReGeocoding(values, { address: text });
                            }
                          }}
                          onBlur={() => setFieldTouched("address")}
                          value={values.address}
                          placeholder={__(
                            "listingFormTexts.addressLabel",
                            appSettings.lng
                          )}
                          // multiline
                        />
                        <View
                          style={[
                            styles.errorWrap,
                            {
                              alignItems: rtl_support
                                ? "flex-end"
                                : "flex-start",
                            },
                          ]}
                        >
                          {errors.address && touched.address && (
                            <Text style={[styles.errorMessage, rtlText]}>
                              {errors.address}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}

                  {/* Google Address */}
                  {config.location_type === "geo" && !geoCoderFail && (
                    <View style={styles.inputWrap}>
                      <Text style={[styles.label, rtlTextA]}>
                        {__(
                          "listingFormTexts.geoAddressLabel",
                          appSettings.lng
                        )}
                        {locationRequired && (
                          <Text style={styles.required}> *</Text>
                        )}
                      </Text>

                      <GooglePlacesAutocomplete
                        type={config.map?.type || "osm"}
                        placeholder={
                          listingGeoAddress
                            ? listingGeoAddress
                            : "Search Address"
                        }
                        textInputProps={{
                          placeholderTextColor: listingGeoAddress
                            ? COLORS.black
                            : "#b6b6b6",
                        }}
                        onPress={(data, details = null, inputRef) => {
                          if (data.description) {
                            setListingGeoAddress(
                              (prevListingGeoAddress) => data.description
                            );
                          }
                          let geoLocation = null;
                          if (
                            "google" === config.map?.type &&
                            details?.geometry?.location
                          ) {
                            geoLocation = {
                              latitude: details.geometry.location.lat,
                              longitude: details.geometry.location.lng,
                            };
                          } else if (data?.details?.geometry?.location) {
                            geoLocation = {
                              latitude: parseFloat(
                                data.details.geometry.location.lat
                              ),
                              longitude: parseFloat(
                                data.details.geometry.location.lng
                              ),
                            };
                          }
                          if (geoLocation) {
                            setRegion((prevRegion) => {
                              return { ...geoLocation };
                            });
                            setMarkerPosition((prevListingGeoAddress) => {
                              return { ...geoLocation };
                            });
                          }

                          if (inputRef) {
                            inputRef.clear();
                          }
                        }}
                        fetchDetails={"google" === config.map?.type}
                        query={
                          "google" === config.map?.type
                            ? {
                                key: config.map.api_key,
                                language: "en",
                              }
                            : { language: "en" }
                        }
                        debounce={200}
                        timeout={15000} //15 seconds
                      />

                      <View
                        style={[
                          styles.errorWrap,
                          {
                            alignItems: rtl_support ? "flex-start" : "flex-end",
                          },
                        ]}
                      >
                        {locationRequired && !listingGeoAddress && (
                          <Text style={[styles.errorMessage, rtlText]}>
                            This field is required
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                  {/* MapView */}
                  {config.map && (
                    <View>
                      {geoCoderFail ? (
                        <View
                          style={{
                            marginHorizontal: "3%",
                          }}
                        >
                          <View style={styles.geoCoderFailWrap}>
                            <Text style={[styles.geoCoderFailTitle, rtlText]}>
                              {__(
                                "listingFormTexts.geoCoderFail",
                                appSettings.lng
                              )}
                            </Text>
                            <Text style={[styles.geoCoderFailMessage, rtlText]}>
                              {geoCoderFailedMessage}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <>
                          {/* Loading Component Inside Map */}
                          {locationLoading && (
                            <View style={styles.mapOverlay}>
                              <ActivityIndicator
                                size="large"
                                color={COLORS.primary}
                              />
                            </View>
                          )}
                          {/* Map Mode Toggle Button */}
                          <View style={styles.mapViewButtonsWrap}>
                            <TouchableOpacity
                              style={[
                                styles.mapViewButton,
                                {
                                  backgroundColor:
                                    mapType == "standard"
                                      ? COLORS.dodgerblue
                                      : "transparent",
                                },
                              ]}
                              onPress={handleMapTypeChange}
                              disabled={mapType == "standard"}
                            >
                              <Text
                                style={[
                                  styles.mapViewButtonTitle,
                                  {
                                    color:
                                      mapType == "standard"
                                        ? COLORS.white
                                        : COLORS.text_gray,
                                  },
                                  rtlText,
                                ]}
                              >
                                standard
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.mapViewButton,
                                {
                                  backgroundColor:
                                    mapType == "hybrid"
                                      ? COLORS.dodgerblue
                                      : "transparent",
                                },
                              ]}
                              onPress={handleMapTypeChange}
                              disabled={mapType == "hybrid"}
                            >
                              <Text
                                style={[
                                  styles.mapViewButtonTitle,
                                  {
                                    color:
                                      mapType == "hybrid"
                                        ? COLORS.white
                                        : COLORS.text_gray,
                                  },
                                  rtlText,
                                ]}
                              >
                                hybrid
                              </Text>
                            </TouchableOpacity>
                          </View>
                          {/* Map Component */}
                          {"google" === config?.map?.type ? (
                            <MapView
                              ref={mapViewRef}
                              style={{
                                width: screenWidth,
                                height: screenWidth * 0.8,
                              }}
                              region={{
                                ...region,
                                latitudeDelta: 0.0135135,
                                longitudeDelta: 0.0135135 * 0.8,
                              }}
                              provider={MapView.PROVIDER_GOOGLE}
                              mapType={mapType}
                              loadingEnabled={true}
                              loadingIndicatorColor={COLORS.primary_soft}
                              loadingBackgroundColor={COLORS.white}
                            >
                              <Marker
                                coordinate={markerPosition}
                                draggable
                                onDragEnd={(event) =>
                                  handleMarkerReleaseEvent(
                                    event.nativeEvent.coordinate,
                                    setFieldValue
                                  )
                                }
                              />
                            </MapView>
                          ) : (
                            <View
                              style={{
                                width: screenWidth,
                                height: screenWidth * 0.8,
                                zIndex: 3,
                              }}
                            >
                              {!loading && (
                                <WebView
                                  ref={mapRef}
                                  source={{ html: html_script }}
                                  style={{ flex: 1, opacity: 0.99 }}
                                  onMessage={(event) => {
                                    const rawData = event.nativeEvent.data;
                                    if (rawData) {
                                      const data = JSON.parse(rawData);
                                      handleMarkerReleaseEvent(
                                        {
                                          latitude: data?.lat,
                                          longitude: data?.lng,
                                        },
                                        setFieldValue
                                      );
                                    }
                                  }}
                                />
                              )}
                              {!ios && osmOverlay && (
                                <View
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    right: 0,
                                    left: 0,

                                    zIndex: 4,
                                    opacity: 0,
                                  }}
                                >
                                  <TouchableWithoutFeedback
                                    onPress={() => changeOsmOverlay(false)}
                                  >
                                    <View
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                      }}
                                    />
                                  </TouchableWithoutFeedback>
                                </View>
                              )}
                            </View>
                          )}
                          {/* Hide Map Toggle */}
                          <View style={styles.view}>
                            {!osmOverlay && !ios && (
                              <View
                                style={{
                                  position: "absolute",
                                  zIndex: 2,
                                  top: 0,
                                  bottom: 0,
                                  right: 0,
                                  left: 0,
                                  opacity: 0,
                                }}
                              >
                                <TouchableWithoutFeedback
                                  onPress={() => changeOsmOverlay(true)}
                                >
                                  <View
                                    style={{
                                      height: "100%",
                                      width: "100%",
                                    }}
                                  />
                                </TouchableWithoutFeedback>
                              </View>
                            )}

                            <View style={styles.mapDisplayInputWrap}>
                              <TouchableWithoutFeedback
                                onPress={() =>
                                  setHideMap((prevHideMap) => !prevHideMap)
                                }
                              >
                                <View style={[styles.mapCheckboxWrap, rtlView]}>
                                  <MaterialCommunityIcons
                                    name={
                                      hideMap
                                        ? "checkbox-marked"
                                        : "checkbox-blank-outline"
                                    }
                                    size={20}
                                    color={COLORS.primary}
                                  />
                                  <Text
                                    style={[
                                      styles.mapToggleTitle,
                                      {
                                        paddingLeft: rtl_support ? 0 : 5,
                                        paddingRight: rtl_support ? 5 : 0,
                                      },
                                      rtlText,
                                    ]}
                                  >
                                    {__(
                                      "listingFormTexts.mapToggleTitle",
                                      appSettings.lng
                                    )}
                                  </Text>
                                </View>
                              </TouchableWithoutFeedback>
                            </View>
                          </View>
                          {/* Device Location Button */}
                          <TouchableOpacity
                            style={[
                              styles.deviceLocationButton,
                              ios
                                ? {
                                    shadowColor: "#000",
                                    shadowRadius: 4,
                                    shadowOpacity: 0.2,
                                    shadowOffset: {
                                      height: 2,
                                      width: 2,
                                    },
                                  }
                                : { elevation: 1 },
                            ]}
                            onPress={() =>
                              handleGetDeviceLocation(setFieldValue)
                            }
                            disabled={locationLoading}
                          >
                            <MaterialIcons
                              name="my-location"
                              size={24}
                              color={
                                locationLoading
                                  ? COLORS.primary_soft
                                  : COLORS.primary
                              }
                            />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                  {/* Social Profiles Component */}
                  {!!formData?.config?.social_profiles?.length && (
                    <View style={styles.socialProfilesWrap}>
                      {!osmOverlay && !ios && (
                        <View
                          style={{
                            position: "absolute",
                            zIndex: 2,
                            top: 0,
                            bottom: 0,
                            right: 0,
                            left: 0,
                            opacity: 0,
                          }}
                        >
                          <TouchableWithoutFeedback
                            onPress={() => changeOsmOverlay(true)}
                          >
                            <View
                              style={{
                                height: "100%",
                                width: "100%",
                              }}
                            />
                          </TouchableWithoutFeedback>
                        </View>
                      )}
                      <View style={[styles.contactTitleWrap, rtlView]}>
                        <View style={styles.iconWrap}>
                          <FontAwesome
                            name="share-alt"
                            size={24}
                            color={COLORS.primary}
                          />
                        </View>
                        <Text
                          style={[
                            styles.title,
                            {
                              marginLeft: rtl_support ? 0 : 10,
                              marginRight: rtl_support ? 10 : 0,
                            },
                            rtlText,
                          ]}
                        >
                          {__(
                            "listingFormTexts.socialProfileTitle",
                            appSettings.lng
                          )}
                        </Text>
                      </View>
                      <AppSeparator style={styles.separator} />
                      <View style={styles.sclPrflsWrap}>
                        {formData?.config?.social_profiles.map((_profile) => (
                          <View style={styles.inputWrap} key={_profile.id}>
                            <Text style={[styles.label, rtlTextA]}>
                              {decodeString(_profile.name)}
                            </Text>
                            <TextInput
                              style={[
                                styles.commonField_Text,
                                { textAlign: rtl_support ? "right" : "left" },
                              ]}
                              onChangeText={(text) =>
                                handleSocialProfilesValues(text, _profile.id)
                              }
                              onBlur={() =>
                                setTouchedFields((prevTouchedFields) =>
                                  Array.from(
                                    new Set([...prevTouchedFields, _profile.id])
                                  )
                                )
                              }
                              value={socialProfiles[_profile.id]}
                              placeholder={_profile.name}
                            />
                            <View
                              style={[
                                styles.errorWrap,
                                {
                                  alignItems: rtl_support
                                    ? "flex-end"
                                    : "flex-start",
                                },
                              ]}
                            >
                              {socialErrors.includes(_profile.id) &&
                                touchedFields.includes(_profile.id) && (
                                  <Text style={[styles.errorMessage, rtlText]}>
                                    {__(
                                      "listingFormTexts.websiteErrorLabel",
                                      appSettings.lng
                                    )}
                                  </Text>
                                )}
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Terms & Conditions Toggle */}
                  <TouchableOpacity
                    style={[styles.tnCToggle, rtlView]}
                    onPress={() => setTnCToggle(!tnCToggle)}
                  >
                    <MaterialCommunityIcons
                      name={
                        tnCToggle ? "checkbox-marked" : "checkbox-blank-outline"
                      }
                      size={24}
                      color={COLORS.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.tnCToggleText,
                          {
                            paddingLeft: rtl_support ? 0 : 5,
                            paddingRight: rtl_support ? 5 : 0,
                          },
                          rtlText,
                        ]}
                      >
                        {__("listingFormTexts.tnCToggleText", appSettings.lng)}
                        <Text style={styles.tncText} onPress={handleTnCShow}>
                          {__("listingFormTexts.tncText", appSettings.lng)}
                        </Text>
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <AppSeparator style={styles.separator} />
                  {/* Submit Button Component */}
                  <View style={{ paddingHorizontal: "3%" }}>
                    <AppButton
                      title={__(
                        "listingFormTexts.submitButtonTitle",
                        appSettings.lng
                      )}
                      style={styles.submitButton}
                      onPress={handleSubmit}
                      loading={submitLoading}
                      disabled={
                        !!Object.keys(errors)?.length ||
                        !!Object.keys(customFieldsErrors)?.length ||
                        !!commonFieldsErrors?.length ||
                        !tnCToggle ||
                        (config.location_type === "geo" &&
                          !listingGeoAddress &&
                          !geoCoderFail) ||
                        (!videoUrlValid && !!listingCommonData?.video_urls)
                      }
                      textStyle={{ textTransform: "capitalize" }}
                    />
                  </View>
                </View>
              )}
            </Formik>
          </View>
        </>
      )}
      {/* Terms & Conditions */}
      <Modal animationType="slide" transparent={true} visible={tnCVisible}>
        <SafeAreaView style={styles.tncModal}>
          <ScrollView contentContainerStyle={styles.tnCModalContent}>
            <Text
              style={[
                {
                  textAlign: "center",
                  fontWeight: "bold",
                  marginTop: 10,
                  fontSize: 17,
                },
                rtlText,
              ]}
            >
              {__("listingFormTexts.tncTitleText", appSettings.lng)}
            </Text>
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 10,
              }}
            >
              {tnCData.map((_tnc, index) => (
                <View
                  style={[
                    styles.tncParaWrap,
                    { alignItems: rtl_support ? "flex-end" : "flex-start" },
                  ]}
                  key={index}
                >
                  {!!_tnc.paraTitle && (
                    <Text style={[styles.paraTitle, rtlText]}>
                      {_tnc.paraTitle}
                    </Text>
                  )}
                  <Text style={[styles.paraData, rtlTextA]}>
                    {_tnc.paraData}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.tnCClose} onPress={handleTnCShow}>
            <Text style={[styles.tnCCloseText, rtlText]}>
              {__("paymentMethodScreen.closeButton", appSettings.lng)}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
      {/* Submit Loading */}
      <Modal animationType="slide" transparent={false} visible={submitLoading}>
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            flex: 1,
            paddingBottom: 50,
            paddingHorizontal: "3%",
          }}
        >
          {((!!uploadProgress && !success && !error) ||
            (!uploadProgress && !success && !error)) && (
            <View style={{ height: 150, width: 150 }}>
              <UploadingIndicator />
            </View>
          )}
          {!!success && !error && (
            <View style={{ height: 150, width: 150 }}>
              <DoneIndicator
                visible={true}
                onDone={handleEventOnAnimationDone}
              />
            </View>
          )}

          {!success && !!error && (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: screenWidth,
                height: screenWidth,
              }}
            >
              <ErrorIndicator
                visible={true}
                onDone={handleEventOnAnimationDone}
              />
              <View style={{ position: "absolute", bottom: "30%" }}>
                <Text style={[styles.text, rtlText]}>
                  {__(
                    "listingFormTexts.uploadErrorNoticeText",
                    appSettings.lng
                  )}
                </Text>
              </View>
            </View>
          )}

          {uploadProgress < 1 && hasImage && !success && !error && (
            <Progress.Bar
              progress={uploadProgress}
              width={200}
              color={COLORS.primary}
              animated={true}
            />
          )}
          {((uploadProgress < 1 && !success && hasImage && !error) ||
            (!success && !hasImage && !error)) && (
            <Text
              style={[
                {
                  fontSize: 15,
                  color: COLORS.text_gray,
                  textAlign: "center",
                  marginTop: 25,
                },
                rtlText,
              ]}
            >
              {__("listingFormTexts.uploadingNoticeText", appSettings.lng)}
            </Text>
          )}

          {!!error && (
            <View
              style={{
                position: "absolute",
                bottom: 20,
              }}
            >
              <AppButton
                title={__(
                  "listingFormTexts.tryAgainButtonTitle",
                  appSettings.lng
                )}
                onPress={() => setSubmitLoading(false)}
              />
            </View>
          )}
        </View>
      </Modal>
      {/* Image Picker for Floor Plan */}
      <Modal animationType="slide" transparent={true} visible={imgModal}>
        <TouchableWithoutFeedback
          onPress={() => setImgModal((prevImgModal) => !prevImgModal)}
        >
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalTitleWrap}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: COLORS.text_gray,
                  marginBottom: 25,
                }}
              >
                {__(
                  "editPersonalDetailScreenTexts.addPhotoTitle",
                  appSettings.lng
                )}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                style={{
                  alignItems: "center",
                  marginHorizontal: 15,
                }}
                onPress={handleFPCameraReq}
              >
                <FontAwesome
                  name="camera-retro"
                  size={40}
                  color={COLORS.primary}
                />
                <Text
                  style={{
                    fontSize: 16,
                    color: COLORS.text_gray,
                    marginVertical: 10,
                  }}
                >
                  {__(
                    "editPersonalDetailScreenTexts.takePhotoButtonTitle",
                    appSettings.lng
                  )}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  alignItems: "center",
                  marginHorizontal: 15,
                }}
                onPress={handleFPGalleryReq}
              >
                <Ionicons name="md-images" size={40} color={COLORS.primary} />
                <Text
                  style={{
                    fontSize: 16,
                    color: COLORS.text_gray,
                    marginVertical: 10,
                  }}
                >
                  {__(
                    "editPersonalDetailScreenTexts.fromGalleryButtonTitle",
                    appSettings.lng
                  )}
                </Text>
              </TouchableOpacity>
            </View>
            <AppTextButton
              style={{ marginTop: 20 }}
              title={__(
                "editPersonalDetailScreenTexts.cancelButtonTitle",
                appSettings.lng
              )}
              onPress={() => {
                setCurrentImgInd(null);
                setImgModal(false);
              }}
            />
          </View>
        </View>
      </Modal>
      {/* Image Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={photoModalVisible}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setPhotoModalVisible((prevMV) => !prevMV);
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
            }}
          />
        </TouchableWithoutFeedback>
        <View style={styles.centeredView}>
          {addingPhoto ? (
            <View style={styles.modalView}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.modalView}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>
                  {__("imageInputTexts.addPhoto", appSettings.lng)}
                </Text>
              </View>
              <View style={styles.contentWrap}>
                <TouchableOpacity
                  style={styles.libraryWrap}
                  onPress={handleImageCameraReq}
                >
                  <CameraButtonIcon
                    fillColor={COLORS.bg_primary}
                    strokeColor={COLORS.primary}
                    iconColor={COLORS.primary}
                  />
                  <Text style={styles.libraryText}>
                    {__("imageInputTexts.takePhoto", appSettings.lng)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.libraryWrap}
                  onPress={handleImageGalleryReq}
                >
                  <GalleryButtonIcon
                    fillColor="#EBF9FF"
                    strokeColor="#2267ED"
                    iconColor="#2267ED"
                  />
                  <Text style={styles.libraryText}>
                    {__("imageInputTexts.fromGallery", appSettings.lng)}
                  </Text>
                </TouchableOpacity>
              </View>
              <AppTextButton
                style={styles.cancelButton}
                title={__("imageInputTexts.cancelButtonTitle", appSettings.lng)}
                onPress={() => {
                  setPhotoModalVisible((prevMV) => !prevMV);
                }}
                textStyle={{ color: COLORS.text_dark, fontWeight: "bold" }}
              />
            </View>
          )}
        </View>
      </Modal>
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
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.text_dark,
    marginBottom: 15,
  },
  contentWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  bHContentWrap: {
    marginHorizontal: "3%",
  },
  bHDayLeftWrap: {
    flex: 1,
  },
  bHDayName: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text_gray,
    textTransform: "capitalize",
  },
  bHDayRightWrap: {
    flex: 3,
  },
  bHDayWrap: {
    flexDirection: "row",
    marginVertical: 8,
  },
  bHToggleBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  bHToggleBtnWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  bHToggleNoteWrap: {
    marginTop: 5,
    marginBottom: 15,
  },
  bHWrap: {
    marginTop: 20,
  },
  btnWrap: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    paddingLeft: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 20,
  },
  commonField_Text: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#b6b6b6",
    borderRadius: 3,
    paddingHorizontal: 5,
    minHeight: 32,
  },

  contactTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingHorizontal: "3%",
  },
  container: {
    marginBottom: screenHeight * 0.1,
    backgroundColor: COLORS.white,
  },
  deviceLocationButton: {
    height: 40,
    width: 40,
    borderRadius: 40 / 2,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 40 * 0.25,
    top: screenWidth * 0.8 - 40 * 1.25,
    zIndex: 5,
  },
  errorMessage: {
    color: COLORS.red,
    fontSize: 12,
  },
  errorWrap: {
    minHeight: 17,
  },
  geoCoderFailMessage: {
    color: COLORS.red,
  },
  geoCoderFailTitle: {
    marginBottom: 20,
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.text_gray,
  },
  geoCoderFailWrap: {
    padding: "3%",
    alignItems: "center",
    width: screenWidth * 0.94,
    height: screenWidth * 0.6,
    borderWidth: 1,
    borderColor: "#b6b6b6",
    borderRadius: 3,
    justifyContent: "center",
  },
  iconWrap: {
    height: 25,
    width: 25,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageInputNotes: {
    backgroundColor: COLORS.bg_primary,
    borderRadius: 3,
    marginTop: 10,
    padding: 10,
  },
  imageInputNotesText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  imageInputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text_dark,
  },
  imageInputTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "3%",
  },
  imageInputWrap: {
    marginBottom: 15,
  },
  inputWrap: {
    paddingHorizontal: "3%",
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text_gray,
    marginBottom: 5,
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
  locationPrimaryPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 3,
    height: 32,
  },
  mapCheckboxWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  mapDisplayInputWrap: {
    paddingHorizontal: "3%",
  },
  mapOverlay: {
    height: screenWidth * 0.8,
    width: "100%",
    backgroundColor: "rgba(0,0,0,.2)",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  mapToggleTitle: {
    paddingLeft: 5,
  },
  mapViewButtonsWrap: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 5,
    right: 10,
    zIndex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 5,
  },
  mapViewButton: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 5,
  },
  mapViewButtonTitle: {
    textTransform: "capitalize",
    fontSize: 12,
    fontWeight: "bold",
  },
  metaField: {
    paddingHorizontal: "3%",
  },
  metaField_Text: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#b6b6b6",
    borderRadius: 3,
    paddingHorizontal: 5,
    minHeight: 32,
  },
  metaField_TextArea: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#b6b6b6",
    borderRadius: 3,
    minHeight: screenHeight / 6.5,
    paddingHorizontal: 5,
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
  openButtonWrap: {
    flexDirection: "row",
    alignItems: "center",
  },

  paraTitle: {
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 5,
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
  priceTypePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    borderWidth: 1,
    borderColor: "#b6b6b6",
    borderRadius: 3,
    height: 32,
  },
  required: {
    color: "#ff6600",
  },
  separator: {
    width: "94%",
    marginVertical: 20,
    marginHorizontal: "3%",
  },
  slotTimeWrap: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  submitButton: {
    width: "100%",
    borderRadius: 3,
    marginTop: 10,
  },
  timeSlot: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 5,
  },
  timeSlotToggleBtnWrap: {
    flexDirection: "row",
    marginTop: 10,
  },
  timeSltEndWrap: {
    flex: 2,
  },
  timeSltStartWrap: {
    flex: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text_dark,
    marginLeft: 10,
  },
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: "3%",
  },
  tnCClose: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    height: screenHeight / 20,
  },
  tnCCloseText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "bold",
  },
  tncModal: {
    backgroundColor: COLORS.white,
    flex: 1,
    alignItems: "center",
  },
  tnCModalContent: {
    marginHorizontal: "3%",
    marginBottom: screenHeight / 20,
  },
  tnCModalText: {
    color: COLORS.text_dark,
    fontSize: 15,
  },
  tncParaWrap: {
    marginBottom: 20,
  },
  tncText: {
    color: "#ff6600",
  },
  tnCToggle: {
    flexDirection: "row",
    paddingHorizontal: screenWidth * 0.03,
    alignItems: "center",
    marginVertical: 10,
  },
  tnCToggleText: {},
});

export default ListingForm;
