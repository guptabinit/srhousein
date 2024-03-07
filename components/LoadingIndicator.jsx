import React from "react";

// External Libraries
import LottieView from "lottie-react-native";

const LoadingIndicator = ({ visible = false, style }) => {
  if (!visible) return null;
  return (
    <LottieView
      autoPlay
      loop
      source={require("../assets/animations/loading-dot-horizontal.json")}
      style={style}
    />
  );
};

export default LoadingIndicator;
