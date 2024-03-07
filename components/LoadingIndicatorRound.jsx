import React from "react";

// External Libraries
import LottieView from "lottie-react-native";

const LoadingIndicatorRound = ({ visible = false, style }) => {
  if (!visible) return null;
  return (
    <LottieView
      autoPlay
      loop
      source={require("../assets/animations/loading_round.json")}
      style={style}
    />
  );
};

export default LoadingIndicatorRound;
