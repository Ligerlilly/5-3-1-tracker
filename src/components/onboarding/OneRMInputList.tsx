import React from "react";
import { View } from "react-native";
import { TextInput, HelperText } from "react-native-paper";
import { MAIN_EXERCISES } from "../../types";

interface OneRMInputListProps {
    values: Record<string, string>;
    errors: Record<string, string>;
    onChange: (exerciseName: string, value: string) => void;
}

export default function OneRMInputList({ values, errors, onChange }: OneRMInputListProps) {
    return (
        <>
            {MAIN_EXERCISES.map((exercise) => (
                <View key={exercise.name}>
                    <TextInput
                        label={`${exercise.name} 1RM (lbs)`}
                        value={values[exercise.name] ?? ""}
                        onChangeText={(value) => onChange(exercise.name, value)}
                        mode="outlined"
                        keyboardType="numeric"
                        style={{ marginBottom: 5 }}
                        error={!!errors[exercise.name]}
                    />
                    {errors[exercise.name] && <HelperText type="error">{errors[exercise.name]}</HelperText>}
                </View>
            ))}
        </>
    );
}
