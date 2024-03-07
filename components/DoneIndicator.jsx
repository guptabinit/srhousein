import React from "react";

// External Libraries
import LottieView from "lottie-react-native";

const DoneIndicator = ({ visible = false, onDone }) => {
  if (!visible) return null;
  return (
    <LottieView
      autoPlay
      loop={false}
      source={require("../assets/animations/done_plain.json")}
      onAnimationFinish={onDone}
    />
  );
};

export default DoneIndicator;
