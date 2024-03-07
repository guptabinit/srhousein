import React from "react";

// External Libraries
import LottieView from "lottie-react-native";

const ErrorIndicator = ({ visible = false, onDone }) => {
  if (!visible) return null;
  return (
    <LottieView
      autoPlay
      loop={false}
      source={require("../assets/animations/error.json")}
      onAnimationFinish={onDone}
    />
  );
};

export default ErrorIndicator;
