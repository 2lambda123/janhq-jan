import {
  ScrollArea,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@janhq/joi'

import useEngineQuery from '@/hooks/useEngineQuery'

import LoadingIndicator from '@/screens/HubScreen2/components/LoadingIndicator'

const EngineSetting: React.FC = () => {
  const { isLoading, data } = useEngineQuery()

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <LoadingIndicator />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div>Failed to get engine statuses..</div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="p-4">
        <Table>
          <TableCaption className="text-xl font-bold">Engines</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Engine name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((engineStatus) => {
              return (
                <TableRow key={engineStatus.name}>
                  <TableCell className="font-medium">
                    {engineStatus.name}
                  </TableCell>
                  <TableCell>{engineStatus.description}</TableCell>
                  <TableCell className="text-center">
                    {engineStatus.version}
                  </TableCell>
                  <TableCell>{engineStatus.status}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  )
}

export default EngineSetting
