import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/components/ui";
const icons = {
  index: "home-outline",
  plan: "map-outline",
  timer: "timer-outline",
  progress: "bar-chart-outline",
  settings: "settings-outline",
} as const;
export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.dim,
        tabBarStyle: {
          backgroundColor: "#10101e",
          borderTopColor: colors.border,
          minHeight: 65,
          paddingTop: 7,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {Object.entries(icons).map(([name, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title:
              name === "index" ? "Home" : name[0].toUpperCase() + name.slice(1),
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name={icon}
                size={size}
                color={typeof color === "string" ? color : colors.muted}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
