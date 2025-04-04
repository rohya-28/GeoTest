'use client';
import dynamic from 'next/dynamic';

const RouteMap = dynamic(() => import('../../component/MapRoute'), { 
  ssr: false,
  loading: () => <p>Loading map...</p>, // Optional: Loading indicator
});

export default function HomePage() {
  const start = { lat: 18.5204, lng: 73.8567 }; // Pune coordinates
  const end = { lat: 19.9975, lng: 73.7898 };   // Nashik coordinates

  return (
    <div className="">
   <RouteMap start={start} end={end} />
</div>

  );
}
