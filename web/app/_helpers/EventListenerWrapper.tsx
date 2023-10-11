"use client";

import { useSetAtom } from "jotai";
import { ReactNode, useEffect } from "react";
import { appDownloadProgress } from "./JotaiWrapper";
import { DownloadState } from "@/_models/DownloadState";
import { executeSerial } from "../../../electron/core/plugin-manager/execution/extension-manager";
import { DataService } from "@janhq/plugin-core";
import {
  setDownloadStateAtom,
  setDownloadStateSuccessAtom,
} from "./atoms/DownloadState.atom";
import { getDownloadedModels } from "@/_hooks/useGetDownloadedModels";
import { downloadedModelAtom } from "./atoms/DownloadedModel.atom";

type Props = {
  children: ReactNode;
};

export default function EventListenerWrapper({ children }: Props) {
  const setDownloadState = useSetAtom(setDownloadStateAtom);
  const setDownloadStateSuccess = useSetAtom(setDownloadStateSuccessAtom);
  const setProgress = useSetAtom(appDownloadProgress);
  const setDownloadedModels = useSetAtom(downloadedModelAtom);

  useEffect(() => {
    if (window && window.electronAPI) {
      window.electronAPI.onFileDownloadUpdate(
        (_event: string, state: DownloadState | undefined) => {
          if (!state) return;
          setDownloadState(state);
        }
      );

      window.electronAPI.onFileDownloadError(
        (_event: string, callback: any) => {
          console.log("Download error", callback);
        }
      );

      window.electronAPI.onFileDownloadSuccess(
        (_event: string, callback: any) => {
          if (callback && callback.fileName) {
            setDownloadStateSuccess(callback.fileName);

            executeSerial(
              DataService.UpdateFinishedDownloadAt,
              callback.fileName
            ).then(() => {
              getDownloadedModels().then((models) => {
                setDownloadedModels(models);
              });
            });
          }
        }
      );

      window.electronAPI.onAppUpdateDownloadUpdate(
        (_event: string, progress: any) => {
          setProgress(progress.percent);
          console.log("app update progress:", progress.percent);
        }
      );

      window.electronAPI.onAppUpdateDownloadError(
        (_event: string, callback: any) => {
          console.log("Download error", callback);
          setProgress(-1);
        }
      );

      window.electronAPI.onAppUpdateDownloadSuccess(
        (_event: string, callback: any) => {
          setProgress(-1);
        }
      );
    }
  }, []);

  return <div id="eventlistener">{children}</div>;
}
