import React from 'react';
import { Pressable, StyleProp, ViewStyle, PressableProps } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface BouncyButtonProps extends Omit<PressableProps, 'style'> {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    scaleTo?: number;
}

export const BouncyButton = ({ children, style, scaleTo = 0.82, onPressIn, onPressOut, ...props }: BouncyButtonProps) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = (e: any) => {
        scale.value = withSpring(scaleTo, { damping: 10, stiffness: 350 });
        onPressIn?.(e);
    };

    const handlePressOut = (e: any) => {
        scale.value = withSpring(1, { damping: 10, stiffness: 350 });
        onPressOut?.(e);
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            {...props}
        >
            <Animated.View style={[style, animatedStyle]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};
