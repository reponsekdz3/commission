// Enhanced Mobile Search Screen
// Apply to /apps/mobile/app/(tabs)/search.tsx

import React from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ModernButton, InteractiveCard, ModernBadge } from '@/components/modern-ui-enhancements';

export default function EnhancedSearchScreen() {
  const [searchText, setSearchText] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('all');
  const [showFilters, setShowFilters] = React.useState(false);

  const propertyTypes = ['All', 'Rent', 'Buy', 'Short Stay'];
  const properties = [
    {
      id: 1,
      title: 'Modern 2-Bedroom Apartment',
      location: 'Kigali',
      price: 'RWF 450,000',
      beds: 2,
      baths: 1,
      area: 85,
      verified: true,
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    },
    {
      id: 2,
      title: 'Luxury Villa',
      location: 'Kigali',
      price: 'RWF 1,200,000',
      beds: 4,
      baths: 3,
      area: 250,
      verified: true,
      image: 'https://images.unsplash.com/photo-1512917774080-9b274b3f0600?w=400&h=300&fit=crop',
    },
    {
      id: 3,
      title: 'Studio Apartment',
      location: 'Huye',
      price: 'RWF 250,000',
      beds: 1,
      baths: 1,
      area: 40,
      verified: false,
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFDFC' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '900', color: '#0B1210', marginBottom: 16 }}>
          Search Properties
        </Text>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFF',
            borderWidth: 1,
            borderColor: '#E3E8E6',
            borderRadius: 12,
            paddingHorizontal: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 16, color: '#5B6B66', marginRight: 8 }}>🔍</Text>
          <TextInput
            style={{
              flex: 1,
              paddingVertical: 12,
              fontSize: 14,
              color: '#0B1210',
            }}
            placeholder="Search properties..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#5B6B66"
          />
        </View>

        {/* Type Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
        >
          {propertyTypes.map((type, i) => (
            <Pressable
              key={i}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedType(type.toLowerCase());
              }}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  marginRight: 8,
                  backgroundColor:
                    selectedType === type.toLowerCase() ? '#0E9F6E' : '#FFF',
                  borderWidth: 1,
                  borderColor:
                    selectedType === type.toLowerCase() ? '#0E9F6E' : '#E3E8E6',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color:
                    selectedType === type.toLowerCase() ? '#FFF' : '#0B1210',
                }}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Filter Button */}
        <Pressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowFilters(!showFilters);
          }}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: '#FAFBFA',
            borderWidth: 1,
            borderColor: '#E3E8E6',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0B1210' }}>
            🔧 Filters
          </Text>
        </Pressable>
      </View>

      {/* Results */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#5B6B66', marginBottom: 12 }}>
            {properties.length} PROPERTIES FOUND
          </Text>
        </View>

        {properties.map((property, i) => (
          <InteractiveCard
            key={property.id}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={{ marginBottom: 12 }}
          >
            {/* Image */}
            <View style={{ position: 'relative', marginBottom: 12 }}>
              <Image
                source={{ uri: property.image }}
                style={{ width: '100%', height: 180, borderRadius: 12 }}
              />
              <View
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  flexDirection: 'row',
                  gap: 6,
                }}
              >
                {property.verified && (
                  <ModernBadge variant="primary">✓ Verified</ModernBadge>
                )}
              </View>
            </View>

            {/* Content */}
            <View style={{ paddingHorizontal: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#0E9F6E', textTransform: 'uppercase' }}>
                  📍 {property.location}
                </Text>
              </View>

              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: '#0B1210',
                  marginBottom: 4,
                }}
                numberOfLines={2}
              >
                {property.title}
              </Text>

              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '900',
                  color: '#0B1210',
                  marginBottom: 8,
                }}
              >
                {property.price}
              </Text>

              {/* Specs */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <Text style={{ fontSize: 11, color: '#5B6B66', fontWeight: '700' }}>
                  🛏️ {property.beds} Beds
                </Text>
                <Text style={{ fontSize: 11, color: '#5B6B66', fontWeight: '700' }}>
                  🚿 {property.baths} Bath
                </Text>
                <Text style={{ fontSize: 11, color: '#5B6B66', fontWeight: '700' }}>
                  📐 {property.area} m²
                </Text>
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <ModernButton
                  variant="primary"
                  size="md"
                  style={{ flex: 1 }}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  View
                </ModernButton>
                <ModernButton
                  variant="secondary"
                  size="md"
                  style={{ flex: 1 }}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  Save
                </ModernButton>
              </View>
            </View>
          </InteractiveCard>
        ))}

        {/* Load More */}
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ModernButton
            variant="secondary"
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            Load More
          </ModernButton>
        </View>
      </ScrollView>
    </View>
  );
}
