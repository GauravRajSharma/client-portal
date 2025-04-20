import { ArrowLeft, Scroll } from "@tamagui/lucide-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Button,
  Card,
  ScrollView,
  Spinner,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import { trpc } from "@/utils/trpc";
import { capitalize } from "lodash";

export default function ActiveMedications() {
  const { data, isLoading } = trpc.patientActiveMedications.useQuery();

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

      {data && !isLoading && (
        <ScrollView>
          <YStack gap="$4" mb="$16" mt="$2" px="$3">
            {data.map((medication) => {
              return (
                <Card elevate size="$4" bordered width="100%">
                  <Card.Header padded>
                    <View>
                      <View>
                        {medication.drug?.concept && (
                          <Text fontWeight="bold">
                            {medication.drug.concept?.display?.split(
                              " / ",
                            )?.[1] ?? medication.drug.concept.display}{" "}
                          </Text>
                        )}
                        {/* {medication.drug?.strength && <>{medication.drug?.strength.toLowerCase()}</>}{' '} */}
                      </View>
                      <Text>{medication.drug?.strength ?? "N/A"}</Text>
                      {medication.drug?.dosageForm?.display && (
                        <Text>
                          {medication.drug.dosageForm.display.toLowerCase()}
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text>
                        {medication.dose}{" "}
                        {medication.doseUnits?.display.toLowerCase()}
                      </Text>
                      {medication.route?.display && (
                        <Text>{medication.route?.display.toLowerCase()}</Text>
                      )}
                      {medication.frequency?.display && (
                        <Text>
                          {medication.frequency?.display.toLowerCase()}
                        </Text>
                      )}
                      &mdash;
                      {!medication.duration
                        ? "Indefinite duration".toLowerCase()
                        : `for ${medication.duration} ${medication.durationUnits?.display.toLowerCase()}`}{" "}
                      {medication.numRefills !== 0 && (
                        <View>
                          <Text> &mdash; {"Refills".toUpperCase()}</Text>{" "}
                          <Text> {medication.numRefills}</Text>
                        </View>
                      )}
                    </View>
                  </Card.Header>
                </Card>
              );
            })}
          </YStack>
        </ScrollView>
      )}
    </View>
  );
}
