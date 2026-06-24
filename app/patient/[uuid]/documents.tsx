import { useCallback, useState } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { ExternalLink, FileBox, FileStack, FileText } from "@tamagui/lucide-icons";
import type { NamedExoticComponent } from "react";
import { Text, XStack, YStack } from "tamagui";
import {
  DLCard,
  DLScreen,
  DLStatusPill,
  DLTitle,
  EmptyState,
  ErrorState,
  SkeletonList,
} from "@/components/ui";
import type { DocumentKind, PatientDocument } from "@/server/dto";
import { trpc } from "@/utils/trpc";

const KIND_META: Record<
  DocumentKind,
  { label: string; Icon: NamedExoticComponent<any>; description: string }
> = {
  summary: { label: "Summary", Icon: FileText, description: "A short overview of this visit you can save or print." },
  report: { label: "Report", Icon: FileStack, description: "The detailed report for this visit, with results combined." },
  prescription: { label: "Prescription", Icon: FileBox, description: "Your prescribed medicines from this visit." },
  lab: { label: "Lab", Icon: FileBox, description: "Laboratory results for this visit." },
};

/** Open a document URL: new tab on web, in-app browser on native. */
async function openDocument(url: string) {
  if (Platform.OS === "web") {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) window.location.assign(url);
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}

function DocumentRow({ doc, border }: { doc: PatientDocument; border: boolean }) {
  const meta = KIND_META[doc.kind];
  const [opening, setOpening] = useState(false);
  const onOpen = useCallback(async () => {
    setOpening(true);
    try {
      await openDocument(doc.url);
    } finally {
      setOpening(false);
    }
  }, [doc.url]);

  return (
    <XStack items="center" gap="$3" px="$3.5" py="$3" borderTopWidth={border ? 1 : 0} borderColor="$border">
      <YStack width={38} height={38} rounded={10} bg="$primarySoft" items="center" justify="center">
        <meta.Icon size={18} color="$primary" />
      </YStack>
      <YStack flex={1} minW={0} gap="$0.5">
        <Text fontSize={14.5} fontWeight="600" color="$color12">
          {doc.title}
        </Text>
        <Text fontSize={11.5} color="$text2" numberOfLines={2}>
          {meta.description} Opens as a {doc.format.toUpperCase()}.
        </Text>
      </YStack>
      <XStack
        items="center"
        gap="$1.5"
        bg="$primary"
        px="$3"
        height={34}
        rounded={10}
        onPress={onOpen}
        opacity={opening ? 0.6 : 1}
        pressStyle={{ bg: "$primaryStrong" }}
      >
        <Text fontSize={12.5} fontWeight="700" color="$onPrimary">
          {opening ? "Opening" : Platform.OS === "web" ? "Open" : "View"}
        </Text>
        {opening ? null : <ExternalLink size={14} color="$onPrimary" />}
      </XStack>
    </XStack>
  );
}

export default function Documents() {
  const { data, isLoading, isError, refetch } = trpc.patientDocuments.useQuery();

  return (
    <DLScreen>
      <DLTitle title="Documents" subtitle="Summaries and reports from your visits." />

      {isLoading ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <ErrorState
          title="Couldn't load your documents"
          detail="We couldn't reach the records service. Please try again."
          onRetry={() => refetch()}
        />
      ) : !data || data.groups.length === 0 ? (
        <EmptyState
          Icon={FileText}
          title="No documents yet"
          detail="Once you have a visit, your visit summary and report appear here to view or save."
        />
      ) : (
        <YStack gap="$3">
          {data.groups.map((group) => (
            <DLCard key={group.visitId} overflow="hidden">
              <XStack items="center" justify="space-between" gap="$3" px="$3.5" py="$3">
                <Text fontSize={14} fontWeight="700" color="$color12">
                  {group.date ? group.date.slice(0, 10) : group.title}
                </Text>
                <DLStatusPill label={group.typeLabel} color="$primary" soft="$primarySoft" size="sm" />
              </XStack>
              {group.documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} border />
              ))}
            </DLCard>
          ))}
        </YStack>
      )}
    </DLScreen>
  );
}
