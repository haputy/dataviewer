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

    const map = L.map(mapRef.current).setView([42.3601, -71.0589], 12);
    mapInstanceRef.current = map;

    // Basemap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // WMS Layers
    L.tileLayer.wms('https://dev-geoserver.zartico.com/geoserver/region/wms', {
      layers: 'region:testv3',
      format: 'image/png',
      transparent: true,
      attribution: 'Zartico GeoServer',
    }).addTo(map);

    L.tileLayer.wms('https://dev-geoserver.zartico.com/geoserver/region/wms', {
      layers: 'region:btm',
      format: 'image/png',
      transparent: true,
      attribution: 'Zartico GeoServer',
    }).addTo(map);

    // Click handler
    map.on('click', function (e) {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      const buffer = 0.0000005;

      const minx = lon - buffer;
      const miny = lat - buffer;
      const maxx = lon + buffer;
      const maxy = lat + buffer;

      const bbox = `${minx},${miny},${maxx},${maxy}`;

      const url = `https://dev-geoserver.zartico.com/geoserver/region/ows?` +
        `service=WFS&version=1.0.0&request=GetFeature&` +
        `typeName=region:testv3&` +
        `outputFormat=application/json&` +
        `bbox=${bbox},EPSG:4326&` +
        `maxFeatures=100`;

      fetch(url)
        .then(res => res.json())
        .then(data => {
          setFeatures(data.features || []);
        })
        .catch(err => {
          console.error("WFS fetch error:", err);
          setFeatures([]);
        });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', border: '5px solid red'}}>
      {/* Map container */}
      <div ref={mapRef} style={{ flexGrow: 1, minHeight: 0 }} />
  
      {/* Table */}
      <div style={{
        height: '30vh',
        overflowY: 'auto',
        background: '#f8f9fa',
        borderTop: '2px solid #ccc',
        padding: '10px',
        flexShrink: 0
      }}>
        <h5>Feature Attributes ({features.length})</h5>
        {features.length === 0 ? (
          <p>No features selected.</p>
        ) : (
          <table className="table table-sm table-bordered table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Top Category</th>
                <th>Sub Category</th>
                <th>POI Tag</th>
                <th>NAICS</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, idx) => (
                <tr key={idx}>
                  <td>{f.properties.location_name}</td>
                  <td>{f.properties.top_category}</td>
                  <td>{f.properties.sub_category}</td>
                  <td>{f.properties.poi_tag}</td>
                  <td>{f.properties.naics_code}</td>
                  <td>{f.properties.flag}</td>
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
