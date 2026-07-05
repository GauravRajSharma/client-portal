import { useCallback, useState } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { ExternalLink, FileBox, FileStack, FileText, C } from "@/components/ui/icons";
import type { ComponentType } from "react";
import { HStack, VStack, Text, Pressable } from "@/components/ui/gs";
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
  { label: string; Icon: ComponentType<{ size?: number; color?: string }>; description: string }
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
    <HStack className={`items-center gap-[12px] px-[15px] py-[12px] ${border ? "border-t border-border" : ""}`}>
      <VStack className="w-[38px] h-[38px] rounded-[10px] bg-primarySoft items-center justify-center">
        <meta.Icon size={18} color={C.primary} />
      </VStack>
      <VStack className="flex-1 min-w-0 gap-[1px]">
        <Text className="text-[14.5px] font-plex-semibold text-fg">
          {doc.title}
        </Text>
        <Text className="text-[11.5px] text-text2" numberOfLines={2}>
          {meta.description} Opens as a {doc.format.toUpperCase()}.
        </Text>
      </VStack>
      <Pressable
        onPress={onOpen}
        className={`flex-row items-center gap-[4px] bg-primary px-[12px] h-[34px] rounded-[10px] active:bg-primaryStrong ${opening ? "opacity-60" : ""}`}
      >
        <Text className="text-[12.5px] font-plex-bold text-onPrimary">
          {opening ? "Opening" : Platform.OS === "web" ? "Open" : "View"}
        </Text>
        {opening ? null : <ExternalLink size={14} color={C.onPrimary} />}
      </Pressable>
    </HStack>
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
        <VStack className="gap-[12px]">
          {data.groups.map((group) => (
            <DLCard key={group.visitId} className="overflow-hidden">
              <HStack className="items-center justify-between gap-[12px] px-[15px] py-[12px]">
                <Text className="text-[14px] font-plex-bold text-fg">
                  {group.date ? group.date.slice(0, 10) : group.title}
                </Text>
                <DLStatusPill label={group.typeLabel} text="text-primary" softBg="bg-primarySoft" hex={C.primary} size="sm" />
              </HStack>
              {group.documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} border />
              ))}
            </DLCard>
          ))}
        </VStack>
      )}
    </DLScreen>
  );
}
