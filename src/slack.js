// @flow
/* eslint-disable no-console */

import 'isomorphic-fetch'

import type { Notification } from './notification'

export default class Slack {
  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl
  }

  webhookUrl: string
  message: Object

  async sendMessage(notifications: Notification[]): Promise<boolean> {
    this.createMessage(notifications)
    const data: Object = {
      method: 'post',
      body: JSON.stringify(this.message),
    }
    const res = await fetch(this.webhookUrl, data)
    if (!res.ok) {
      console.error(`status: ${res.status}, statusText: ${res.statusText} body: ${res.body ? res.body.toString() : ''}`)
    }
    return res.ok
  }

  createMessage(notifications : Notification[]) {
    this.message = {
      username: 'Github Notification',
      icon_emoji: ':speech_balloon:',
      attachments: notifications.map(notification => ({
        fallback: 'new github notification',
        title: `[${notification.repositoryName}] ${notification.title}`,
        title_link: notification.url,
        text: `${notification.comment || ''}`,
        thumb_url: notification.avatorUrl,
        color: '#787878',
      })),
    }
  }
}
