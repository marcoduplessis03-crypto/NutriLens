import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";

const conditions = [
  "Kidney Disease",
  "Heart Disease",
  "Diabetes",
  "Hypertension",
  "Gout",
  "Gluten Allergy",
  "Nut Allergy",
  "Dairy Allergy",
];

export default function HomeScreen() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleCondition = (condition: string) => {
    if (selected.includes(condition)) {
      setSelected(selected.filter((c) => c !== condition));
    } else {
      setSelected([...selected, condition]);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>NutriLens</Text>

      <Text style={styles.subtitle}>
        Select your health conditions
      </Text>

      {conditions.map((condition) => (
        <TouchableOpacity
          key={condition}
          style={[
            styles.card,
            selected.includes(condition) && styles.selectedCard,
          ]}
          onPress={() => toggleCondition(condition)}
        >
          <Text style={styles.cardText}>
            {selected.includes(condition) ? "✓ " : ""}
            {condition}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
  style={styles.button}
  onPress={() =>
    router.push({
      pathname: "/scanner",
      params: {
        conditions: selected.join(","),
      },
    })
  }
>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: "#666",
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedCard: {
    backgroundColor: "#4CAF50",
  },
  cardText: {
    fontSize: 18,
  },
  button: {
    backgroundColor: "#000",
    padding: 18,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
});