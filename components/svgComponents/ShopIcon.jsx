import * as React from "react";
import Svg, { Path, G } from "react-native-svg";

const ShopIcon = (props) => (
  <Svg
    width={18}
    height={18}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="M9 9c1.373 0 2.385-1.117 2.25-2.49l-.495-5.01H7.253L6.75 6.51C6.615 7.883 7.628 9 9 9Z"
      stroke={props.fillColor}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.732 9c1.515 0 2.625-1.23 2.475-2.737l-.21-2.063c-.27-1.95-1.02-2.7-2.985-2.7h-2.287l.525 5.258C11.377 7.995 12.495 9 13.732 9ZM4.23 9c1.238 0 2.356-1.005 2.476-2.242L6.87 5.1l.36-3.6H4.943c-1.965 0-2.715.75-2.985 2.7l-.202 2.063C1.606 7.77 2.716 9 4.23 9Z"
      stroke={props.fillColor}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <G
      opacity={0.4}
      stroke={props.fillColor}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M2.258 8.415v3.368c0 3.367 1.35 4.717 4.717 4.717h4.043c3.367 0 4.717-1.35 4.717-4.717V8.415" />
      <Path d="M9 12.75c-1.253 0-1.875.623-1.875 1.875V16.5h3.75v-1.875c0-1.252-.623-1.875-1.875-1.875Z" />
    </G>
  </Svg>
);

export default ShopIcon;
