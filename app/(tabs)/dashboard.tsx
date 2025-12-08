import { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { Redirect } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import { BUSES, MOCK_STOPS, MOCK_BUSES } from "../services/busServer.mock"; // Keep for fallback
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { formatETA, haversineDistance } from "../helpers/eta";
import { StopMarker } from "../components/StopMarker";
import { generateBusColors } from "../helpers/busColor";
import { useAddress } from "../hooks/useAddress";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
// const API_URL = process.env.EXPO_PUBLIC_API_URL; 
import Constants from "expo-constants";
import { AddressDisplay } from "../components/AddressDisplay";
import { NearestStopAddress } from "../components/NearestStopAddress";

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl as string;
// Your Laravel API configuration - UPDATE THIS!
// const API_BASE_URL = "http://192.168.1.110:8000/api"; // Update with your actual Laravel URL
const API_TIMEOUT = 10000; // 10 seconds

export default function DashboardScreen() {
  const { user, loading: authLoading } = useAuth();
  const mapRef = useRef<MapView>(null);

  // Separate states for Laravel API
  const [allBuses, setAllBuses] = useState<Array<any>>([]); // From /api/buses
  const [stops, setStops] = useState<Array<any>>([]); // From /api/stops
  const [activeBuses, setActiveBuses] = useState<{ [key: number]: any }>({}); // Loaded bus data
  const [loadingBuses, setLoadingBuses] = useState<{ [key: number]: boolean }>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [activeBusId, setActiveBusId] = useState<number | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [shouldAutoCenter, setShouldAutoCenter] = useState(true);
  const [showInfoCard, setShowInfoCard] = useState(true);

  const userSelectedBus = useRef(false);

  // Fetch all registered buses from Laravel API - SIMPLIFIED
  const fetchBusList = useCallback(async () => {
    try {
      setApiError(null);
      console.log('Fetching bus list from:', `${API_BASE_URL}/api/buses`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
      
      const response = await fetch(`${API_BASE_URL}/api/buses`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Bus list response:', data);
      
      // Your controller returns the data directly as array
      let busesArray: any[] = [];
      
      if (Array.isArray(data)) {
        // Direct array response from your controller
        busesArray = data.map(bus => ({
          id: bus.id,
          bus_name: bus.bus_name,
          driver_name: bus.driver_name,
          license_plate: bus.license_plate,
          is_active: bus.is_active
        }));
      } else if (data.data && Array.isArray(data.data)) {
        // Laravel API Resource format
        busesArray = data.data;
      } else {
        throw new Error('Invalid response format from API');
      }
      
      setAllBuses(busesArray);
      
      // Auto-select first active bus if none selected
      if (busesArray.length > 0 && !activeBusId && !userSelectedBus.current) {
        const firstBus = busesArray.find(bus => bus.is_active !== false) || busesArray[0];
        if (firstBus) {
          setActiveBusId(firstBus.id);
        }
      }
      
    } catch (error: any) {
      console.error('Error fetching bus list from API:', error);
      setApiError(`Failed to load buses: ${error.message}`);
      
      // Fallback to mock data
      console.log('Using mock data as fallback');
      setAllBuses(BUSES.map(bus => ({
        id: bus.id,
        bus_name: bus.bus_name,
        driver_name: null,
        license_plate: null,
        is_active: true
      })));
      
      if (BUSES.length > 0 && !activeBusId && !userSelectedBus.current) {
        setActiveBusId(BUSES[0].id);
      }
    } finally {
      setInitialLoading(false);
    }
  }, [activeBusId]);

  // Fetch bus stops from Laravel API
  const fetchStops = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stops`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Your controller should return array directly
        let stopsArray: any[] = [];
        
        if (Array.isArray(data)) {
          stopsArray = data.map(stop => ({
            id: stop.id,
            name: stop.name,
            lat: parseFloat(stop.latitude),
            long: parseFloat(stop.longitude)
          }));
        } else if (data.data && Array.isArray(data.data)) {
          stopsArray = data.data.map((stop: any) => ({
            id: stop.id,
            name: stop.name,
            lat: parseFloat(stop.latitude),
            long: parseFloat(stop.longitude)
          }));
        } else {
          throw new Error('Invalid stops response format');
        }
        
        setStops(stopsArray);
      } else {
        setStops(MOCK_STOPS);
      }
    } catch (error) {
      console.error('Error fetching stops:', error);
      setStops(MOCK_STOPS);
    }
  }, []);

  // Fetch detailed tracking data for a specific bus - UPDATED
const fetchBusData = useCallback(async (busId: number, forceRefresh = false) => {
  // Don't fetch if already loading
  if (loadingBuses[busId] && !forceRefresh) return;
  
  try {
    setLoadingBuses(prev => ({ ...prev, [busId]: true }));
    setApiError(null);
    
    console.log(`Fetching tracking data for bus ${busId} from API`);
    
    // Try Laravel API endpoint first - using your /tracking endpoint
    const response = await fetch(`${API_BASE_URL}/api/buses/${busId}/tracking`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    
    let busData;
    let fromApi = false;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`RAW API response for bus ${busId}:`, JSON.stringify(data, null, 2));
      console.log(`API response for bus ${busId}:`, data);
      
      // Your controller returns {success, data, message} format
      if (data.success && data.data) {
        busData = data.data;
        fromApi = true;
      } else {
        throw new Error('Invalid API response format');
      }
    } else {
      // If API fails, use basic bus info from allBuses
      const busInfo = allBuses.find(b => b.id === busId);
      busData = busInfo || { id: busId };
    }
    
    // Get the path_travelled array from API response
    const pathTravelled = busData.path_travelled || busData.path || [];
    
    // Determine current position: either from API's current_position OR the last path point
    let currentPosition;
    
    if (busData.current_position && busData.current_position.lat && busData.current_position.long) {
      // Use the current_position from API if available and has valid coordinates
      currentPosition = {
        lat: parseFloat(busData.current_position.lat) || 14.683015,
        long: parseFloat(busData.current_position.long) || 120.538018,
        speed: parseFloat(busData.current_position.speed) || 0,
        passenger_count: busData.current_position.passenger_count || 0
      };
    } else if (pathTravelled.length > 0) {
      // Otherwise, use the last point from path_travelled
      const lastPoint = pathTravelled[pathTravelled.length - 1];
      currentPosition = {
        lat: parseFloat(lastPoint.lat || lastPoint.latitude || 14.683015),
        long: parseFloat(lastPoint.long || lastPoint.longitude || 120.538018),
        speed: parseFloat(lastPoint.speed || 0),
        passenger_count: lastPoint.passenger_count || lastPoint.total_passenger || 0
      };
    } else {
      // Fallback if no data
      currentPosition = {
        lat: busData.latitude || 14.683015,
        long: busData.longitude || 120.538018,
        speed: busData.speed || 0,
        passenger_count: busData.passenger_count || 0
      };
    }
    
    // Normalize path points to ensure consistent structure
    const normalizedPathTravelled = pathTravelled.map(point => ({
      lat: parseFloat(point.lat || point.latitude || 14.683015),
      long: parseFloat(point.long || point.longitude || 120.538018),
      speed: parseFloat(point.speed || 0),
      passenger_count: point.passenger_count || point.total_passenger || 0
    }));
    
    // Handle null created_at safely
    const safeLastUpdated = busData.updated_at || busData.last_updated || new Date().toISOString();
    
    const processedBus = {
      id: busData.id || busId,
      bus_name: busData.bus_name || `Bus ${busId}`,
      driver_name: busData.driver_name || "Not assigned",
      license_plate: busData.license_plate || "N/A",
      pathTravelled: normalizedPathTravelled,
      currentPosition: currentPosition,
      isActive: busData.is_active !== false,
      lastUpdated: safeLastUpdated,
      fromApi: fromApi,
      error: false,
      message: 'Data loaded successfully'
    };
    
    console.log(`Processed bus ${busId}:`, {
      id: processedBus.id,
      pathTravelledCount: processedBus.pathTravelled.length,
      currentPosition: processedBus.currentPosition,
      lastUpdated: processedBus.lastUpdated,
      hasCurrentPositionFromApi: !!busData.current_position,
      usedLastPathPoint: !busData.current_position && pathTravelled.length > 0
    });
    setActiveBuses(prev => ({
      ...prev,
      [busId]: processedBus
    }));
    
  } catch (error) {
    console.error(`Error fetching API data for bus ${busId}:`, error);
    
    // Fallback to mock data
    const mockBusData = MOCK_BUSES.find(bus => bus.id === busId);
    
    if (mockBusData) {
      const pathTravelled = mockBusData.path || [];
      
      // Normalize mock path points
      const normalizedPathTravelled = pathTravelled.map(point => ({
        lat: point.lat || 14.683015,
        long: point.long || 120.538018,
        speed: point.speed || 0,
        passenger_count: point.total_passenger || 0
      }));
      
      // Use the last path point as current position for mock data too
      const currentPosition = normalizedPathTravelled.length > 0 ? 
        normalizedPathTravelled[normalizedPathTravelled.length - 1] : {
          lat: 14.683015,
          long: 120.538018,
          speed: 0,
          passenger_count: 0
        };
      
      const processedBus = {
        id: mockBusData.id,
        bus_name: mockBusData.bus_name,
        driver_name: "Driver " + mockBusData.id,
        license_plate: "ABC-" + mockBusData.id,
        pathTravelled: normalizedPathTravelled,
        currentPosition: currentPosition,
        isActive: true,
        lastUpdated: new Date().toISOString(),
        fromApi: false,
        error: false,
        message: 'Using mock data'
      };
      
      setActiveBuses(prev => ({
        ...prev,
        [busId]: processedBus
      }));
    } else {
      // Create offline bus entry
      const basicBus = allBuses.find(bus => bus.id === busId);
      
      setActiveBuses(prev => ({
        ...prev,
        [busId]: {
          id: busId,
          bus_name: basicBus?.bus_name || `Bus ${busId}`,
          driver_name: basicBus?.driver_name || "Not assigned",
          license_plate: basicBus?.license_plate || "N/A",
          pathTravelled: [],
          currentPosition: {
            lat: 14.683015,
            long: 120.538018,
            speed: 0,
            passenger_count: 0
          },
          isActive: false,
          lastUpdated: new Date().toISOString(),
          error: true,
          message: 'No tracking data available',
          fromApi: false
        }
      }));
    }
  } finally {
    setLoadingBuses(prev => ({ ...prev, [busId]: false }));
  }
}, [allBuses]);

  // Initial data loading
  useEffect(() => {
    fetchBusList();
    fetchStops();
  }, [fetchBusList, fetchStops]);

  // Load data for active bus when bus list is loaded
  useEffect(() => {
    if (activeBusId && !initialLoading && !activeBuses[activeBusId]) {
      fetchBusData(activeBusId);
    }
  }, [activeBusId, initialLoading, activeBuses, fetchBusData]);

  // Poll active buses for updates
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(activeBuses).forEach(busId => {
        const bus = activeBuses[parseInt(busId)];
        if (bus?.isActive && !bus.error) {
          fetchBusData(parseInt(busId), true); // Force refresh
        }
      });
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [activeBuses, fetchBusData]);

  // Handle bus selection
  const handleBusSelect = useCallback((busId: number) => {
    setShouldAutoCenter(true);
    setActiveBusId(busId);
    userSelectedBus.current = true;
    
    // Fetch data for selected bus if not already loaded or needs refresh
    if (!activeBuses[busId] || activeBuses[busId]?.error) {
      fetchBusData(busId);
    }
  }, [activeBuses, fetchBusData]);

  // Auto-center when bus data is available
  useEffect(() => {
    if (!shouldAutoCenter) return;
    if (!activeBusId || !mapRef.current || !isMapReady) return;
    
    const bus = activeBuses[activeBusId];
    if (!bus || !bus.currentPosition || !bus.isActive) return;

    mapRef.current.animateToRegion(
      {
        latitude: bus.currentPosition.lat,
        longitude: bus.currentPosition.long,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      500
    );
  }, [activeBusId, isMapReady, shouldAutoCenter, activeBuses]);

  const handleCenterOnBus = useCallback(() => {
    if (!activeBusId || !mapRef.current) return;
    
    const bus = activeBuses[activeBusId];
    if (!bus || !bus.currentPosition || !bus.isActive) return;

    setShouldAutoCenter(true);
    mapRef.current.animateToRegion(
      {
        latitude: bus.currentPosition.lat,
        longitude: bus.currentPosition.long,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      500
    );
  }, [activeBusId, activeBuses]);

  // Refresh all data
  const handleRefresh = useCallback(() => {
    setApiError(null);
    fetchBusList();
    fetchStops();
    
    if (activeBusId) {
      fetchBusData(activeBusId, true);
    }
  }, [activeBusId, fetchBusList, fetchStops, fetchBusData]);

  if (authLoading || initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>
            {initialLoading ? "Connecting to server..." : "Loading..."}
          </Text>
          {apiError && (
            <Text style={styles.errorTextSmall}>{apiError}</Text>
          )}
        </View>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  const busColors = generateBusColors(allBuses);
  const activeBus = activeBusId ? activeBuses[activeBusId] : null;
  // const isLoading = activeBusId && loadingBuses[activeBusId];

  // Calculate ETA if bus is active
  let nearestStop = null;
  let etaToNextStop = "N/A";
  // let nearestStopAddress = "N/A"

  if (activeBus && activeBus.isActive && stops.length > 0) {
    const { lat, long, speed } = activeBus.currentPosition || {};
    
    if (lat && long) {
      let minDist = Infinity;
      stops.forEach((stop) => {
        const dist = haversineDistance(lat, long, stop.lat, stop.long);
        if (dist < minDist) {
          minDist = dist;
          nearestStop = stop;
        }
      });

      if (speed && speed > 0) {
        const hours = minDist / speed;
        const minutes = hours * 60;
        etaToNextStop = formatETA(minutes);
      } else {
        etaToNextStop = "Not moving";
      }
    }
  }

  const initialRegion = {
    latitude: 14.683015,
    longitude: 120.538018,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.minimalHeader} pointerEvents="box-none">
          <View style={styles.headerLeft}>
            <View style={styles.userIcon}>
              <Ionicons name="person-circle" size={36} color="#22c55e" />
            </View>
            <View>
              <Text style={styles.headerGreeting}>Hello,</Text>
              <Text style={styles.headerName}>
                {user?.name?.split(" ")[0] || "User"}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {apiError && (
              <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                <Ionicons name="refresh" size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
            {/* <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#9ca3af" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity> */}
          </View>
        </View>

        {/* API STATUS INDICATOR */}
        {apiError && (
          <View style={styles.apiStatusContainer}>
            <Ionicons name="warning" size={16} color="#ef4444" />
            <Text style={styles.apiStatusText}>{apiError}</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Ionicons name="refresh" size={16} color="#22c55e" />
            </TouchableOpacity>
          </View>
        )}

        {/* DEBUG INFO */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Buses: {allBuses.length} | Stops: {stops.length} | Active: {activeBusId}
          </Text>
        </View>

        {/* SEGMENTED CONTROL */}
        <View style={[styles.segmentedControlContainer]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.segmentedControl}
          >
            {allBuses.map((bus) => {
              const isActive = activeBusId === bus.id;
              const color = busColors[bus.id] || "#22c55e";
              const busData = activeBuses[bus.id];
              const isBusLoaded = !!busData;
              const isBusActive = busData?.isActive;
              const isLoadingBus = loadingBuses[bus.id];
              const hasError = busData?.error;
              const fromApi = busData?.fromApi;

              return (
                <TouchableOpacity
                  key={bus.id}
                  onPress={() => handleBusSelect(bus.id)}
                  style={[
                    styles.segmentButton,
                    !isBusLoaded && styles.notLoadedButton,
                    hasError && styles.errorButton,
                    fromApi === false && styles.mockDataButton,
                    isActive && [
                      styles.activeSegmentButton,
                      { backgroundColor: color + "20", borderColor: color },
                    ],
                  ]}
                  disabled={isLoadingBus}
                >
                  <View
                      style={[
                        styles.segmentDot,
                        { 
                          backgroundColor: color,
                          opacity: isBusLoaded && !isBusActive ? 0.3 : 1
                        }
                      ]}
                    />
                  
                  <Text
                    style={[
                      styles.segmentText,
                      isActive
                        ? styles.activeSegmentText
                        : styles.inactiveSegmentText,
                      !isBusLoaded && styles.notLoadedText,
                      hasError && styles.errorTextStyle,
                      fromApi === false && styles.mockDataText,
                    ]}
                    numberOfLines={1}
                  >
                    {bus.bus_name}
                    {isBusLoaded && !isBusActive && " (Off)"}
                    {hasError && " (!)"}
                    {fromApi === false && " [M]"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* MAP */}
        <View style={styles.mapContainer}>
          {!isMapReady && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.mapLoadingText}>Loading map...</Text>
            </View>
          )}

          {/* BUS DATA LOADING OVERLAY */}
          {/* {isLoading && (
            <View style={styles.busLoadingOverlay}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.busLoadingText}>
                Loading {activeBus?.bus_name || "bus"} data...
              </Text>
            </View>
          )} */}

          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            onMapReady={() => setIsMapReady(true)}
            zoomEnabled
            scrollEnabled
            pitchEnabled
            rotateEnabled
            onPanDrag={() => setShouldAutoCenter(false)}
            onRegionChange={() => setShouldAutoCenter(false)}
          >
            {/* BUS PATH */}
            {activeBus?.isActive && activeBus?.pathTravelled?.length > 1 && (
              <Polyline
                coordinates={activeBus.pathTravelled
                  .filter(p => p.lat && p.long)
                  .map((p) => ({
                    latitude: p.lat,
                    longitude: p.long,
                  }))}
                strokeColor={busColors[activeBus.id] || "#22c55e"}
                strokeWidth={4}
                strokeOpacity={0.7}
              />
            )}

            {/* BUS MARKER */}
            {activeBus?.isActive && activeBus?.currentPosition && (
              <Marker
                coordinate={{
                  latitude: activeBus.currentPosition.lat,
                  longitude: activeBus.currentPosition.long,
                }}
                title={activeBus.bus_name}
                description={`${activeBus.currentPosition.passenger_count || 0} passengers`}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={styles.activeBusMarker}>
                  <View
                    style={[
                      styles.busIconContainer,
                      { backgroundColor: busColors[activeBus.id] || "#22c55e" },
                    ]}
                  >
                    <Ionicons name="bus" size={24} color="white" />
                  </View>
                  {activeBus.fromApi === false && (
                    <View style={styles.mockDataBadge}>
                      <Text style={styles.mockDataBadgeText}>M</Text>
                    </View>
                  )}
                </View>
              </Marker>
            )}

            {/* STOPS */}
            {stops.map((stop) => (
              <StopMarker key={stop.id} stop={stop} />
            ))}
          </MapView>

          {/* LOCATE BUTTON */}
          {activeBus?.isActive && (
            <View style={styles.fabContainer}>
              <TouchableOpacity
                style={styles.fab}
                onPress={handleCenterOnBus}
              >
                <Ionicons name="locate" size={22} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* REFRESH BUTTON */}
          <TouchableOpacity
            style={[styles.fab, styles.refreshFab]}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={22} color="white" />
          </TouchableOpacity>

          {/* INFO CARD */}
          {showInfoCard && activeBus && (
            <View style={styles.modernInfoCard}>
              <View style={styles.cardHandle}>
                <View style={styles.handleBar} />
              </View>

              <View style={styles.cardHeader}>
                <View style={styles.busInfo}>
                  <View
                    style={[
                      styles.busColorIndicator,
                      {
                        backgroundColor: busColors[activeBus.id] || "#22c55e",
                        opacity: activeBus.isActive ? 1 : 0.5,
                      },
                    ]}
                  />
                  <View>
                    <Text style={styles.busTitle}>
                      {activeBus.bus_name}
                      {!activeBus.isActive && " (Offline)"}
                      {activeBus.fromApi === false && " [Mock Data]"}
                    </Text>
                    <Text style={styles.busSubtitle}>
                      {activeBus.driver_name || "Not assigned"} •{" "}
                      {activeBus.license_plate || "N/A"}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardHeaderRight}>
                  {activeBus.fromApi === false ? (
                    <View style={styles.mockBadge}>
                      <Ionicons name="desktop" size={12} color="#9ca3af" />
                      <Text style={styles.mockBadgeText}>Mock</Text>
                    </View>
                  ) : activeBus.isActive ? (
                    <View style={styles.statusBadge}>
                      <Ionicons name="radio" size={12} color="#22c55e" />
                      <Text style={styles.statusText}>Live</Text>
                    </View>
                  ) : (
                    <View style={styles.offlineBadge}>
                      <Ionicons name="wifi-off" size={12} color="#9ca3af" />
                      <Text style={styles.offlineStatusText}>Offline</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.closeCardButton}
                    onPress={() => setShowInfoCard(false)}
                  >
                    <Ionicons name="close" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              </View>

              {activeBus.isActive ? (
                <>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <View style={styles.metricIcon}>
                        <Ionicons name="people" size={24} color="#22c55e" />
                      </View>
                      <Text style={styles.metricValue}>
                        {activeBus.currentPosition?.passenger_count || 0}
                      </Text>
                      <Text style={styles.metricLabel}>Passengers</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.metricItem}>
                      <View style={styles.metricIcon}>
                        <Ionicons name="speedometer" size={24} color="#3b82f6" />
                      </View>
                      <Text style={styles.metricValue}>
                        {activeBus.currentPosition?.speed || "0"} km/h
                      </Text>
                      <Text style={styles.metricLabel}>Speed</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.metricItem}>
                      <View style={styles.metricIcon}>
                        <Ionicons name="time" size={24} color="#22c55e" />
                      </View>
                      <Text style={styles.metricValue}>{etaToNextStop}</Text>
                      <Text style={styles.metricLabel}>
                        Next {nearestStop?.name || "Stop"}
                      </Text>
                      {/* <NearestStopAddress lat={activeBus.currentPosition?.lat} long={activeBus.currentPosition.long} /> */}
                    </View>
                  </View>

                  <View style={styles.locationInfo}>
                    <View style={styles.locationHeader}>
                      <Ionicons name="location" size={16} color="#22c55e" />
                      <Text style={styles.locationTitle}>Current Location</Text>
                      {activeBus.fromApi === false && (
                        <Text style={styles.mockDataLabel}> • Mock Data</Text>
                      )}
                    </View>
                    {/* <Text style={styles.locationCoords}>
                      {activeBus.currentPosition?.lat?.toFixed(6) || "0.000000"},{" "}
                      {activeBus.currentPosition?.long?.toFixed(6) || "0.000000"}
                    </Text> */}
                    <View>
                       <AddressDisplay 
                        lat={activeBus.currentPosition?.lat || null}
                        long={activeBus.currentPosition?.long || null}
                       />
                    </View>
                    <Text style={styles.lastUpdated}>
                      Updated: {new Date(activeBus.lastUpdated).toLocaleTimeString()}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.offlineContainer}>
                  <Ionicons 
                    name={activeBus.error ? "warning" : "wifi-off"} 
                    size={48} 
                    color={activeBus.error ? "#ef4444" : "#6b7280"} 
                  />
                  <Text style={[
                    styles.offlineText,
                    activeBus.error && styles.errorText
                  ]}>
                    {activeBus.error ? "Connection Error" : "Bus is offline"}
                  </Text>
                  <Text style={styles.offlineSubtext}>
                    {activeBus.error ? activeBus.message || "Failed to load data" : "No tracking data available"}
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => fetchBusData(activeBus.id, true)}
                  >
                    <Ionicons name="refresh" size={16} color="#ffffff" />
                    <Text style={styles.retryText}>Retry Connection</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* MINIMIZED INFO BAR */}
          {!showInfoCard && activeBus && (
            <TouchableOpacity
              style={styles.minimalInfoBar}
              onPress={() => setShowInfoCard(true)}
            >
              <View style={styles.minimalInfoContent}>
                <View
                  style={[
                    styles.minimalBusDot,
                    {
                      backgroundColor: busColors[activeBus.id] || "#22c55e",
                      opacity: activeBus.isActive ? 1 : 0.5,
                    },
                  ]}
                />
                <View style={styles.minimalInfoText}>
                  <Text style={styles.minimalBusName}>
                    {activeBus.bus_name}
                    {!activeBus.isActive && " (Offline)"}
                    {activeBus.fromApi === false && " [Mock]"}
                  </Text>
                  <Text style={styles.minimalBusStats}>
                    {activeBus.isActive ? (
                      <>
                        {activeBus.currentPosition?.passenger_count || 0} passengers
                        • {activeBus.currentPosition?.speed || "0"} km/h
                      </>
                    ) : (
                      "No tracking data"
                    )}
                  </Text>
                </View>
                <Ionicons name="chevron-up" size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Add debug info styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContent: {
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  debugInfo: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  debugText: {
    color: '#6b7280',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  minimalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refreshButton: {
    padding: 4,
  },
  userIcon: {
    marginRight: 12,
  },
  headerGreeting: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "500",
  },
  headerName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  apiStatusContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    gap: 8,
  },
  apiStatusText: {
    color: '#ef4444',
    fontSize: 12,
    flex: 1,
  },
  segmentedControlContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(17, 24, 39, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  segmentedControl: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  segmentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
    minWidth: 80,
  },
  activeSegmentButton: {
    borderWidth: 1,
  },
  notLoadedButton: {
    opacity: 0.7,
  },
  errorButton: {
    borderColor: '#ef4444',
  },
  mockDataButton: {
    borderColor: '#9ca3af',
    borderStyle: 'dashed',
  },
  segmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  segmentLoading: {
    marginRight: 6,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  activeSegmentText: {
    color: "#ffffff",
  },
  inactiveSegmentText: {
    color: "#9ca3af",
  },
  notLoadedText: {
    opacity: 0.7,
  },
  errorTextStyle: {
    color: '#ef4444',
  },
  mockDataText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  errorTextSmall: {
    color: '#ef4444',
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  mapLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  mapLoadingText: {
    color: "#ffffff",
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  busLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  busLoadingText: {
    color: "#ffffff",
    marginTop: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  activeBusMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  busIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 2,
  },
  mockDataBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#9ca3af',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  mockDataBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fabContainer: {
    position: "absolute",
    right: 20,
    top: 20,
    gap: 12,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(17, 24, 39, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  refreshFab: {
    position: "absolute",
    right: 20,
    top: 80,
  },
  modernInfoCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(17, 24, 39, 0.98)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  cardHandle: {
    alignItems: "center",
    marginBottom: 16,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  busInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  busColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  busTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
  },
  busSubtitle: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 2,
  },
  closeCardButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(55, 65, 81, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    backgroundColor: "#22c55e20",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "600",
  },
  offlineBadge: {
    backgroundColor: "rgba(156, 163, 175, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  offlineStatusText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
  },
  mockBadge: {
    backgroundColor: "rgba(156, 163, 175, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  mockBadgeText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
  },
  metricsGrid: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "rgba(55, 65, 81, 0.3)",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricIcon: {
    marginBottom: 8,
  },
  metricValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  metricLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 8,
  },
  locationInfo: {
    backgroundColor: "rgba(55, 65, 81, 0.3)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationTitle: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  mockDataLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontStyle: 'italic',
  },
 
  lastUpdated: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  offlineContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  offlineText: {
    color: "#9ca3af",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  errorText: {
    color: '#ef4444',
  },
  offlineSubtext: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: "#22c55e",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  minimalInfoBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(17, 24, 39, 0.95)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  minimalInfoContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  minimalBusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  minimalInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  minimalBusName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  minimalBusStats: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },
});