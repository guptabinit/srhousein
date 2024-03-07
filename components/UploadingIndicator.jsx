import React from "react";

//  External Libraries
import LottieView from "lottie-react-native";

const UploadingIndicator = ({ onDone }) => {
  return (
    <LottieView
      autoPlay
      loop={true}
      source={require("../assets/animations/uploading_plain.json")}
      onAnimationFinish={onDone}
    />
  );
};

export default UploadingIndicator;
