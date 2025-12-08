import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";
// import "../global.css"
import React from "react";

export default function RootLayout() {
  return (
    <AuthProvider>
       <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: "#1f2937" },
          headerTintColor: "#22c55e", // green title
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
    </AuthProvider>
  );
}
