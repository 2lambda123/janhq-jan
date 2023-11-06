import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useSetAtom } from 'jotai'
import { useDebouncedCallback } from 'use-debounce'

import { modelSearchAtom } from '@/helpers/JotaiWrapper'

export enum SearchType {
  Model = 'model',
}

type Props = {
  type?: SearchType
  placeholder?: string
}

const SearchBar: React.FC<Props> = ({ placeholder }) => {
  const setModelSearch = useSetAtom(modelSearchAtom)
  const placeholderText = placeholder ? placeholder : 'Search (⌘K)'

  const debounced = useDebouncedCallback((value) => {
    setModelSearch(value)
  }, 300)

  return (
    <div className="relative mt-3 flex items-center">
      <div className="absolute left-2 top-0 flex h-full items-center">
        <MagnifyingGlassIcon
          width={16}
          height={16}
          color="#3C3C43"
          opacity={0.6}
        />
      </div>
      <input
        type="text"
        name="search"
        id="search"
        placeholder={placeholderText}
        onChange={(e) => debounced(e.target.value)}
        className="block w-full rounded-md border-0 py-1.5 pl-8 pr-14 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
      />
    </div>
  )
}

export default SearchBar
