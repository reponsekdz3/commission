// Modern UI Enhancements for Mobile
// Provides native-first interactive components with haptics and animations

import React from 'react';
import { Pressable, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';

// ===== MODERN BUTTON COMPONENT =====

export const ModernButton = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  haptic = true,
  disabled = false,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  haptic?: boolean;
  disabled?: boolean;
  style?: any;
}) => {
  const handlePress = async () => {
    if (haptic && !disabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.();
  };

  const variantStyles = {
    primary: {
      bg: '#0E9F6E',
      text: '#FFF',
      activeOpacity: 0.8,
    },
    secondary: {
      bg: '#FAFBFA',
      text: '#0B1210',
      activeOpacity: 0.7,
    },
    ghost: {
      bg: 'transparent',
      text: '#0B1210',
      activeOpacity: 0.6,
    },
    danger: {
      bg: '#DC2626',
      text: '#FFF',
      activeOpacity: 0.8,
    },
  };

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 12 },
    md: { paddingVertical: 12, paddingHorizontal: 16, fontSize: 14 },
    lg: { paddingVertical: 16, paddingHorizontal: 20, fontSize: 16 },
  };

  const current = variantStyles[variant];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: current.bg,
          opacity: pressed ? current.activeOpacity : 1,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          ...sizeStyles[size],
        },
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator size="small" color={current.text} />
      )}
      <Text style={{ color: current.text, fontWeight: '700' }}>
        {children}
      </Text>
    </Pressable>
  );
};

// ===== INTERACTIVE CARD =====

export const InteractiveCard = ({
  children,
  onPress,
  haptic = true,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  haptic?: boolean;
  style?: any;
}) => {
  const handlePress = async () => {
    if (haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        {
          backgroundColor: '#FFF',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E3E8E6',
          padding: 16,
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
};

// ===== MODERN BADGE =====

export const ModernBadge = ({
  children,
  variant = 'primary',
  style,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  style?: any;
}) => {
  const variants = {
    primary: { bg: '#ECFDF5', text: '#064E3B' },
    success: { bg: '#DCFCE7', text: '#166534' },
    warning: { bg: '#FEF3C7', text: '#92400E' },
    danger: { bg: '#FEE2E2', text: '#991B1B' },
    info: { bg: '#E0F2FE', text: '#0C2D6B' },
  };

  const current = variants[variant];

  return (
    <View
      style={[
        {
          backgroundColor: current.bg,
          borderRadius: 999,
          paddingVertical: 4,
          paddingHorizontal: 8,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text style={{ color: current.text, fontSize: 11, fontWeight: '700' }}>
        {children}
      </Text>
    </View>
  );
};

// ===== GLASS CARD =====

export const GlassCard = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) => (
  <View
    style={[
      {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        padding: 16,
        backdropFilter: 'blur(10px)',
      },
      style,
    ]}
  >
    {children}
  </View>
);

// ===== LOADING SPINNER =====

export const LoadingSpinner = ({
  size = 'md',
  color = '#0E9F6E',
  style,
}: {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  style?: any;
}) => {
  const sizes = {
    sm: 'small' as const,
    md: 'large' as const,
    lg: 'large' as const,
  };

  return (
    <ActivityIndicator
      size={sizes[size]}
      color={color}
      style={style}
    />
  );
};

// ===== SKELETON LOADER =====

export const SkeletonLoader = ({
  count = 3,
  height = 60,
  style,
}: {
  count?: number;
  height?: number;
  style?: any;
}) => (
  <View style={style}>
    {Array.from({ length: count }).map((_, i) => (
      <View
        key={i}
        style={{
          height,
          backgroundColor: '#F4F6F5',
          borderRadius: 12,
          marginBottom: 12,
          opacity: 0.6,
        }}
      />
    ))}
  </View>
);

// ===== EMPTY STATE =====

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  style,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  style?: any;
}) => (
  <View
    style={[
      {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
      },
      style,
    ]}
  >
    <View style={{ marginBottom: 16, opacity: 0.5 }}>
      {icon}
    </View>
    <Text
      style={{
        fontSize: 18,
        fontWeight: '700',
        color: '#0B1210',
        marginBottom: 8,
        textAlign: 'center',
      }}
    >
      {title}
    </Text>
    <Text
      style={{
        fontSize: 14,
        color: '#5B6B66',
        textAlign: 'center',
        marginBottom: 20,
      }}
    >
      {description}
    </Text>
    {action}
  </View>
);

// ===== MODERN TABS =====

export const ModernTabs = ({
  tabs,
  defaultTab = 0,
  onChange,
  style,
}: {
  tabs: Array<{ label: string; content: React.ReactNode }>;
  defaultTab?: number;
  onChange?: (index: number) => void;
  style?: any;
}) => {
  const [active, setActive] = React.useState(defaultTab);

  const handleChange = async (index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActive(index);
    onChange?.(index);
  };

  return (
    <View style={style}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
      >
        {tabs.map((tab, i) => (
          <Pressable
            key={i}
            onPress={() => handleChange(i)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 2,
              borderBottomColor: active === i ? '#0E9F6E' : 'transparent',
              marginRight: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: active === i ? '#0E9F6E' : '#5B6B66',
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View>
        {tabs[active].content}
      </View>
    </View>
  );
};

// ===== MODERN INPUT =====

export const ModernInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  icon,
  style,
  ...props
}: {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  icon?: React.ReactNode;
  style?: any;
  [key: string]: any;
}) => (
  <View style={style}>
    {label && (
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: '#243430',
          marginBottom: 8,
        }}
      >
        {label}
      </Text>
    )}
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: error ? '#DC2626' : '#E3E8E6',
        borderRadius: 12,
        paddingHorizontal: 12,
        backgroundColor: '#FFF',
      }}
    >
      {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          color: '#0B1210',
          paddingVertical: 12,
        }}
      >
        {value || placeholder}
      </Text>
    </View>
    {error && (
      <Text style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>
        {error}
      </Text>
    )}
  </View>
);

// ===== HAPTIC FEEDBACK WRAPPER =====

export const HapticPressable = ({
  children,
  onPress,
  hapticStyle = 'medium',
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  hapticStyle?: 'light' | 'medium' | 'heavy';
  style?: any;
}) => {
  const hapticMap = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  };

  const handlePress = async () => {
    await Haptics.impactAsync(hapticMap[hapticStyle]);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
};

// ===== RESPONSIVE GRID =====

export const ResponsiveGrid = ({
  children,
  columns = 2,
  gap = 12,
  style,
}: {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  style?: any;
}) => (
  <View
    style={[
      {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap,
      },
      style,
    ]}
  >
    {React.Children.map(children, (child) => (
      <View style={{ width: `${100 / columns}%`, paddingHorizontal: gap / 2 }}>
        {child}
      </View>
    ))}
  </View>
);

// ===== BOTTOM SHEET TRIGGER =====

export const BottomSheetTrigger = ({
  children,
  onPress,
  haptic = true,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  haptic?: boolean;
  style?: any;
}) => {
  const handlePress = async () => {
    if (haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
};

// ===== SWIPE INDICATOR =====

export const SwipeIndicator = ({
  style,
}: {
  style?: any;
}) => (
  <View
    style={[
      {
        width: 40,
        height: 4,
        backgroundColor: '#CBD5D1',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
      },
      style,
    ]}
  />
);
