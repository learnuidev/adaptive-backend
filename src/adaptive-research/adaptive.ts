// adaptive.js - Simplified identity module with IP tracking and location data
export const Adaptive = function ({
  apiKey,
  origins = ["*"],
}: {
  apiKey: string;
  origins?: string[];
}) {
  let currentIdentity: any = null;
  const storageKey = "adaptive_identity";

  // Check if origin is allowed
  const isOriginAllowed = () => {
    const currentOrigin = window.location.origin;

    // If origins includes "*", allow all origins
    if (origins.includes("*")) {
      return true;
    }

    // Check if current origin matches any of the provided origins
    return origins.includes(currentOrigin);
  };

  // Private methods
  const generateSessionId = () =>
    "session_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();

  const generateDeviceFingerprint = () => {
    // Only generate fingerprint if origin is allowed
    if (!isOriginAllowed()) {
      return "blocked";
    }

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      new Date().getTimezoneOffset(),
    ].join("|");

    let hash = 0;
    for (let i = 0; i < components.length; i++) {
      const char = components.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  const getLocationData = async () => {
    // Only fetch location if origin is allowed
    if (!isOriginAllowed()) {
      return {
        ip: "blocked",
        latitude: "blocked",
        longitude: "blocked",
        city: "blocked",
        region: "blocked",
        country: "blocked",
        country_code: "blocked",
        timezone: "blocked",
      };
    }

    try {
      // Use ipapi.co for comprehensive location data
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();

      return {
        ip: data.ip,
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        region: data.region,
        country: data.country_name,
        country_code: data.country_code,
        timezone: data.timezone,
        postal: data.postal,
        org: data.org,
        asn: data.asn,
      };
    } catch (error) {
      try {
        // Fallback to ip-api.com (no HTTPS required for free tier)
        const response = await fetch("http://ip-api.com/json/");
        const data = await response.json();

        return {
          ip: data.query,
          latitude: data.lat,
          longitude: data.lon,
          city: data.city,
          region: data.regionName,
          country: data.country,
          country_code: data.countryCode,
          timezone: data.timezone,
          postal: data.zip,
          org: data.org,
          asn: data.as,
        };
      } catch (fallbackError) {
        console.warn("Adaptive: Could not retrieve location data");
        return {
          ip: "unknown",
          latitude: "unknown",
          longitude: "unknown",
          city: "unknown",
          region: "unknown",
          country: "unknown",
          country_code: "unknown",
          timezone: "unknown",
        };
      }
    }
  };

  const getIPAddress = async () => {
    // Only fetch IP if origin is allowed
    if (!isOriginAllowed()) {
      return "blocked";
    }

    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      try {
        const locationData = await getLocationData();
        return locationData.ip;
      } catch (fallbackError) {
        console.warn("Adaptive: Could not retrieve IP address");
        return "unknown";
      }
    }
  };

  const loadIdentity = () => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  };

  const saveIdentity = (identity: any) => {
    // Only save if origin is allowed
    if (!isOriginAllowed()) {
      console.warn("Adaptive: Origin not allowed - identity not saved");
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(identity));
    } catch (error) {
      console.error("Adaptive: Failed to save identity", error);
    }
  };

  const identity = async (customData = {}) => {
    // Check origin before proceeding with any identity operations
    if (!isOriginAllowed()) {
      console.warn("Adaptive: Origin not allowed - identity access blocked");
      return {
        id: "blocked",
        sessionId: "blocked",
        deviceFingerprint: "blocked",
        ipAddress: "blocked",
        location: {
          latitude: "blocked",
          longitude: "blocked",
          city: "blocked",
          region: "blocked",
          country: "blocked",
          country_code: "blocked",
          timezone: "blocked",
        },
        timestamp: Date.now(),
        ...customData,
      };
    }

    if (!currentIdentity) {
      const locationData = await getLocationData();

      currentIdentity = loadIdentity() || {
        id: "id_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now(),
        sessionId: generateSessionId(),
        deviceFingerprint: generateDeviceFingerprint(),
        ipAddress: locationData.ip,
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          city: locationData.city,
          region: locationData.region,
          country: locationData.country,
          country_code: locationData.country_code,
          timezone: locationData.timezone,
          postal: locationData.postal,
          org: locationData.org,
          asn: locationData.asn,
        },
        timestamp: Date.now(),
        ...customData,
      };

      // If identity was loaded but doesn't have location data, update it
      if (
        !currentIdentity.location ||
        currentIdentity.location.ip === undefined
      ) {
        currentIdentity.ipAddress = locationData.ip;
        currentIdentity.location = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          city: locationData.city,
          region: locationData.region,
          country: locationData.country,
          country_code: locationData.country_code,
          timezone: locationData.timezone,
          postal: locationData.postal,
          org: locationData.org,
          asn: locationData.asn,
        };
      }

      console.log("IDENTITY", currentIdentity);

      saveIdentity(currentIdentity);
    }

    // Merge with new custom data
    if (Object.keys(customData).length > 0) {
      currentIdentity = {
        ...currentIdentity,
        ...customData,
        lastUpdated: Date.now(),
      };
      saveIdentity(currentIdentity);
    }

    return { ...currentIdentity };
  };

  // Method to refresh location data (useful for dynamic IPs or mobile users)
  const refreshLocation = async () => {
    // Only refresh if origin is allowed
    if (!isOriginAllowed()) {
      console.warn("Adaptive: Origin not allowed - location refresh blocked");
      return {
        ip: "blocked",
        latitude: "blocked",
        longitude: "blocked",
        city: "blocked",
        region: "blocked",
        country: "blocked",
      };
    }

    const newLocation = await getLocationData();
    if (currentIdentity) {
      currentIdentity.ipAddress = newLocation.ip;
      currentIdentity.location = {
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        city: newLocation.city,
        region: newLocation.region,
        country: newLocation.country,
        country_code: newLocation.country_code,
        timezone: newLocation.timezone,
        postal: newLocation.postal,
        org: newLocation.org,
        asn: newLocation.asn,
      };
      currentIdentity.locationLastUpdated = Date.now();
      saveIdentity(currentIdentity);
    }
    return newLocation;
  };

  // Method to refresh IP address (maintains backward compatibility)
  const refreshIPAddress = async () => {
    const location = await refreshLocation();
    return location.ip;
  };

  // Method to get only location data without updating identity
  const getCurrentLocation = async () => {
    if (!isOriginAllowed()) {
      return {
        ip: "blocked",
        latitude: "blocked",
        longitude: "blocked",
        city: "blocked",
        region: "blocked",
        country: "blocked",
      };
    }

    return await getLocationData();
  };

  // Method to calculate distance between current location and coordinates
  const calculateDistance = (lat2: any, lon2: any, unit = "km") => {
    if (
      !currentIdentity ||
      !currentIdentity.location ||
      currentIdentity.location.latitude === "unknown" ||
      currentIdentity.location.latitude === "blocked"
    ) {
      return null;
    }

    const lat1 = currentIdentity.location.latitude;
    const lon1 = currentIdentity.location.longitude;

    if (lat1 === lat2 && lon1 === lon2) return 0;

    const radlat1 = (Math.PI * lat1) / 180;
    const radlat2 = (Math.PI * lat2) / 180;
    const theta = lon1 - lon2;
    const radtheta = (Math.PI * theta) / 180;

    let dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

    if (dist > 1) dist = 1;

    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;

    if (unit === "km") dist = dist * 1.609344;
    if (unit === "mi") dist = dist * 0.8684;

    return dist;
  };

  // Public API
  return {
    identity,
    refreshIPAddress,
    refreshLocation,
    getCurrentLocation,
    calculateDistance,
    // Expose origin checking for external use
    isOriginAllowed,
    loadIdentity,
  };
};
