'use client'

import { useEffect } from 'react'

import { motion as m } from 'framer-motion'

import { useAtomValue, useSetAtom } from 'jotai'

import { twMerge } from 'tailwind-merge'

import BottomPanel from '@/containers/Layout/BottomPanel'
import RibbonPanel from '@/containers/Layout/RibbonPanel'

import TopPanel from '@/containers/Layout/TopPanel'

import { getImportModelStageAtom } from '@/hooks/useImportModel'

import DownloadLocalModelModal from '@/screens/HubScreen2/components/DownloadLocalModelModal'
import InferenceErrorModal from '@/screens/HubScreen2/components/InferenceErrorModal'
import SetUpApiKeyModal from '@/screens/HubScreen2/components/SetUpApiKeyModal'
import SetUpRemoteModelModal from '@/screens/HubScreen2/components/SetUpRemoteModelModal'
import WarningMultipleModelModal from '@/screens/HubScreen2/components/WarningMultipleModelModal'
import { SUCCESS_SET_NEW_DESTINATION } from '@/screens/Settings/Advanced/DataFolder'
import CancelModelImportModal from '@/screens/Settings/CancelModelImportModal'
import ChooseWhatToImportModal from '@/screens/Settings/ChooseWhatToImportModal'
import EditModelInfoModal from '@/screens/Settings/EditModelInfoModal'
import HuggingFaceRepoDetailModal from '@/screens/Settings/HuggingFaceRepoDetailModal'
import ImportModelOptionModal from '@/screens/Settings/ImportModelOptionModal'
import ImportingModelModal from '@/screens/Settings/ImportingModelModal'
import SelectingModelModal from '@/screens/Settings/SelectingModelModal'

import LoadingModal from '../LoadingModal'

import MainViewContainer from '../MainViewContainer'

import WaitingForCortexModal from '../WaitingCortexModal'

import InstallingExtensionModal from './BottomPanel/InstallingExtension/InstallingExtensionModal'

import { MainViewState, mainViewStateAtom } from '@/helpers/atoms/App.atom'
import { reduceTransparentAtom } from '@/helpers/atoms/Setting.atom'

const BaseLayout = () => {
  const setMainViewState = useSetAtom(mainViewStateAtom)
  const importModelStage = useAtomValue(getImportModelStageAtom)
  const reduceTransparent = useAtomValue(reduceTransparentAtom)

  useEffect(() => {
    if (localStorage.getItem(SUCCESS_SET_NEW_DESTINATION) === 'true') {
      setMainViewState(MainViewState.Settings)
    }
  }, [setMainViewState])

  return (
    <div
      className={twMerge(
        'h-screen text-sm',
        reduceTransparent
          ? 'bg-[hsla(var(--app-bg))]'
          : 'bg-[hsla(var(--app-transparent))]'
      )}
    >
      <TopPanel />
      <div className="relative top-9 flex h-[calc(100vh-(36px+36px))] w-screen">
        <RibbonPanel />
        <m.div
          initial={{ opacity: 0, y: -8 }}
          className="h-full w-full"
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.3,
            },
          }}
        >
          <MainViewContainer />
        </m.div>
        <WaitingForCortexModal />
        <LoadingModal />
        {importModelStage === 'SELECTING_MODEL' && <SelectingModelModal />}
        {importModelStage === 'MODEL_SELECTED' && <ImportModelOptionModal />}
        {importModelStage === 'IMPORTING_MODEL' && <ImportingModelModal />}
        {importModelStage === 'EDIT_MODEL_INFO' && <EditModelInfoModal />}
        {importModelStage === 'CONFIRM_CANCEL' && <CancelModelImportModal />}

        <InferenceErrorModal />
        <WarningMultipleModelModal />
        <DownloadLocalModelModal />
        <SetUpRemoteModelModal />
        <SetUpApiKeyModal />
        <ChooseWhatToImportModal />
        <InstallingExtensionModal />
        <HuggingFaceRepoDetailModal />
      </div>
      <BottomPanel />
    </div>
  )
}

export default BaseLayout
