import { View, styled } from "tamagui";
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
