"use client";

import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, ShieldAlert } from "lucide-react";
import { ZoneTabMedia } from "../zone-tab-media";
import { ZoneTabRisks } from "../zone-tab-risks";
import type { ZoneTab } from "../hooks/use-zone-detail";

type Props = {
  activeTab: ZoneTab;
  setActiveTab: (tab: ZoneTab) => void;
  zone: any;
  project: any;
};

export function ZoneDetailTabs({ activeTab, setActiveTab, zone, project }: Props) {
  return (
    <>
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl bg-muted/60 p-1">
        <TabsTrigger value="media" className="gap-1.5" onClick={() => setActiveTab("media")}>
          <ImageIcon className="h-3.5 w-3.5" />
          Médias
        </TabsTrigger>
        <TabsTrigger value="risks" className="gap-1.5" onClick={() => setActiveTab("risks")}>
          <ShieldAlert className="h-3.5 w-3.5" />
          Risques
        </TabsTrigger>
      </TabsList>

      <TabsContent value="media" className="mt-0">
        <ZoneTabMedia zone={zone} project={project} />
      </TabsContent>
      <TabsContent value="risks" className="mt-0">
        <ZoneTabRisks zone={zone} project={project} />
      </TabsContent>
    </>
  );
}

