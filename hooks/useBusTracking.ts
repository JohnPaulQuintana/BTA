

// import { useState, useEffect } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { MOCK_STOPS, MOCK_BUSES } from "../services/busServer.mock";

// export function useBusTracking(resetStorage = false) {
//   const [stops] = useState(MOCK_STOPS);

//   const [buses, setBuses] = useState(() =>
//     MOCK_BUSES.map((bus) => ({
//       ...bus,
//       id: bus.id || `bus_${Math.random().toString(36).substr(2, 9)}`,
//       currentIndex: 0,
//       currentPosition: { ...bus.path[0] },
//       pathTravelled: [{ lat: bus.path[0].lat, long: bus.path[0].long }],
//     }))
//   );

//   // Load saved bus positions from AsyncStorage
//   useEffect(() => {
//     (async () => {
//       const updatedBuses = await Promise.all(
//         buses.map(async (bus) => {
//           const indexKey = `bus_${bus.id}_last_index`;
//           const pathKey = `bus_${bus.id}_last_path`;

//           if (resetStorage) {
//             await AsyncStorage.multiRemove([indexKey, pathKey]);
//             return bus;
//           }

//           const [savedIndex, savedPath] = await Promise.all([
//             AsyncStorage.getItem(indexKey),
//             AsyncStorage.getItem(pathKey),
//           ]);

//           const idx = savedIndex ? Number(savedIndex) : 0;
//           const lastPos = savedPath
//             ? JSON.parse(savedPath).slice(-1)[0] || bus.path[idx]
//             : bus.path[idx];

//           return {
//             ...bus,
//             currentIndex: idx,
//             currentPosition: lastPos,
//             pathTravelled: savedPath
//               ? JSON.parse(savedPath)
//               : [{ lat: bus.path[idx].lat, long: bus.path[idx].long }],
//           };
//         })
//       );
//       setBuses(updatedBuses);
//     })();
//   }, [resetStorage]);

//   // Update buses periodically (simulate movement to last point only)
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setBuses((prevBuses) => {
//         let changed = false;

//         const updated = prevBuses.map((bus) => {
//           const lastPoint = bus.path[bus.path.length - 1];

//           if (
//             bus.currentPosition.lat !== lastPoint.lat ||
//             bus.currentPosition.long !== lastPoint.long
//           ) {
//             changed = true;
//             return {
//               ...bus,
//               currentPosition: lastPoint,
//               pathTravelled: bus.path,
//             };
//           }

//           return bus;
//         });

//         // Only update state if something changed
//         return changed ? updated : prevBuses;
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);

//   return { buses, stops };
// }

