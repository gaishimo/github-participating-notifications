// @flow
import { DynamoDB } from 'aws-sdk'
import Github from './github'
import Slack from './slack'
import Database from './database'
import type { Notification } from './notification'

type Options = {
  githubToken: string,
  slackWebhookUrl: string,
}

export default class Main {
  constructor(options: Options) {
    this.github = new Github({ oauthToken: options.githubToken })
    this.slack = new Slack(options.slackWebhookUrl)
    this.database = new Database({
      client: new DynamoDB.DocumentClient(),
    })
  }
  options: Options
  github: Github
  slack: Slack
  database: Database

  async execute(): Promise<Notification[]> {
    let notifications = await this.github.getNotifications()
    if (notifications.length === 0) { return [] }
    notifications = await this.database.excludeExistingRecords(notifications)
    if (notifications.length === 0) { return [] }
    const result = await this.slack.sendMessage(notifications)
    if (!result) {
      throw new Error('Notification has failed.')
    }
    await this.database.saveRecords(notifications)
    return notifications
  }
}
