import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { router, useRouter } from "expo-router";
import { Button } from "tamagui";

export default function SignIn() {
  //   const handleSignIn = () => {
  //     router.push("/");
  //   };

  return (
    <SafeAreaView>
      <View>
        <Text>Sign In</Text>

        <Button
          onPress={() => {
            router.push("/auth/verify");
          }}
        >
          Go to verification
        </Button>
        {/* <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        /> */}
        {/* <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity> */}
      </View>
    </SafeAreaView>
  );
}
