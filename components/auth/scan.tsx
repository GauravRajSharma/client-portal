import { Camera, QrCode, ScanLine, X } from "@tamagui/lucide-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { throttle } from "lodash";
import React, { useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { Button, Paragraph, Text, XStack, YStack } from "tamagui";

/** A quiet "or" divider with two rules. */
function OrDivider() {
  return (
    <XStack items="center" gap="$3" my="$1">
      <YStack flex={1} height={1} bg="$border" />
      <Text fontSize={12} fontWeight="600" color="$text3" letterSpacing={0.6}>
        or
      </Text>
      <YStack flex={1} height={1} bg="$border" />
    </XStack>
  );
}

/**
 * ScanVisitTicket — scan the QR on a hospital visit ticket to fill the MRN.
 *
 * Read-only: scanning only populates the sign-in form, it never writes. The camera is
 * presented full-screen with a clear reticle, plain instructions, and an obvious,
 * large close button (works on glare / low-end Android).
 */
export function ScanVisitTicket({
  onScan,
}: {
  onScan: (data: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);

  const handleScan = useMemo(
    () =>
      throttle(
        ({ data }: { data: string }) => {
          onScan(data);
        },
        1000,
        { leading: true, trailing: false },
      ),
    [onScan],
  );

  const openScanner = async () => {
    if (permission?.granted) {
      setShowCamera(true);
      return;
    }
    const result = await requestPermission();
    if (result?.granted) setShowCamera(true);
  };

  return (
    <React.Fragment>
      <YStack gap="$2.5">
        <OrDivider />

        <XStack
          items="center"
          gap="$3"
          height={60}
          rounded={14}
          bg="$surface"
          borderWidth={1}
          borderColor="$border"
          px="$3.5"
          pressStyle={{ opacity: 0.8 }}
          onPress={openScanner}
          accessibilityRole="button"
          accessibilityLabel="Scan the QR code on your visit ticket"
        >
          <YStack width={40} height={40} rounded={11} bg="$primarySoft" items="center" justify="center">
            <QrCode size={21} color="$primary" />
          </YStack>
          <YStack flex={1} minW={0}>
            <Text fontSize={14.5} fontWeight="700" color="$color12">
              Scan your visit ticket
            </Text>
            <Text fontSize={12} color="$text2">
              {permission && !permission.granted
                ? "Camera is used only to read the QR code"
                : "Auto-fills your MRN from the ticket QR"}
            </Text>
          </YStack>
          <ScanLine size={20} color="$text3" />
        </XStack>
      </YStack>

      {showCamera ? (
        <YStack
          position="absolute"
          t={0}
          l={0}
          r={0}
          b={0}
          z={1000}
          bg="black"
        >
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => {
              setShowCamera(false);
              handleScan({ data });
            }}
          />

          {/* Reticle + instructions overlay */}
          <YStack
            position="absolute"
            t={0}
            l={0}
            r={0}
            b={0}
            items="center"
            justify="center"
            gap="$6"
            pointerEvents="box-none"
          >
            <YStack
              width={232}
              height={232}
              rounded="$8"
              borderWidth={3}
              borderColor="white"
              items="center"
              justify="center"
            >
              <ScanLine size={56} color="rgba(255,255,255,0.85)" />
            </YStack>
            <YStack
              items="center"
              gap="$1"
              px="$6"
              py="$3"
              rounded="$6"
              bg="rgba(0,0,0,0.55)"
              maxW={320}
            >
              <Text fontSize="$5" fontWeight="700" color="white" text="center">
                Point the camera at your ticket
              </Text>
              <Paragraph
                fontSize="$2"
                color="rgba(255,255,255,0.85)"
                text="center"
              >
                Line up the QR code inside the frame. It scans on its own.
              </Paragraph>
            </YStack>
          </YStack>

          <Button
            position="absolute"
            t="$6"
            r="$5"
            width={56}
            height={56}
            circular
            hitSlop={8}
            bg="rgba(0,0,0,0.62)"
            borderWidth={1}
            borderColor="rgba(255,255,255,0.45)"
            pressStyle={{ bg: "rgba(0,0,0,0.8)" }}
            icon={<X size={26} color="white" />}
            onPress={() => setShowCamera(false)}
            accessibilityRole="button"
            accessibilityLabel="Close scanner"
          />
        </YStack>
      ) : null}
    </React.Fragment>
  );
}
