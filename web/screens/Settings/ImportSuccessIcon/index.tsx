import React, { useState } from 'react'

import { Check } from 'lucide-react'

type Props = {
  onEditModelClick: () => void
}

const ImportSuccessIcon: React.FC<Props> = ({ onEditModelClick }) => {
  const [isHovered, setIsHovered] = useState(false)

  console.log(isHovered, onEditModelClick)

  const onMouseOver = () => {
    setIsHovered(true)
  }

  const onMouseOut = () => {
    setIsHovered(false)
  }

  return (
    <div onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      {/* {isHovered ? (
        <EditIcon onEditModelClick={onEditModelClick} />
      ) : ( */}
      <SuccessIcon />
      {/* )} */}
    </div>
  )
}

const SuccessIcon = React.memo(() => (
  <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full">
    <Check size={20} />
  </div>
))

// const EditIcon: React.FC<Props> = React.memo(({ onEditModelClick }) => {
//   const onClick = useCallback(() => {
//     onEditModelClick()
//   }, [onEditModelClick])

//   return (
//     <div
//       className="bg-secondary flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg"
//       onClick={onClick}
//     >
//       <Pencil size={20} />
//     </div>
//   )
// })

export default ImportSuccessIcon
