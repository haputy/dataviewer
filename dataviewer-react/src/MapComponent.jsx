import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const MapComponent = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [features, setFeatures] = useState([]);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    const map = L.map(mapRef.current).setView(
      [40.63480153926745, -109.03928733785676],
      8
    );
    mapInstanceRef.current = map;

    // Define basemaps
    const mapboxLayer = L.tileLayer(
      'https://api.mapbox.com/styles/v1/haputy/cm8g29e6v000v01sa4om903i0/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaGFwdXR5IiwiYSI6ImNqZGNleTVnYjBpZDIycXM0b2ptdTVpZnIifQ.SQ8jV9GmA78fpzumnn23-Q',
      {
        attribution: '© OpenStreetMap, © Mapbox',
        tileSize: 512,
        zoomOffset: -1,
      }
    );



    const mapboxLayerSat = L.tileLayer(
      'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiaGFwdXR5IiwiYSI6ImNqZGNleTVnYjBpZDIycXM0b2ptdTVpZnIifQ.SQ8jV9GmA78fpzumnn23-Q',
      {
        attribution: '© OpenStreetMap, © Mapbox',
        tileSize: 512,
        zoomOffset: -1,
      }
    );

    // Add default base layer
    mapboxLayer.addTo(map);

    // Define WMS overlay
    const wmsLayer = L.tileLayer.wms(
      'https://dev-geoserver.zartico.com/geoserver/region/wms',
      {
        layers: 'region:butler_final',
        format: 'image/png',
        transparent: true,
        attribution: 'Zartico GeoServer',
      }
    );
    wmsLayer.addTo(map);

    // Add layer controls
    L.control
      .layers(
        {
          Mapbox: mapboxLayer,
          'Satellite': mapboxLayerSat,
        },
        {
          'Zartico WMS': wmsLayer,
        }
      )
      .addTo(map);

    // Click handler for WFS fetch
    map.on('click', function (e) {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      const buffer = 0.0000005;

      const minx = lon - buffer;
      const miny = lat - buffer;
      const maxx = lon + buffer;
      const maxy = lat + buffer;

      const bbox = `${minx},${miny},${maxx},${maxy}`;

      const url =
        `https://dev-geoserver.zartico.com/geoserver/region/ows?` +
        `service=WFS&version=1.0.0&request=GetFeature&` +
        `typeName=region:butler_final&` +
        `outputFormat=application/json&` +
        `bbox=${bbox},EPSG:4326&`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          setFeatures(data.features || []);
        })
        .catch((err) => {
          console.error('WFS fetch error:', err);
          setFeatures([]);
        });
    });

    // Cleanup on unmount
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Map container */}
      <div ref={mapRef} style={{ flexGrow: 1, minHeight: 0 }} />

      {/* Table */}
      <div
        style={{
          height: '30vh',
          overflowY: 'auto',
          background: '#f8f9fa',
          borderTop: '2px solid #ccc',
          padding: '10px',
          flexShrink: 0,
        }}
      >
        <h5>Feature Attributes ({features.length})</h5>
        {features.length === 0 ? (
          <p>No features selected.</p>
        ) : (
          <table className="table table-sm table-bordered table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>ID</th>
                <th>Sub Category</th>
                <th>POI Tag</th>
                <th>NAICS</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, idx) => (
                <tr key={idx}>
                  <td>{f.properties.name}</td>
                  <td>{f.properties.id}</td>
                  <td>{f.properties.sub_category}</td>
                  <td>{f.properties.poi_tag}</td>
                  <td>{f.properties.f_naics_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MapComponent;
