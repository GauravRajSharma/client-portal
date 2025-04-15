import { X } from "@tamagui/lucide-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { throttle } from "lodash";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, Text, View, YStack } from "tamagui";

export function ScanVisitTicket({
  onScan,
}: { onScan: (data: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);

  if (!permission) {
    return <View />;
  }

  const handleScan = throttle(
    ({ data }: { data: string }) => {
      onScan(data);
    },
    1000,
    { leading: true, trailing: false },
  );

  return (
    <React.Fragment>
      <YStack justify="center">
        <View flexDirection="row" justify="center" width="100%" gap="$4">
          <View flex={1} height={1} bg="$borderColor" />
          <Text py="$4" color="gainsboro" mt="$-5">
            OR
          </Text>
          <View flex={1} height={1} bg="$borderColor" />
        </View>

        <Button
          icon={showCamera ? X : undefined}
          onPress={() => {
            if (permission.granted) setShowCamera(!showCamera);
            else requestPermission();
          }}
        >
          <Button.Text>
            {showCamera ? "Close Scanner" : "Scan Your Ticket"}
          </Button.Text>
        </Button>
      </YStack>

      {showCamera && (
        <View position="absolute" t={0} l={0} r={0} b={0} z={1000}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={({ data }) => {
              setShowCamera(false);
              handleScan({ data });
            }}
          />
        </View>
      )}
    </React.Fragment>
  );
}
