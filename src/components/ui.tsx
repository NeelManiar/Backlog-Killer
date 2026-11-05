import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
export const colors = {
  bg: "#09090f",
  card: "#1b1b30",
  border: "#2c2b42",
  text: "#f5f3ff",
  muted: "#a09fbe",
  dim: "#777693",
  purple: "#8538f5",
  green: "#1fc45d",
};
export function Page({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={s.page}
    >
      {children}
    </ScrollView>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Title({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={s.title}>
      {children}
    </Text>
  );
}
export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={s.heading}>
      {children}
    </Text>
  );
}
export function Label({
  children,
  color = colors.muted,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Text style={{ color, fontSize: 15, lineHeight: 23 }}>{children}</Text>
  );
}
export function Button({
  title,
  onPress,
  secondary,
  disabled,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        },
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={{ color: colors.text, fontWeight: "700", fontSize: 16 }}>
        {title}
      </Text>
    </Pressable>
  );
}
export function IconButton({
  name,
  label,
  onPress,
  primary,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        s.iconButton,
        primary && { backgroundColor: colors.purple, width: 78, height: 78 },
      ]}
    >
      <Ionicons
        name={name}
        size={primary ? 32 : 24}
        color={primary ? colors.text : colors.muted}
      />
    </Pressable>
  );
}
export function Bar({ value, color }: { value: number; color: string }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: value }}
      style={s.track}
    >
      <View
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: color,
          height: "100%",
          borderRadius: 10,
        }}
      />
    </View>
  );
}
export const s = StyleSheet.create({
  page: {
    padding: 16,
    paddingBottom: 35,
    gap: 20,
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  title: { color: colors.text, fontSize: 29, fontWeight: "800" },
  heading: { color: colors.text, fontSize: 20, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 15,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: 54,
    height: 54,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    height: 8,
    backgroundColor: "#303044",
    borderRadius: 10,
    overflow: "hidden",
  },
  input: {
    minHeight: 50,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    fontSize: 16,
  },
  chip: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: colors.card,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
  },
  small: { color: colors.dim, fontSize: 13 },
  link: { color: "#b581ff", fontSize: 15, fontWeight: "600" },
});
