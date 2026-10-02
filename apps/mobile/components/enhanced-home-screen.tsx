// Enhanced Mobile Home Screen
// Apply to /apps/mobile/app/(tabs)/index.tsx

import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ModernButton, InteractiveCard, ModernBadge } from '@/components/modern-ui-enhancements';

export default function EnhancedHomeScreen() {
  const [saved, setSaved] = React.useState(new Set());

  const handleSave = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newSaved = new Set(saved);
    if (newSaved.has(id)) {
      newSaved.delete(id);
    } else {
      newSaved.add(id);
    }
    setSaved(newSaved);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FDFDFC' }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#0B1210', marginBottom: 8 }}>
          Welcome Back
        </Text>
        <Text style={{ fontSize: 14, color: '#5B6B66', marginBottom: 20 }}>
          Discover your next property
        </Text>

        {/* Search Bar */}
        <Pressable
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFF',
            borderWidth: 1,
            borderColor: '#E3E8E6',
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 12,
            marginBottom: 16,
          }}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Text style={{ fontSize: 16, color: '#5B6B66', flex: 1 }}>
            Search properties...
          </Text>
          <Text style={{ fontSize: 18 }}>🔍</Text>
        </Pressable>

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ModernButton
            variant="primary"
            size="md"
            style={{ flex: 1 }}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            🗺️ Map
          </ModernButton>
          <ModernButton
            variant="secondary"
            size="md"
            style={{ flex: 1 }}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            ❤️ Saved
          </ModernButton>
        </View>
      </View>

      {/* Featured Section */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0B1210' }}>
            Featured Properties
          </Text>
          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0E9F6E' }}>
              See all →
            </Text>
          </Pressable>
        </View>

        {/* Property Cards */}
        {[1, 2, 3].map((i) => (
          <InteractiveCard
            key={i}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={{ marginBottom: 12 }}
          >
            <View style={{ position: 'relative', marginBottom: 12 }}>
              <Image
                source={{ uri: `https://images.unsplash.com/photo-${1500000000000 + i}?w=400&h=250&fit=crop` }}
                style={{ width: '100%', height: 200, borderRadius: 12 }}
              />
              <Pressable
                onPress={() => handleSave(`property-${i}`)}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: saved.has(`property-${i}`) ? '#0E9F6E' : 'rgba(255,255,255,0.9)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 20 }}>
                  {saved.has(`property-${i}`) ? '❤️' : '🤍'}
                </Text>
              </Pressable>
              <ModernBadge variant="primary" style={{ position: 'absolute', bottom: 10, left: 10 }}>
                Verified
              </ModernBadge>
            </View>

            <View style={{ paddingHorizontal: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#0E9F6E', textTransform: 'uppercase' }}>
                  📍 Kigali
                </Text>
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0B1210', marginBottom: 4 }}>
                Modern 2-Bedroom Apartment
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0B1210', marginBottom: 8 }}>
                RWF 450,000
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#5B6B66' }}>/month</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Text style={{ fontSize: 12, color: '#5B6B66', fontWeight: '700' }}>
                  🛏️ 2 Beds
                </Text>
                <Text style={{ fontSize: 12, color: '#5B6B66', fontWeight: '700' }}>
                  🚿 1 Bath
                </Text>
                <Text style={{ fontSize: 12, color: '#5B6B66', fontWeight: '700' }}>
                  📐 85 m²
                </Text>
              </View>
            </View>
          </InteractiveCard>
        ))}
      </View>

      {/* Districts Section */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0B1210', marginBottom: 12 }}>
          Explore Districts
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          {['Kigali', 'Huye', 'Musanze', 'Gitarama'].map((district) => (
            <Pressable
              key={district}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={{
                flex: 1,
                minWidth: '45%',
                paddingVertical: 12,
                paddingHorizontal: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E3E8E6',
                backgroundColor: '#FFF',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0B1210', textAlign: 'center' }}>
                {district}
              </Text>
              <Text style={{ fontSize: 12, color: '#5B6B66', textAlign: 'center', marginTop: 4 }}>
                250+ listings
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Stats Section */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              paddingVertical: 16,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: '#ECFDF5',
              borderWidth: 1,
              borderColor: '#D1FAE5',
            }}
          >
            <Text style={{ fontSize: 12, color: '#064E3B', fontWeight: '700', marginBottom: 4 }}>
              Properties
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0E9F6E' }}>
              5K+
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              paddingVertical: 16,
              paddingHorizontal: 12,
              borderRadius: 14,
              backgroundColor: '#FEF3C7',
              borderWidth: 1,
              borderColor: '#FCD34D',
            }}
          >
            <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '700', marginBottom: 4 }}>
              Bookings
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#F59E0B' }}>
              1.2K
            </Text>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <View
          style={{
            paddingVertical: 20,
            paddingHorizontal: 16,
            borderRadius: 16,
            backgroundColor: '#064E3B',
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF', marginBottom: 8 }}>
            List Your Property
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>
            Start earning from your property today
          </Text>
          <ModernButton
            variant="primary"
            style={{ width: '100%', backgroundColor: '#FFF', color: '#064E3B' }}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            Get Started
          </ModernButton>
        </View>
      </View>
    </ScrollView>
  );
}
