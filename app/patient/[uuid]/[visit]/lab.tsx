import { ArrowDown, ArrowLeft, ArrowUp } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Button,
  Card,
  H5,
  ScrollView,
  Spinner,
  View,
  YStack,
  Text,
  XStack,
} from "tamagui";
import { trpc } from "@/utils/trpc";

const isWithinRange = (low: number, high: number, value: number) =>
  Number.isNaN(value) ? true : value >= low && value <= high;

const getColorIcon = (
  inRange: boolean,
  low: number,
  high: number,
  value: number,
) => {
  if (inRange) return null;

  if (value > high)
    return { color: "$red10", icon: () => <ArrowUp color="$red10" /> } as const;
  if (value < low)
    return {
      color: "$accent5",
      icon: () => <ArrowDown color="$accent5" />,
    } as const;
};

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

                const inRange = isWithinRange(
                  r.meta.lowNormal,
                  r.meta.hiNormal,
                  Number(r.value),
                );

                const ci = getColorIcon(
                  inRange,
                  r.meta.lowNormal,
                  r.meta.hiNormal,
                  Number(r.value),
                );

                return (
                  <Card key={r.id} elevate size="$3" bordered width="100%">
                    <Card.Header gap="$2">
                      <Text fontSize="$6">{r.lab_item?.[1]}</Text>

                      <XStack items="baseline" justify="space-between">
                        <XStack items="center" gap="$2">
                          <Text
                            fontWeight={!ci ? "normal" : "bold"}
                            fontSize="$8"
                            color={ci ? ci.color : "black"}
                          >
                            {r.value}
                          </Text>
                          <Text>{ci ? <ci.icon /> : null}</Text>
                        </XStack>
                        <Text>
                          {r.meta.lowNormal} - {r.meta.hiNormal} {r.meta.units}
                        </Text>
                      </XStack>
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
