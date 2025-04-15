import { ArrowLeft } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Button,
  Card,
  H5,
  ScrollView,
  Spinner,
  View,
  YStack,
  H6,
  Text,
} from "tamagui";
import { trpc } from "@/utils/trpc";

export default function Prescriptions() {
  const { visit } = useLocalSearchParams<{
    uuid: string;
    visit: string;
  }>();

  const { data, isLoading } = trpc.patientLabResults.useQuery({ visit });

  return (
    <View flex={1}>
      <Button
        rounded={0}
        onPress={async () => {
          router.back();
        }}
      >
        <ArrowLeft /> Go to visits
      </Button>

      {isLoading && <Spinner size="large" />}
      {data &&
        !isLoading &&
        (data.length > 0 ? (
          <ScrollView mb="$4">
            <YStack gap="$2" p="$4">
              {data.map((r) => {
                if (!r.lab_item) return null;

                return (
                  <Card key={r.id} elevate size="$3" bordered width="100%">
                    <Card.Header>
                      <Text fontSize="$6">{r.lab_item?.[1]}</Text>
                      <Text>{r.value}</Text>
                    </Card.Header>
                  </Card>
                );
              })}
            </YStack>
          </ScrollView>
        ) : (
          <YStack minH={100} justify="center" items="center">
            <H5>No Lab Results found</H5>
          </YStack>
        ))}
    </View>
  );
}
