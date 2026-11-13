import Alpine from "alpinejs";
import "bootstrap/dist/css/bootstrap.min.css";
import "ol/ol.css";
import "./index.css";
import flightDashboard from "./dashboard/flightDashboard.js";

Alpine.data("flightDashboard", flightDashboard);

window.Alpine = Alpine;
Alpine.start();
