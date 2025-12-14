import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import { useEffect } from "react";
import { DroneMarker } from "./DroneMarker";
import { BATTERY_CONFIG, MAP_VIEW_CONFIG, TRAIL_CONFIG } from "../config/config";

type Props = {
  lat: number;
  lng: number;
  trail: [number, number][];
  battery: number;
  follow: boolean;
  risk: number;
  altitude: number;
  gpsDrift: boolean;   // NEW
};

// один контроллер: и follow, и zoom
function FollowAndZoomController({
  lat,
  lng,
  zoom,
  follow,
}: {
  lat: number;
  lng: number;
  zoom: number;
  follow: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!follow) return;

    map.flyTo([lat, lng], zoom, {
      animate: true,
      duration: MAP_VIEW_CONFIG.flyToDurationSec,
    });
  }, [lat, lng, zoom, follow, map]);

  return null;
}

export function MapView({
  lat,
  lng,
  trail,
  battery,
  follow,
  risk,
  altitude,
  gpsDrift,
}: Props) {

  // ---- 1) Высота → динамический зум ----
  const zoomRule =
    MAP_VIEW_CONFIG.zoomByAltitude.find(({ maxAltitude }) => altitude < maxAltitude) ??
    MAP_VIEW_CONFIG.zoomByAltitude[MAP_VIEW_CONFIG.zoomByAltitude.length - 1];
  const zoom = zoomRule.zoom;

  // ---- 2) GPS Drift → добавляем шум ----
  const driftedLat = gpsDrift
    ? lat + (Math.random() - 0.5) * MAP_VIEW_CONFIG.driftMagnitude
    : lat;
  const driftedLng = gpsDrift
    ? lng + (Math.random() - 0.5) * MAP_VIEW_CONFIG.driftMagnitude
    : lng;

  return (
    <div className="map-root">
      <MapContainer
        center={[driftedLat, driftedLng]}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Follow + Zoom controller */}
        <FollowAndZoomController
          lat={driftedLat}
          lng={driftedLng}
          zoom={zoom}
          follow={follow}
        />

        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Трек */}
        {trail.length >= TRAIL_CONFIG.minPointsToRender && (
          <Polyline
            positions={trail}
            pathOptions={{
              color:
                MAP_VIEW_CONFIG.trailStyle.colors[risk] ??
                MAP_VIEW_CONFIG.trailStyle.colors[0],
              weight: MAP_VIEW_CONFIG.trailStyle.weight,
              opacity: MAP_VIEW_CONFIG.trailStyle.opacity,
            }}
          />
        )}

        {/* Маркер — если батарея есть */}
        {battery > BATTERY_CONFIG.statusThresholds.offline && (
          <DroneMarker
            lat={driftedLat}
            lng={driftedLng}
            altitude={altitude}
          />
        )}
      </MapContainer>
    </div>
  );
}
