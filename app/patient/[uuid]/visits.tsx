import React from "react";

import { Link, router, useLocalSearchParams } from "expo-router";
import {
  Button,
  Card,
  H2,
  H4,
  H5,
  H6,
  Image,
  Paragraph,
  ScrollView,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import { trpc } from "@/utils/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import {
  Ambulance,
  Bed,
  BriefcaseMedical,
  Divide,
  FlaskConical,
  PanelRightClose,
  Stethoscope,
  PillBottle,
  Pill,
} from "@tamagui/lucide-icons";

type TVisitCardProps = {
  external_uuid: string;
  id: string;
  display_name: string;
  department: string;
  manual_close_visit: boolean;
  visit_type: string;
  doctor?: {
    name: string;
    id: number;
    license_number: string;
    specialized_title: string;
  };
};

function VisitCard({
  department,
  display_name,
  external_uuid,
  id,
  manual_close_visit,
  visit_type,
  doctor,
}: TVisitCardProps) {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const [dp, create_date, payment_type, payment_method] =
    display_name?.split("—");

  const VisitTypeIcons = {
    ER: Ambulance,
    IPD: Bed,
    OPD: BriefcaseMedical,
  } as const;

  const VisitColor = {
    ER: "red",
    IPD: "$accent1",
    OPD: "black",
  } as const;

  const Icon =
    VisitTypeIcons?.[visit_type as "ER" | "OPD" | "IPD"] ?? BriefcaseMedical;

  const color = VisitColor?.[visit_type as "ER" | "OPD" | "IPD"] ?? "black";
  return (
    <Card
      elevate
      size="$4"
      bordered
      width="100%"
      bg="$background08"
      overflow="hidden"
    >
      <Card.Header padded>
        <XStack justify="space-between" width="100%">
          <XStack items="center" gap="$2">
            <Stethoscope />
            <H6 color="$accent10"> {create_date}</H6>
          </XStack>

          <Button
            bg={color}
            borderColor={color}
            color="white"
            icon={Icon}
            size="$3"
            rounded="$10"
            variant="outlined"
            disabled
          >
            {visit_type}
          </Button>
        </XStack>
        <Text fontSize="$7" color="$color06">
          {payment_method}
        </Text>

        {doctor && (
          <Text color="$color04">
            {[doctor.name, doctor.specialized_title, doctor.license_number]
              .filter(Boolean)
              .join("—")}
          </Text>
        )}
      </Card.Header>
      <Card.Footer>
        <YStack width="100%" gap="$2">
          <XStack gap="$0.25">
            <Button
              icon={FlaskConical}
              size="$5"
              width="50%"
              rounded={0}
              color="white"
              bg="$accent6"
              onPress={() =>
                router.push(`/patient/${uuid}/${external_uuid}/lab`)
              }
            >
              Lab
            </Button>
            <Button
              icon={Pill}
              size="$5"
              width="50%"
              rounded={"$0"}
              color="black"
              bg="$color1"
              onPress={() =>
                router.push(`/patient/${uuid}/${external_uuid}/prescriptions`)
              }
            >
              Prescriptions
            </Button>
          </XStack>
        </YStack>
      </Card.Footer>
    </Card>
  );
}

function PatientCard() {
  const { data, isLoading } = trpc.patient.useQuery();

  const client = useQueryClient();
  if (isLoading)
    return (
      <View>
        <Text>Loading patient...</Text>
      </View>
    );

  return (
    <YStack gap="$2">
      <Card elevate size="$4" bordered width="100%">
        <Card.Header>
          <YStack gap="$3">
            <XStack width="100%" justify="space-between" items="center">
              <Text maxW="50%" fontWeight="bold">
                {data?.name} — {data?.ref}
              </Text>
              <Button
                onPress={async () => {
                  await AsyncStorage.removeItem("access:token");
                  client.clear();
                  router.replace("/auth/login");
                }}
              >
                Logout
              </Button>
            </XStack>

            <Button
              variant="outlined"
              icon={PillBottle}
              onPress={() =>
                // @ts-ignore
                router.push(`/patient/${data?.uuid}/active-medications`)
              }
            >
              View Active Medications
            </Button>
          </YStack>
        </Card.Header>
      </Card>
    </YStack>
  );
}

function Visits() {
  const { data, isLoading } = trpc.patientVisits.useQuery();

  if (isLoading)
    return (
      <View>
        <Text>Loading visits...</Text>
      </View>
    );

  return (
    <ScrollView rounded="$4" mb="$16" minH="100vh">
      <YStack gap="$4" pb="$16">
        {data?.map((visit) => {
          return <VisitCard key={visit.id} {...visit} />;
        })}
      </YStack>
    </ScrollView>
  );
}

export default function PatientVisit() {
  return (
    <YStack gap="$4" p="$4">
      <PatientCard />
      <Visits />
    </YStack>
  );
}
