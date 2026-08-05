import { useEffect } from "react";
import { useIncidentStore } from "@/application/incident/incidentStore";
import { BriefingPage } from "../briefing/BriefingPage";
import { LandingPage } from "../landing/LandingPage";
import { IncidentWorkspace } from "../incident/IncidentWorkspace";
import { AutopsyReport } from "../report/AutopsyReport";

export function App() {
  const screen = useIncidentStore((state) => state.screen);
  const restore = useIncidentStore((state) => state.restore);
  const startInvestigation = useIncidentStore((state) => state.startInvestigation);
  const enterIncident = useIncidentStore((state) => state.enterIncident);
  const goToLanding = useIncidentStore((state) => state.goToLanding);
  const scenario = useIncidentStore((state) => state.scenario);

  useEffect(() => { restore(); }, [restore]);

  if (screen === "landing") return <LandingPage scenario={scenario} onStart={startInvestigation} />;
  if (screen === "briefing") return <BriefingPage scenario={scenario} onEnter={enterIncident} onBack={goToLanding} />;
  if (screen === "incident") return <IncidentWorkspace />;
  return <AutopsyReport />;
}
