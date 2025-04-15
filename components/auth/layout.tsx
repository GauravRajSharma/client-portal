import { Stack, View, XStack, styled } from "tamagui";
import { useMedia } from "tamagui";
import type { MediaQueryKey } from "@tamagui/web";

export const FormCard = styled(View, {
  tag: "form",
  flexDirection: "row",
  maxW: "100%",
  $xs: {
    borderWidth: 0,
    px: "$1",
  },
});

export const Hide = ({
  children,
  when = "sm",
}: { children: React.ReactNode; when: MediaQueryKey }) => {
  const hide = useMedia()[when];

  if (hide) {
    return null;
  }
  return children;
};

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <XStack flex={1} p="$1" justify="center" minH="100vh">
      <Stack width="100%" p="$4" maxW={600}>
        {children}
      </Stack>
    </XStack>
  );
};
