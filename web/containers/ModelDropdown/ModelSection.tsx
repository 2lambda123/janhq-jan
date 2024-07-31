import { useEffect, useState } from 'react'

import Image from 'next/image'

import { LlmEngine, Model } from '@janhq/core'

import { Button } from '@janhq/joi'
import { SettingsIcon } from 'lucide-react'

import useGetModelsByEngine from '@/hooks/useGetModelsByEngine'

import { getTitleByCategory } from '@/utils/model-engine'

import ModelLabel from '../ModelLabel'

type Props = {
  engine: LlmEngine
  searchText: string
  onModelSelected: (model: Model) => void
}

const ModelSection: React.FC<Props> = ({
  engine,
  searchText,
  onModelSelected,
}) => {
  const [models, setModels] = useState<Model[]>([])
  const { getModelsByEngine } = useGetModelsByEngine()

  useEffect(() => {
    const matchedModels = getModelsByEngine(engine, searchText)
    setModels(matchedModels)
  }, [getModelsByEngine, engine, searchText])

  if (models.length === 0) return null
  const engineName = getTitleByCategory(engine)

  return (
    <div className="w-full pt-2">
      <h6 className="mb-1 px-3 font-medium text-[hsla(var(--text-secondary))]">
        {engineName}
      </h6>
      <ul className="pb-2">
        {models.map((model) => (
          <li
            key={model.model}
            className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-[hsla(var(--dropdown-menu-hover-bg))]"
            onClick={() => onModelSelected(model)}
          >
            {model.metadata?.logo ? (
              <Image
                className="rounded-full object-cover"
                width={20}
                height={20}
                src={model.metadata?.logo}
                alt="logo"
              />
            ) : (
              !model.engine?.includes('cortex.') && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[hsla(var(--app-border))] bg-gradient-to-r from-cyan-500 to-blue-500"></div>
              )
            )}
            <div className="flex w-full items-center justify-between">
              <p className="line-clamp-1">{model.name ?? model.model}</p>
              {!model.engine?.includes('cortex.') && (
                <Button theme="icon">
                  <SettingsIcon
                    size={14}
                    className="text-[hsla(var(--text-secondary))]"
                  />
                </Button>
              )}
            </div>
            <ModelLabel metadata={model.metadata} compact />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ModelSection
