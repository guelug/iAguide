"use client";

import { createContext, useContext } from "react";

export type ViewerSettings = {
  paused: boolean;
  azimuth: number;
  elevation: number;
  studio: boolean;
  labels: boolean;
  detail: boolean;
  zoom: number;
  view: "original" | "front" | "overhead";
};
export const ViewerContext = createContext<ViewerSettings>({azimuth: 0, elevation: 0, studio: false, paused: false, labels: true, detail: false, zoom: 1, view: "original"});
export const useViewer = () => useContext(ViewerContext);
