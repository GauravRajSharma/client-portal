import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * Legacy route. Active medicines now live at /patient/[uuid]/meds (the Medicines
 * tab). Redirect so any old links / bookmarks stay coherent.
 */
export default function ActiveMedicationsRedirect() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  return <Redirect href={`/patient/${uuid}/meds` as any} />;
}
