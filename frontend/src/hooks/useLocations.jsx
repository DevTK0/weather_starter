import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { listLocations, createLocation as apiCreateLocation, refreshLocation as apiRefreshLocation } from '../api/locations';
import { createLogger } from '../utils/logger';

const logger = createLogger('hooks.useLocations');

const LocationsContext = createContext(null);

export function LocationsProvider({ children }) {
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const data = await listLocations();
      setLocations(data.locations);
      setError(null);
      logger.info('locations_loaded', { count: data.locations.length });
    } catch (err) {
      setError(err);
      logger.error('locations_load_failed', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <LocationsContext.Provider value={{ locations, isLoading, error, reload }}>
      {children}
    </LocationsContext.Provider>
  );
}

export function useLocations() {
  return useContext(LocationsContext);
}

export function useCreateLocation() {
  const { reload } = useContext(LocationsContext);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const create = async (payload) => {
    setIsPending(true);
    setError(null);
    logger.info('location_create_started', {
      latitude: payload.latitude,
      longitude: payload.longitude,
    });
    try {
      await apiCreateLocation(payload);
      logger.info('location_created', {
        latitude: payload.latitude,
        longitude: payload.longitude,
      });
      await reload();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { create, isPending, error };
}

export function useRefreshLocation() {
  const { reload } = useContext(LocationsContext);
  const [isPending, setIsPending] = useState(false);
  const [refreshingId, setRefreshingId] = useState(null);
  const [error, setError] = useState(null);

  const refresh = async (locationId) => {
    setIsPending(true);
    setRefreshingId(locationId);
    setError(null);
    logger.info('refresh_started', { location_id: locationId });
    try {
      await apiRefreshLocation(locationId);
      logger.info('refresh_completed', { location_id: locationId });
      await reload();
    } catch (err) {
      setError(err);
      logger.error('refresh_failed', { location_id: locationId, error: err.message });
    } finally {
      setIsPending(false);
      setRefreshingId(null);
    }
  };

  return { refresh, isPending, refreshingId, error };
}
