import { QrCode, ScanLine, X, C } from "@/components/ui/icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { throttle } from "lodash";
import React, { useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { Box, Paragraph, Pressable, Text, HStack, VStack } from "@/components/ui/gs";

/** A quiet "or" divider with two rules. */
function OrDivider() {
  return (
    <HStack className="items-center gap-[12px] my-[2px]">
      <VStack className="flex-1 h-[1px] bg-border" />
      <Text className="text-[12px] font-plex-semibold text-text3 tracking-[0.6px]">or</Text>
      <VStack className="flex-1 h-[1px] bg-border" />
    </HStack>
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
      <VStack className="gap-[10px]">
        <OrDivider />

        <Pressable
          className="flex-row items-center gap-[12px] h-[60px] rounded-[14px] bg-surface border border-border px-[15px] active:opacity-80"
          onPress={openScanner}
          accessibilityRole="button"
          accessibilityLabel="Scan the QR code on your visit ticket"
        >
          <VStack className="w-[40px] h-[40px] rounded-[11px] bg-primarySoft items-center justify-center">
            <QrCode size={21} color={C.primary} />
          </VStack>
          <VStack className="flex-1 min-w-0">
            <Text className="text-[14.5px] font-plex-bold text-fg">Scan your visit ticket</Text>
            <Text className="text-[12px] text-text2">
              {permission && !permission.granted
                ? "Camera is used only to read the QR code"
                : "Auto-fills your MRN from the ticket QR"}
            </Text>
          </VStack>
          <ScanLine size={20} color={C.text3} />
        </Pressable>
      </VStack>

      {showCamera ? (
        <Box className="absolute inset-0 z-[1000] bg-black">
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => {
              setShowCamera(false);
              handleScan({ data });
            }}
          />

          {/* Reticle + instructions overlay */}
          <VStack
            className="absolute inset-0 items-center justify-center gap-[30px]"
            pointerEvents="box-none"
          >
            <VStack className="w-[232px] h-[232px] rounded-[22px] border-[3px] border-white items-center justify-center">
              <ScanLine size={56} color="rgba(255,255,255,0.85)" />
            </VStack>
            <VStack
              className="items-center gap-[2px] px-[30px] py-[12px] rounded-[16px] max-w-[320px]"
              style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
            >
              <Text className="text-[16px] font-plex-bold text-white text-center">
                Point the camera at your ticket
              </Text>
              <Paragraph className="text-[12px] text-center" style={{ color: "rgba(255,255,255,0.85)" }}>
                Line up the QR code inside the frame. It scans on its own.
              </Paragraph>
            </VStack>
          </VStack>

          <Pressable
            className="absolute top-[30px] right-[23px] w-[56px] h-[56px] rounded-full items-center justify-center border border-[rgba(255,255,255,0.45)] active:opacity-80"
            style={{ backgroundColor: "rgba(0,0,0,0.62)" }}
            hitSlop={8}
            onPress={() => setShowCamera(false)}
            accessibilityRole="button"
            accessibilityLabel="Close scanner"
          >
            <X size={26} color="white" />
          </Pressable>
        </Box>
      ) : null}
    </React.Fragment>
  );
}
