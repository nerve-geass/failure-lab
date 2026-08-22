import { useEffect } from "react";
import { useIncidentStore } from "@/application/incident/incidentStore";
import { useBlackboxStore } from "@/application/blackbox/blackboxStore";
import { BlackboxWorkspace } from "../blackbox/BlackboxWorkspace";
import { BlackboxBriefing } from "../blackbox/BlackboxBriefing";
import { BriefingPage } from "../briefing/BriefingPage";
import { LandingPage } from "../landing/LandingPage";
import { IncidentWorkspace } from "../incident/IncidentWorkspace";
import { AutopsyReport } from "../report/AutopsyReport";

export function App() {
  const blackboxMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mode") === "blackbox";
  const blackboxObservation = useBlackboxStore((state) => state.observation);
  const blackboxActions = useBlackboxStore((state) => state.actions);
  const blackboxHasSaved = useBlackboxStore((state) => state.hasSavedSession);
  const startBlackbox = useBlackboxStore((state) => state.start);
  const resumeBlackbox = useBlackboxStore((state) => state.resume);
  const performBlackboxAction = useBlackboxStore((state) => state.performAction);
  const screen = useIncidentStore((state) => state.screen);
  const restore = useIncidentStore((state) => state.restore);
  const startInvestigation = useIncidentStore((state) => state.startInvestigation);
  const resumeInvestigation = useIncidentStore((state) => state.resumeInvestigation);
  const abandonInvestigation = useIncidentStore((state) => state.abandonInvestigation);
  const enterIncident = useIncidentStore((state) => state.enterIncident);
  const goToLanding = useIncidentStore((state) => state.goToLanding);
  const scenario = useIncidentStore((state) => state.scenario);
  const incident = useIncidentStore((state) => state.incident);
  const hasSavedIncident = useIncidentStore((state) => state.hasSavedIncident);
  const selectScenario = useIncidentStore((state) => state.selectScenario);
  const openBlackbox = () => { window.location.assign("?mode=blackbox&stage=briefing"); };
  const exitBlackbox = () => { window.location.assign("/"); };

  useEffect(() => { restore(); }, [restore]);

  if (blackboxMode && new URLSearchParams(window.location.search).get("stage") === "briefing") return <BlackboxBriefing hasSavedSession={blackboxHasSaved} onStart={() => { startBlackbox(); window.location.assign("?mode=blackbox"); }} onResume={() => { resumeBlackbox(); window.location.assign("?mode=blackbox"); }} onBack={exitBlackbox} />;
  if (blackboxMode) return <BlackboxWorkspace observation={blackboxObservation} actions={blackboxActions} onAction={(action) => performBlackboxAction(action.id)} onExit={exitBlackbox} />;
  if (screen === "landing") return <LandingPage incident={incident} hasSavedIncident={hasSavedIncident} scenario={scenario} onStart={startInvestigation} onResume={resumeInvestigation} onAbandon={abandonInvestigation} onSelectScenario={selectScenario} onSelectBlackbox={openBlackbox} />;
  if (screen === "briefing") return <BriefingPage scenario={scenario} onEnter={enterIncident} onBack={goToLanding} />;
  if (screen === "incident") return <IncidentWorkspace />;
  return <AutopsyReport />;
}
