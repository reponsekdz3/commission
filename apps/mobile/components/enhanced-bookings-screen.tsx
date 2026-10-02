// Enhanced Mobile Bookings Screen
// Apply to /apps/mobile/app/bookings.tsx

import React from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ModernButton, ModernBadge, InteractiveCard } from '@/components/modern-ui-enhancements';

export default function EnhancedBookingsScreen() {
  const [filter, setFilter] = React.useState('all');

  const bookings = [
    {
      id: 1,
      property: 'Modern 2-Bedroom Apartment',
      location: 'Kigali',
      date: '2024-01-15',
      status: 'confirmed',
      price: 'RWF 450,000',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
      timeline: [
        { step: 'Booking Created', completed: true, date: '2024-01-10' },
        { step: 'Payment Confirmed', completed: true, date: '2024-01-11' },
        { step: 'Viewing Scheduled', completed: true, date: '2024-01-12' },
        { step: 'Check-in', completed: false, date: '2024-01-15' },
      ],
    },
    {
      id: 2,
      property: 'Luxury Villa',
      location: 'Kigali',
      date: '2024-02-20',
      status: 'pending',
      price: 'RWF 1,200,000',
      image: 'https://images.unsplash.com/photo-1512917774080-9b274b3f0600?w=400&h=300&fit=crop',
      timeline: [
        { step: 'Booking Created', completed: true, date: '2024-01-20' },
        { step: 'Payment Pending', completed: false, date: '2024-01-21' },
        { step: 'Viewing Scheduled', completed: false, date: '2024-02-01' },
        { step: 'Check-in', completed: false, date: '2024-02-20' },
      ],
    },
    {
      id: 3,
      property: 'Studio Apartment',
      location: 'Huye',
      date: '2024-03-10',
      status: 'completed',
      price: 'RWF 250,000',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
      timeline: [
        { step: 'Booking Created', completed: true, date: '2024-01-01' },
        { step: 'Payment Confirmed', completed: true, date: '2024-01-02' },
        { step: 'Viewing Scheduled', completed: true, date: '2024-01-05' },
        { step: 'Check-in', completed: true, date: '2024-01-10' },
      ],
    },
  ];

  const statusConfig = {
    confirmed: { badge: 'success', label: 'Confirmed', icon: '✓' },
    pending: { badge: 'warning', label: 'Pending', icon: '⏳' },
    completed: { badge: 'primary', label: 'Completed', icon: '✓' },
  };

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

  return (
    <View style={{ flex: 1, backgroundColor: '#FDFDFC' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#0B1210', marginBottom: 16 }}>
            My Bookings
          </Text>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
          >
            {['all', 'pending', 'confirmed', 'completed'].map((tab) => (
              <Pressable
                key={tab}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilter(tab);
                }}
                style={({ pressed }) => [
                  {
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 999,
                    marginRight: 8,
                    backgroundColor: filter === tab ? '#0E9F6E' : '#FFF',
                    borderWidth: 1,
                    borderColor: filter === tab ? '#0E9F6E' : '#E3E8E6',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: filter === tab ? '#FFF' : '#0B1210',
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Bookings List */}
        <View style={{ paddingHorizontal: 16 }}>
          {filteredBookings.map((booking, i) => {
            const config = statusConfig[booking.status];
            return (
              <InteractiveCard
                key={booking.id}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{ marginBottom: 16 }}
              >
                {/* Image */}
                <Image
                  source={{ uri: booking.image }}
                  style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 12 }}
                />

                {/* Header */}
                <View style={{ paddingHorizontal: 4, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#0B1210', marginBottom: 4 }}>
                        {booking.property}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0E9F6E' }}>
                          📍 {booking.location}
                        </Text>
                      </View>
                    </View>
                    <ModernBadge variant={config.badge}>
                      {config.icon} {config.label}
                    </ModernBadge>
                  </View>

                  {/* Price */}
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#0B1210', marginBottom: 12 }}>
                    {booking.price}
                  </Text>

                  {/* Timeline */}
                  <View style={{ marginBottom: 12 }}>
                    {booking.timeline.map((step, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', marginBottom: idx < booking.timeline.length - 1 ? 12 : 0 }}>
                        {/* Timeline Dot */}
                        <View style={{ alignItems: 'center', marginRight: 12 }}>
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: step.completed ? '#0E9F6E' : '#E3E8E6',
                              marginBottom: 8,
                            }}
                          />
                          {idx < booking.timeline.length - 1 && (
                            <View
                              style={{
                                width: 2,
                                height: 32,
                                backgroundColor: step.completed ? '#0E9F6E' : '#E3E8E6',
                              }}
                            />
                          )}
                        </View>

                        {/* Timeline Content */}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '700',
                              color: step.completed ? '#0B1210' : '#5B6B66',
                              marginBottom: 2,
                            }}
                          >
                            {step.step}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#5B6B66' }}>
                            {new Date(step.date).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    ))}
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
                      Details
                    </ModernButton>
                    <ModernButton
                      variant="secondary"
                      size="md"
                      style={{ flex: 1 }}
                      onPress={async () => {
                        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }}
                    >
                      Message
                    </ModernButton>
                  </View>
                </View>
              </InteractiveCard>
            );
          })}
        </View>

        {/* Empty State */}
        {filteredBookings.length === 0 && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📅</Text>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#0B1210', marginBottom: 8 }}>
              No bookings found
            </Text>
            <Text style={{ fontSize: 14, color: '#5B6B66', textAlign: 'center', marginBottom: 20 }}>
              You don't have any {filter !== 'all' ? filter : ''} bookings yet
            </Text>
            <ModernButton
              variant="primary"
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
            >
              Browse Properties
            </ModernButton>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
