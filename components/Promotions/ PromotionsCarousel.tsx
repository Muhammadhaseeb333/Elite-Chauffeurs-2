import React, { useRef } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import PromotionCard from "@/components/Promotions/PromotionCard";
import Button from "@/components/ui/Button";
import type { Promotion } from "@/types/promotion"

interface PromotionsCarouselProps {
  promotions: Promotion[];
  onPromotionPress?: (id: string) => void;
}

const PromotionsCarousel: React.FC<PromotionsCarouselProps> = ({ 
  promotions, 
  onPromotionPress 
}) => {
  // Correct ref usage with useRef hook
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
  };

  const handlePrevious = () => {
    const newIndex = Math.max(0, Math.floor(scrollX.value / 316) - 1);
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(
      promotions.length - 1,
      Math.floor(scrollX.value / 316) + 1
    );
    scrollToIndex(newIndex);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef} // Correct ref usage here
        data={promotions}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={316}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PromotionCard 
            promotion={item} 
            onPress={() => onPromotionPress?.(item.id)} 
          />
        )}
        onScroll={(event) => {
          scrollX.value = event.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        windowSize={5}
        initialNumToRender={3}
      />

      <View style={styles.controls}>
        <Button 
          variant="outline"
          onPress={handlePrevious}
          icon={<ChevronLeft size={20} />}
          style={styles.controlButton}
        />
        <Button 
          variant="outline"
          onPress={handleNext}
          icon={<ChevronRight size={20} />}
          style={styles.controlButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },
  carouselContent: {
    paddingHorizontal: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 0,
  },
});

export default PromotionsCarousel;