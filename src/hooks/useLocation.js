import { useState, useEffect } from 'react';
import { supabase, hasSupabaseConfig } from '../supabaseClient';

export function useLocation(userId) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !hasSupabaseConfig || !supabase || userId === 'offline-guest') return;

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const handleSuccess = async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      setLocation({ lat, lon });

      // Update profile with location
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ 
          latitude: lat, 
          longitude: lon, 
          location_updated_at: new Date().toISOString() 
        })
        .eq('id', userId);
        
      if (dbError) console.error("Error saving location:", dbError);
    };

    const handleError = (error) => {
      setError(error.message);
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError);
    
    // Optional: watch position if we want live updates
    // const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError);
    // return () => navigator.geolocation.clearWatch(watchId);
  }, [userId]);

  return { location, error };
}
