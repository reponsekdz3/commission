// Enhanced Mobile Property Detail Screen
// Apply to /apps/mobile/app/property/[id].tsx

import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ModernButton, ModernBadge, ModernTabs } from '@/components/modern-ui-enhancements';

export default function EnhancedPropertyDetailScreen() {
  const [saved, setSaved] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('overview');

  const property = {
    id: 1,
    title: 'Modern 2-Bedroom Apartment',
    location: 'Kigali, Rwanda',
    price: 'RWF 450,000',
    beds: 2,
    baths: 1,
    area: 85,
    verified: true,
    rating: 4.8,
    reviews: 156,
    description: 'Beautiful modern apartment in the heart of Kigali. Fully furnished with premium amenities and stunning city views. Perfect for professionals and families.',
    amenities: ['WiFi', 'Parking', 'Pool', 'Gym', 'Security', 'Elevator'],
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9b274b3f0600?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    ],
    owner: {
      name: 'John Doe',
      avatar: 'JD',
      verified: true,
    },
  };

  const handleSave = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaved(!saved);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFDFC' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gallery */}
        <View style={{ position: 'relative', height: 280, backgroundColor: '#F4F6F5', marginBottom: 16 }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {property.images.map((image, i) => (
              <Image
                key={i}
                source={{ uri: image }}
                style={{ width: '100%', height: 280 }}
              />
            ))}
          </ScrollView>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: saved ? '#0E9F6E' : 'rgba(255,255,255,0.9)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>
              {saved ? '❤️' : '🤍'}
            </Text>
          </Pressable>

          {/* Photo Count */}
          <View
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 8,
              backgroundColor: 'rgba(0,0,0,0.6)',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>
              📸 {property.images.length} photos
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 16 }}>
          {/* Header */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              <ModernBadge variant="primary">Verified</ModernBadge>
              <ModernBadge variant="success">Available</ModernBadge>
            </View>

            <Text
              style={{
                fontSize: 22,
                fontWeight: '900',
                color: '#0B1210',
                marginBottom: 4,
              }}
            >
              {property.title}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0E9F6E' }}>
                📍 {property.location}
              </Text>
            </View>
          </View>

          {/* Price */}
          <View
            style={{
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: '#ECFDF5',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 12, color: '#064E3B', fontWeight: '700', marginBottom: 4 }}>
              MONTHLY RENT
            </Text>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#0E9F6E' }}>
              {property.price}
            </Text>
          </View>

          {/* Specs Grid */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <View
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 10,
                borderRadius: 12,
                backgroundColor: '#FAFBFA',
                borderWidth: 1,
                borderColor: '#E3E8E6',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>🛏️</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#0B1210' }}>
                {property.beds}
              </Text>
              <Text style={{ fontSize: 10, color: '#5B6B66', fontWeight: '700' }}>
                Bedrooms
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 10,
                borderRadius: 12,
                backgroundColor: '#FAFBFA',
                borderWidth: 1,
                borderColor: '#E3E8E6',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>🚿</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#0B1210' }}>
                {property.baths}
              </Text>
              <Text style={{ fontSize: 10, color: '#5B6B66', fontWeight: '700' }}>
                Bathrooms
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 10,
                borderRadius: 12,
                backgroundColor: '#FAFBFA',
                borderWidth: 1,
                borderColor: '#E3E8E6',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18, marginBottom: 4 }}>📐</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#0B1210' }}>
                {property.area}
              </Text>
              <Text style={{ fontSize: 10, color: '#5B6B66', fontWeight: '700' }}>
                m²
              </Text>
            </View>
          </View>

          {/* Tabs */}
          <ModernTabs
            tabs={[
              {
                label: 'Overview',
                content: (
                  <View>
                    <Text style={{ fontSize: 14, color: '#5B6B66', lineHeight: 22 }}>
                      {property.description}
                    </Text>
                  </View>
                ),
              },
              {
                label: 'Amenities',
                content: (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {property.amenities.map((amenity, i) => (
                      <View
                        key={i}
                        style={{
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          backgroundColor: '#ECFDF5',
                          borderWidth: 1,
                          borderColor: '#D1FAE5',
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#064E3B' }}>
                          ✓ {amenity}
                        </Text>
                      </View>
                    ))}
                  </View>
                ),
              },
              {
                label: 'Reviews',
                content: (
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Text style={{ fontSize: 24, fontWeight: '900', color: '#0B1210' }}>
                        {property.rating}
                      </Text>
                      <View>
                        <Text style={{ fontSize: 12, color: '#F59E0B' }}>⭐⭐⭐⭐⭐</Text>
                        <Text style={{ fontSize: 11, color: '#5B6B66' }}>
                          {property.reviews} reviews
                        </Text>
                      </View>
                    </View>
                  </View>
                ),
              },
            ]}
            onChange={(index) => setActiveTab(index)}
            style={{ marginBottom: 20 }}
          />

          {/* Owner Card */}
          <View
            style={{
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: '#FAFBFA',
              borderWidth: 1,
              borderColor: '#E3E8E6',
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: '#0E9F6E',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFF' }}>
                  {property.owner.avatar}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0B1210' }}>
                  {property.owner.name}
                </Text>
                <Text style={{ fontSize: 11, color: '#5B6B66' }}>
                  Property Owner
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 18 }}>→</Text>
          </View>

          {/* CTA Buttons */}
          <View style={{ gap: 10, marginBottom: 40 }}>
            <ModernButton
              variant="primary"
              size="lg"
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={{ width: '100%' }}
            >
              Book Viewing
            </ModernButton>
            <ModernButton
              variant="secondary"
              size="lg"
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={{ width: '100%' }}
            >
              💬 Message Owner
            </ModernButton>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
