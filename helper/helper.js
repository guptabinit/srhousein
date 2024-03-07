// External Libraries
import { decode } from "html-entities";
import { __ } from "../language/stringPicker";

const getPrice = (config, priceData, lng) => {
  const price = priceData?.price || 0;
  const max_price = priceData?.max_price || 0;
  const price_type = priceData?.price_type || "";
  const pricing_type = priceData?.pricing_type || "price";
  const price_units = priceData?.price_units || null;
  const price_unit = priceData?.price_unit || null;
  let display_price_unit = null;
  if (price_units && price_unit) {
    const tempArr = price_units.filter((pus) => pus.id === price_unit);
    if (tempArr?.length) {
      display_price_unit = tempArr[0].short;
    }
  }

  const symbol = getCurrencySymbol(config);

  if (pricing_type === "disabled") return null;
  if (price_type === "on_call") return __("callForPrice", lng || "en");

  if (pricing_type !== "range") {
    let result = "";
    if (config.position === "left") {
      result = symbol + price;
    } else if (config.position === "left_space") {
      result = symbol + " " + price;
    } else if (config.position === "right") {
      result = price + symbol;
    } else {
      result = price + " " + symbol;
    }
    if (price_type === "fixed") {
      if (display_price_unit) {
        return (
          result +
          " " +
          display_price_unit +
          " (" +
          __("fixedPriceLabel", lng) +
          ")"
        );
      } else {
        return result + " (" + __("fixedPriceLabel", lng) + ")";
      }
    } else if (price_type === "negotiable") {
      if (display_price_unit) {
        return (
          result +
          " " +
          display_price_unit +
          " (" +
          __("negotiablePriceLabel", lng) +
          ")"
        );
      } else {
        return result + " (" + __("negotiablePriceLabel", lng) + ")";
      }
    } else {
      if (display_price_unit) {
        return result + " " + display_price_unit;
      } else {
        return result;
      }
    }
  } else {
    let result = "";
    if (config.position === "left") {
      result = symbol + price + " - " + symbol + max_price;
    } else if (config.position === "left_space") {
      result = symbol + " " + price + " - " + symbol + " " + max_price;
    } else if (config.position === "right") {
      result = price + symbol + " - " + max_price + symbol;
    } else {
      result = price + " " + symbol + " - " + max_price + " " + symbol;
    }
    if (price_type === "fixed") {
      if (display_price_unit) {
        return (
          result +
          " " +
          display_price_unit +
          " (" +
          __("fixedPriceLabel", lng) +
          ")"
        );
      } else {
        return result + " (" + __("fixedPriceLabel", lng) + ")";
      }
    } else if (price_type === "negotiable") {
      if (display_price_unit) {
        return (
          result +
          " " +
          display_price_unit +
          " (" +
          __("negotiablePriceLabel", lng) +
          ")"
        );
      } else {
        return result + " (" + __("negotiablePriceLabel", lng) + ")";
      }
    } else {
      if (display_price_unit) {
        return result + " " + display_price_unit;
      } else {
        return result;
      }
    }
  }
};

const getCurrencySymbol = (config) => {
  return decode(config.symbol);
};

const decodeString = (string) => {
  return decode(string);
};

export { decodeString, getCurrencySymbol, getPrice };
