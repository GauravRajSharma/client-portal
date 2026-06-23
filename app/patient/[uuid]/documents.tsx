import { useCallback, useState } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  ExternalLink,
  FileText,
  FileStack,
  FileBox,
} from "@tamagui/lucide-icons";
import type { NamedExoticComponent } from "react";
import { Button, Text, Theme, XStack, YStack } from "tamagui";

import {
  DateText,
  EmptyState,
  ErrorState,
  Panel,
  Screen,
  Section,
  SkeletonList,
  StatusPill,
} from "@/components/ui";
import type { DocumentKind, PatientDocument } from "@/server/dto";
import { trpc } from "@/utils/trpc";

/**
 * How each document kind reads and looks. Plain language for the patient: the title
 * says what it is, the description says what they'll find inside. (See PRODUCT.md:
 * answer the patient's real question, trust through clarity.)
 */
const KIND_META: Record<
  DocumentKind,
  { label: string; Icon: NamedExoticComponent<any>; description: string }
> = {
  summary: {
    label: "Summary",
    Icon: FileText,
    description: "A short overview of this visit you can save or print.",
  },
  report: {
    label: "Report",
    Icon: FileStack,
    description: "The detailed report for this visit, with results combined.",
  },
  prescription: {
    label: "Prescription",
    Icon: FileBox,
    description: "Your prescribed medicines from this visit.",
  },
  lab: {
    label: "Lab",
    Icon: FileBox,
    description: "Laboratory results for this visit.",
  },
};

/** Open a document URL: a new browser tab on web, the in-app browser on native. */
async function openDocument(url: string) {
  if (Platform.OS === "web") {
    // window.open keeps the portal tab intact and lets the browser render the PDF.
    // If a popup blocker nulls the handle, fall back to navigating the current tab
    // so the tap is never silently swallowed.
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) window.location.assign(url);
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}

function DocumentRow({ doc }: { doc: PatientDocument }) {
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
    <XStack items="center" gap="$3" py="$2.5">
      <YStack
        width={40}
        height={40}
        rounded="$4"
        bg="$color3"
        items="center"
        justify="center"
      >
        <meta.Icon size={20} color="$color11" />
      </YStack>

      <YStack flex={1} gap="$1">
        <XStack items="center" gap="$2" flexWrap="wrap">
          <Text fontSize="$5" fontWeight="700" color="$color12">
            {doc.title}
          </Text>
          <StatusPill label={meta.label} size="sm" />
        </XStack>
        <Text fontSize="$2" color="$color10" numberOfLines={2}>
          {meta.description} Opens as a {doc.format.toUpperCase()}.
        </Text>
      </YStack>

      <Theme name="accent">
        <Button
          size="$3"
          iconAfter={opening ? undefined : ExternalLink}
          onPress={onOpen}
          disabled={opening}
          opacity={opening ? 0.7 : 1}
        >
          {opening ? "Opening" : Platform.OS === "web" ? "Open" : "View"}
        </Button>
      </Theme>
    </XStack>
  );
}

type DocGroup = {
  visitId: string;
  title: string;
  date?: string;
  typeLabel: string;
  documents: PatientDocument[];
};

function VisitGroup({ group }: { group: DocGroup }) {
  return (
    <Panel gap="$1">
      <XStack items="center" justify="space-between" gap="$3" pb="$1">
        <DateText
          value={group.date}
          fontSize="$5"
          fontWeight="700"
          color="$color12"
        />
        <StatusPill label={group.typeLabel} size="sm" />
      </XStack>
      {group.documents.map((doc, i) => (
        <YStack key={doc.id}>
          {i > 0 ? (
            <YStack height={1} bg="$borderColor" opacity={0.6} my="$0.5" />
          ) : null}
          <DocumentRow doc={doc} />
        </YStack>
      ))}
    </Panel>
  );
}

export default function Documents() {
  const { data, isLoading, isError, refetch } =
    trpc.patientDocuments.useQuery();

  return (
    <Screen>
      <Section title="Documents">
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
            detail="Once you have a visit, your visit summary and report will appear here to view or save."
          />
        ) : (
          <YStack gap="$3">
            <Text fontSize="$2" color="$color10">
              Summaries and reports from your visits. Tap a document to open it.
            </Text>
            {data.groups.map((group) => (
              <VisitGroup key={group.visitId} group={group} />
            ))}
          </YStack>
        )}
      </Section>
    </Screen>
  );
}
