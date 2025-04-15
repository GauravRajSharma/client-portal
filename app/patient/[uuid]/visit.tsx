import React from "react";

import { router, useLocalSearchParams } from "expo-router";
import { Button, Text, View } from "tamagui";

export default function PatientVisit() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();

  //   const handleSignIn = () => {
  //     router.push("/");
  //   };

  return (
    <View>
      <Text>Welcome {uuid}</Text>

      <Button onPress={() => router.replace("/auth/login")}>Logout</Button>
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
  );
}
