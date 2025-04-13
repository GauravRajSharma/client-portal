import { trpc } from "@/utils/trpc";
import { ChevronDown } from "@tamagui/lucide-icons";
import React from "react";

import { Accordion, Paragraph, Square } from "tamagui";

export function AccordionDemo() {
  const { data } = trpc.hello.useQuery({ text: "PHR Application" });
  return (
    <Accordion overflow="hidden" width="100%" type="single">
      <Accordion.Item value="a1">
        <Accordion.Trigger flexDirection="row" verticalAlign="space-between">
          {({
            open,
          }: {
            open: boolean;
          }) => (
            <>
              <Paragraph>1. {data?.greeting ?? "-"}</Paragraph>
              <Square animation="quick" rotate={open ? "180deg" : "0deg"}>
                <ChevronDown size="$1" />
              </Square>
            </>
          )}
        </Accordion.Trigger>
        <Accordion.HeightAnimator animation="medium">
          <Accordion.Content animation="medium" exitStyle={{ opacity: 0 }}>
            <Paragraph>
              Cold showers can help reduce inflammation, relieve pain, improve
              circulation, lower stress levels, and reduce muscle soreness and
              fatigue. Already the values are coming to it
            </Paragraph>
          </Accordion.Content>
        </Accordion.HeightAnimator>
      </Accordion.Item>

      <Accordion.Item value="a2">
        <Accordion.Trigger flexDirection="row" verticalAlign="space-between">
          {({
            open,
          }: {
            open: boolean;
          }) => (
            <>
              <Paragraph>2. Eat 4 eggs</Paragraph>
              <Square animation="quick" rotate={open ? "180deg" : "0deg"}>
                <ChevronDown size="$1" />
              </Square>
            </>
          )}
        </Accordion.Trigger>
        <Accordion.HeightAnimator animation="medium">
          <Accordion.Content animation="medium" exitStyle={{ opacity: 0 }}>
            <Paragraph>
              Eggs have been a dietary staple since time immemorial and there’s
              good reason for their continued presence in our menus and meals.
            </Paragraph>
          </Accordion.Content>
        </Accordion.HeightAnimator>
      </Accordion.Item>
    </Accordion>
  );
}

export default AccordionDemo;
