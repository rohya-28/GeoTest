'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface Point {
  lat: number;
  lng: number;
}

interface RouteMapProps {
  start: Point;
  end: Point;
}

export default function RouteMap({ start, end }: RouteMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const [speed, setSpeed] = useState(3);
  const [routeCoordinates, setRouteCoordinates] = useState<L.LatLng[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);
  const currentIndexRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!mapRef.current) {
        mapRef.current = L.map('map').setView([start.lat, start.lng], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapRef.current);
      }

      if (routingControlRef.current) {
        try {
          routingControlRef.current.getPlan().setWaypoints([]);
          mapRef.current?.removeControl(routingControlRef.current);
          routingControlRef.current = null; // Important: Reset the ref after removal
        } catch (err) {
          console.warn('Error removing routing control:', err);
        }
      }

      const vehicleIcon = new L.Icon({
        iconUrl: '/car.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (markerRef.current) {
        markerRef.current.remove();
      }

      markerRef.current = L.marker([start.lat, start.lng], { icon: vehicleIcon }).addTo(mapRef.current);

      const routingControl = L.Routing.control({
        waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
        routeWhileDragging: false,
        lineOptions: {
          styles: [{ color: 'blue', opacity: 0.7, weight: 5 }],
        },
        createMarker: () => null,
        fitSelectedRoutes: true,
        show: false,
      }).addTo(mapRef.current);

      routingControlRef.current = routingControl; // Assign the created control to the ref

      routingControl.on('routesfound', (e: any) => {
        if (e.routes && e.routes.length > 0) {
          const route = e.routes[0].coordinates;
          setRouteCoordinates(route);
          currentIndexRef.current = 0;
          animationStartTimeRef.current = null;
        } else {
          setRouteCoordinates([]); // Clear previous route if no new route is found
        }
      });

      return () => {
        if (mapRef.current) {
          if (routingControlRef.current) {
            try {
              routingControlRef.current.getPlan().setWaypoints([]);
              mapRef.current.removeControl(routingControlRef.current);
              routingControlRef.current = null;
            } catch (err) {
              console.warn('Error during cleanup:', err);
            }
          }
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, [start, end]);

  useEffect(() => {
    if (mapRef.current && markerRef.current && routeCoordinates.length > 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const animateMarker = (timestamp: number) => {
        if (!animationStartTimeRef.current) animationStartTimeRef.current = timestamp;
        const elapsed = timestamp - animationStartTimeRef.current;
        const actualSpeed = Math.pow(speed, 2) * 2; // Exponential speed scaling
        const distance = (actualSpeed / 1000) * elapsed;
        let moved = 0;

        while (moved < distance && currentIndexRef.current < routeCoordinates.length - 1) {
          moved += L.latLng(routeCoordinates[currentIndexRef.current]).distanceTo(
            L.latLng(routeCoordinates[currentIndexRef.current + 1])
          );
          currentIndexRef.current++;
        }

        if (currentIndexRef.current < routeCoordinates.length) {
          markerRef.current?.setLatLng(routeCoordinates[currentIndexRef.current]);
          animationStartTimeRef.current = timestamp;
          animationFrameRef.current = requestAnimationFrame(animateMarker);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animateMarker);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [speed, routeCoordinates]);

  return (
    <div className=''>
      <div id="map" style={{ height: '100vh', width: '100%', zIndex: '1' }} />
      <div className='absolute bottom-0 w-full mb-8 z-10 flex justify-center items-center '>
        <div className='w-[700px] h-[75px] rounded-lg text-black  bg-white  flex justify-center items-center'>
          <label>Speed: {speed}</label>
          <input
            type='range'
            min='1'
            max='5'
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}