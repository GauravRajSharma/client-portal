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

export default function PatientVisit() {
  //   const handleSignIn = () => {
  //     router.push("/");
  //   };

  return (
    <SafeAreaView>
      <View>
        <Text>Patient Visits</Text>
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
