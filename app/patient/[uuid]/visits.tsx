import React from "react";

import { Link, router, useLocalSearchParams } from "expo-router";
import {
  Button,
  Card,
  H2,
  H4,
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

type TVisitCardProps = {
  external_uuid: string;
  id: string;
  display_name: string;
  department: string;
  manual_close_visit: boolean;
  visit_type: string;
};

function VisitCard({
  department,
  display_name,
  external_uuid,
  id,
  manual_close_visit,
  visit_type,
}: TVisitCardProps) {
  return (
    <Card elevate size="$4" bordered width="100%">
      <Card.Header padded>
        <Text>{display_name}</Text>
      </Card.Header>
      <Card.Footer padded>
        <XStack flex={1} />
        <Button rounded="$10">{visit_type}</Button>
        <Button rounded="$10">{department}</Button>
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
        <Card.Header padded>
          <Text>{data?.name}</Text>
        </Card.Header>
        <Card.Footer padded>
          <XStack flex={1} />
          <Button rounded="$10">{data?.ref}</Button>
        </Card.Footer>
      </Card>
      <Button
        onPress={async () => {
          await AsyncStorage.removeItem("access:token");
          client.clear();
          router.replace("/auth/login");
        }}
      >
        Logout
      </Button>
      ;
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
    <ScrollView rounded="$4">
      <YStack gap="$4" pb="$16">
        {data?.map((visit) => {
          return (
            <Link key={visit.id} href="/">
              <VisitCard {...visit} />
            </Link>
          );
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
