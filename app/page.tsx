import { StudioWorkspace } from "@/components/studio/studio-workspace";
import { studioHomeSchoolInfo, studioOptions } from "@/lib/studio/catalogue";

export default function Home() {
  return (
    <StudioWorkspace
      view="overview"
      schools={studioOptions.schools}
      countries={studioOptions.countries}
      homeSchools={studioHomeSchoolInfo}
    />
  );
}
