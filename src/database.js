// @flow
import { DynamoDB } from 'aws-sdk'
import type { Notification } from './notification'

type InitialArgs = {
  client: DynamoDB,
}

export const TABLE_NAME: string = 'github_notifications'

type BatchGetResult = {
  Responses: {
    [key: string]: Array<{ id: number, at: string, }>,
  },
}

export default class Database {
  constructor({ client }: InitialArgs) {
    this.client = client
  }
  client: DynamoDB

  async excludeExistingRecords(notifications: Notification[]) : Promise<Notification[]> {
    const keys = notifications.map(n => ({ id: n.id, at: n.at }))
    const result : BatchGetResult = await this.batchGet(keys)
    const existingKeys = result.Responses[TABLE_NAME].map(n => `${n.id}-${n.at}`)
    return notifications.filter(n => !existingKeys.includes(`${n.id}-${n.at}`))
  }

  async saveRecords(notifications: Notification[]) {
    const records = notifications.map((notification) => {
      const o = { ...notification }
      // remove empty fields
      for (const field of ['comment', 'url', 'login', 'avatorUrl']) {
        if (o[field] === null || o[field] === '') {
          delete o[field]
        }
      }
      return o
    })
    await this.batchWrite(records)
  }

  batchGet(keys: Array<{ id: number }>) {
    const params = {
      RequestItems: {
        [TABLE_NAME]: { Keys: keys },
      },
    }
    return this.client.batchGet(params).promise()
  }

  batchWrite(records: Array<Object>) {
    const params = {
      RequestItems: {
        [TABLE_NAME]: records.map(Item => ({
          PutRequest: { Item },
        })),
      },
    }
    return this.client.batchWrite(params).promise()
  }
}
