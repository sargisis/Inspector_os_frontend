import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { DRONE_MARKER_CONFIG } from "../config/config";

type Props = {
  lat: number;
  lng: number;
  altitude: number;
};

export function DroneMarker({ lat, lng, altitude }: Props) {
  // Scale from altitude
  const scale = 1 + altitude / DRONE_MARKER_CONFIG.scaleDivisor;

  const droneIcon = L.divIcon({
    className: "drone-icon-wrapper",
    html: `
      <div style="
        transform: scale(${scale});
        transition: transform ${DRONE_MARKER_CONFIG.transformDurationMs}ms ease-out;
        width: ${DRONE_MARKER_CONFIG.iconSize}px;
        height: ${DRONE_MARKER_CONFIG.iconSize}px;
        background-image: url('https://cdn-icons-png.flaticon.com/512/2925/2925827.png');
        background-size: contain;
        background-repeat: no-repeat;
      "></div>
    `,
    iconSize: [DRONE_MARKER_CONFIG.iconSize, DRONE_MARKER_CONFIG.iconSize],
    iconAnchor: [DRONE_MARKER_CONFIG.anchor, DRONE_MARKER_CONFIG.anchor],
  });

  return (
    <Marker position={[lat, lng]} icon={droneIcon}>
      <Popup>
        <b>Inspector Drone</b>
        <br />
        Lat: {lat.toFixed(4)} <br />
        Lng: {lng.toFixed(4)} <br />
        Alt: {altitude.toFixed(1)} m
      </Popup>
    </Marker>
  );
}
