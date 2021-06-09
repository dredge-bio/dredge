export type LogStatus = 'Pending' | 'Failed' | 'Missing' | 'OK'

export interface LogEntry {
  key: string,
  label: string,
  files: Array<{
    url: string,
    label: string,
    status: LogStatus,
  }>;
  metadata: Array<{
    field: string,
    label: string,
    status: LogStatus,
  }>
}
