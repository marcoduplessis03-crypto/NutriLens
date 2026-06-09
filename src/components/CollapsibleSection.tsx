import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  children: React.ReactNode;
};

export default function CollapsibleSection({ title, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.card}>
      <Pressable onPress={() => setOpen(!open)} style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.icon}>{open ? "▲" : "▼"}</Text>
      </Pressable>

      {open && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  icon: {
    fontSize: 16,
  },
  content: {
    marginTop: 12,
  },
});