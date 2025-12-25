import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

export default function HomeScreen() {
    return (
        <SafeAreaView className="flex-1 bg-black items-center justify-center">
            <Text className="text-white text-2xl font-bold">Star Accessories</Text>
            <Text className="text-blue-400 mt-2">Mobile App Initialized</Text>
        </SafeAreaView>
    );
}
