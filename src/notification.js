// @flow

export type Notification = {
  id: number,
  title: string,
  repositoryName: string,
  reason: string,
  comment: ?string,
  url: ?string,
  login: ?string,
  avatorUrl: ?string,
  at: string,
}
