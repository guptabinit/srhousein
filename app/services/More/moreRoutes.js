import { configuration } from "../../../configuration/configuration";

const routes = {
  contact_us: "Contact us",
  about_us: configuration.appName,
  tnc: "TnC",
  pp: "Privacy Policy",
  licenses: "Licenses",
};

export function getMoreRoutes() {
  return routes;
}
