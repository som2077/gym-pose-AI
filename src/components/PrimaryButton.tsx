import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function PrimaryButton({ label, onPress, disabled = false, icon, variant = 'primary' }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[variant], disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      {icon}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 18 },
  primary: { backgroundColor: '#84F7C5' },
  secondary: { backgroundColor: '#1B2631', borderWidth: 1, borderColor: '#344452' },
  danger: { backgroundColor: '#E95B5B' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  label: { color: '#07120E', fontSize: 16, fontWeight: '800' },
});
