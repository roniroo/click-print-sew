"use client";

import { Settings2, Layers, Shapes, Link2, Ruler } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Inspector } from "./inspector";
import { LayersPanel } from "./layers-panel";
import { PiecesPanel } from "./pieces-panel";
import { SeamsPanel } from "./seams-panel";
import { MaterialsPanel } from "./materials-panel";

const TABS = [
  { value: "properties", icon: Settings2, label: "Properties" },
  { value: "layers", icon: Layers, label: "Layers" },
  { value: "pieces", icon: Shapes, label: "Pieces" },
  { value: "seams", icon: Link2, label: "Seams" },
  { value: "materials", icon: Ruler, label: "Materials" },
];

export function RightPanel() {
  return (
    <div className="hidden w-72 shrink-0 flex-col border-l border-border bg-card md:flex">
      <Tabs defaultValue="properties" className="flex h-full flex-col gap-0">
        <TabsList className="m-2 grid grid-cols-5">
          {TABS.map((t) => (
            <Tooltip key={t.value}>
              <TooltipTrigger asChild>
                <TabsTrigger value={t.value} aria-label={t.label}>
                  <t.icon className="size-4" />
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent>{t.label}</TooltipContent>
            </Tooltip>
          ))}
        </TabsList>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <TabsContent value="properties" className="m-0">
            <Inspector />
          </TabsContent>
          <TabsContent value="layers" className="m-0 h-full">
            <LayersPanel />
          </TabsContent>
          <TabsContent value="pieces" className="m-0 h-full">
            <PiecesPanel />
          </TabsContent>
          <TabsContent value="seams" className="m-0 h-full">
            <SeamsPanel />
          </TabsContent>
          <TabsContent value="materials" className="m-0">
            <MaterialsPanel />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
