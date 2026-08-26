import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import GroupsListScreen from "../screens/GroupsListScreen";
import CreateJoinGroupScreen from "../screens/CreateJoinGroupScreen";
import GroupHomeScreen from "../screens/GroupHomeScreen";
import LogPointScreen from "../screens/LogPointScreen";
import GroupSettingsScreen from "../screens/GroupSettingsScreen";
import { colors } from "../theme";
import type { AuthStackParamList, RootStackParamList } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: "800" },
        headerTintColor: colors.text,
      }}
    >
      <RootStack.Screen name="GroupsList" component={GroupsListScreen} options={{ headerShown: false }} />
      <RootStack.Screen
        name="CreateJoinGroup"
        component={CreateJoinGroupScreen}
        options={{ title: "New / Join Group" }}
      />
      <RootStack.Screen name="GroupHome" component={GroupHomeScreen} />
      <RootStack.Screen name="LogPoint" component={LogPointScreen} options={{ title: "Log a point" }} />
      <RootStack.Screen
        name="GroupSettings"
        component={GroupSettingsScreen}
        options={{ title: "Group settings" }}
      />
    </RootStack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <NavigationContainer>{user ? <MainNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
