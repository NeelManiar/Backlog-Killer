import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Text, View } from "react-native";
import { StoreProvider, useStore } from "../src/state/store";
import { colors } from "../src/components/ui";
function Routes() {
  const { ready, error } = useStore();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <StatusBar style="light" />
      {error ? (
        <Text
          accessibilityRole="alert"
          style={{ color: "#ff9292", padding: 12 }}
        >
          {error}
        </Text>
      ) : null}
      {ready ? (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="prediction" options={{ presentation: "modal" }} />
          <Stack.Screen name="add" options={{ presentation: "modal" }} />
          <Stack.Screen name="subject/[id]" />
        </Stack>
      ) : (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator color={colors.purple} />
        </View>
      )}
    </SafeAreaView>
  );
}
export default function Layout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Routes />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
