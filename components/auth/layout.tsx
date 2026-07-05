import type { ReactNode } from "react";
import { Activity, Eye, Lock, C } from "@/components/ui/icons";
import { ScrollView, Text, HStack, VStack, useMedia } from "@/components/ui/gs";

const cx = (...parts: (string | undefined | false | null)[]) => parts.filter(Boolean).join(" ");

/** A native HTML <form> on web so the browser treats the inputs as a real form. */
export function FormStack({ className, ...p }: React.ComponentProps<typeof VStack>) {
  return <VStack className={cx("w-full gap-[15px]", className)} {...p} />;
}

/** Deltalab brand block: white logo tile + name + place line. Centered. */
function AuthBrand() {
  return (
    <VStack className="items-center gap-[12px] mb-[17px] mt-[7px]">
      <VStack
        className="w-[104px] h-[104px] rounded-[28px] bg-surface border border-border items-center justify-center"
        style={{
          shadowColor: "rgba(16,36,61,0.18)",
          shadowRadius: 28,
          shadowOffset: { width: 0, height: 12 },
        }}
      >
        <VStack className="w-[62px] h-[62px] rounded-[18px] bg-primary items-center justify-center">
          <Activity size={34} color="#fff" strokeWidth={2.4} />
        </VStack>
      </VStack>
      <VStack className="items-center gap-[4px]">
        <Text className="text-[25px] font-plex-bold text-fg tracking-[-0.5px]">EHRPlus</Text>
        <Text className="text-[13.5px] font-plex-semibold text-primary">Patient Portal</Text>
      </VStack>
    </VStack>
  );
}

/** Trust footer: the load-bearing reassurance for health data. */
function AuthFooter() {
  return (
    <VStack className="gap-[10px] pt-[12px] mt-[7px] border-t border-border">
      <HStack className="items-center gap-[10px]">
        <Eye size={15} color={C.text3} />
        <Text className="text-[12.5px] text-text2 flex-1">
          View-only access to your records. Nothing is changed.
        </Text>
      </HStack>
      <HStack className="items-center gap-[10px]">
        <Lock size={15} color={C.text3} />
        <Text className="text-[12.5px] text-text2 flex-1">Your data stays private to you.</Text>
      </HStack>
    </VStack>
  );
}

/**
 * AuthLayout — Deltalab login chrome. Soft-blue background, centered brand, single
 * column. On web (>= md) the column sits in a calm white card with a max width.
 */
export const AuthLayout = ({ children }: { children: ReactNode }) => {
  const wide = useMedia().md;

  const inner = (
    <VStack className="w-full mx-auto gap-[17px]" style={{ maxWidth: wide ? 420 : undefined }}>
      <AuthBrand />
      {children}
      <AuthFooter />
    </VStack>
  );

  if (wide) {
    return (
      <VStack className="flex-1 bg-appBg items-center justify-center p-[30px]">
        <VStack
          className="w-full rounded-[28px] bg-surface border border-border px-[37px] py-[37px]"
          style={{
            maxWidth: 476,
            shadowColor: "rgba(16,36,61,0.18)",
            shadowRadius: 32,
            shadowOffset: { width: 0, height: 16 },
          }}
        >
          {inner}
        </VStack>
      </VStack>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-appBg"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <VStack className="flex-1 px-[23px] pt-[17px] pb-[37px]">{inner}</VStack>
    </ScrollView>
  );
};
