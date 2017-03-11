// @flow
/* eslint-disable camelcase */

import github from 'octonode'
import moment from 'moment'
import type { Notification } from './notification'

export type NotificationRawRecord = {
  id: string,
  updated_at: string,
  reason: string,
  subject: {
    title: string,
    url: ?string,
    latest_comment_url: ?string,
    type: string,
  },
  repository: {
    name: string,
    full_name: string,
  },
}

export type CommentRawRecord = {
  body: string,
  user: {
    login: string,
    avatar_url: string,
  },
  html_url: string,
}

type IssueOrPullRequest = {
  title: string,
  url: string,
}

type InitialArgs = {
  oauthToken: string,
}

const DAYS_SINCE = 3
const DEFAULT_AVATOR_URL = 'https://assets-cdn.github.com/images/modules/logos_page/Octocat.png'

export default class Github {
  client: Object
  me: Object
  rawRecords: NotificationRawRecord[]

  constructor({ oauthToken }: InitialArgs) {
    this.client = github.client(oauthToken)
    this.me = this.client.me()
  }

  async getNotifications(): Promise<Notification[]> {
    this.rawRecords = await this.fetchNotifications()
    const result = await this.transformRecords()
    return result
  }

  async transformRecords(): Promise<Notification[]> {
    const results = await Promise.all(
      this.rawRecords.map(this.transformRecord.bind(this)),
    )
    return results
  }

  /*
   * transform github notification records (api response) to Notification
   */
  async transformRecord(record: NotificationRawRecord): Promise<Notification> {
    const { id, updated_at, reason, subject, repository } = record
    const notification = {
      id: parseInt(id, 10),
      title: subject.title,
      repositoryName: repository.full_name,
      reason,
      at: updated_at,
      comment: undefined,
      url: undefined,
      login: undefined,
      avatorUrl: undefined,
    }
    // if url exists, use title of the issue or PR
    if (subject.url) {
      const issueOrPR = await this.fetchIssueOrPullRequest(subject.url)
      notification.title = issueOrPR.title
      notification.url = issueOrPR.url
    }
    const commentUrlIsSameWithUrl = subject.latest_comment_url === subject.url
    if (subject.latest_comment_url && !commentUrlIsSameWithUrl) {
      const commentRawRecord = await this.fetchComment(subject.latest_comment_url)
      if (commentRawRecord) {
        const { body, user, html_url } = commentRawRecord
        notification.comment = body
        notification.login = user.login
        notification.avatorUrl = user.avatar_url
        notification.url = html_url
      }
    }
    if (!notification.avatorUrl) {
      notification.avatorUrl = DEFAULT_AVATOR_URL
    }
    return notification
  }

  fetchNotifications(): Promise<NotificationRawRecord[]> {
    const params = {
      participating: true,
      since: moment().add(-DAYS_SINCE, 'day').format('YYYY-MM-DDTHH:mm:00Z'),
    }
    return new Promise((resolve, reject) => {
      this.me.notifications(params, (err, records: NotificationRawRecord[]) => {
        if (err) { reject(err); return }
        resolve(records)
      })
    })
  }

  fetchIssueOrPullRequest(url: string): Promise<IssueOrPullRequest> {
    type IssueOrPullRequestRes = {
      title: string,
      html_url: string,
    }
    return new Promise((resolve, reject) => {
      this.client.get(url, {}, (err, status, { title, html_url } : IssueOrPullRequestRes) => {
        if (err) { reject(err); return }
        resolve({ title, url: html_url })
      })
    })
  }

  fetchComment(url: string): Promise<CommentRawRecord> {
    return new Promise((resolve, reject) => {
      this.client.get(url, {}, (err, status, data: CommentRawRecord) => {
        if (err) { reject(err); return }
        resolve(data)
      })
    })
  }
}
