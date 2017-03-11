import 'babel-polyfill'
import assert from 'power-assert'
import td from 'testdouble'
import { DynamoDB } from 'aws-sdk'

import Database, { TABLE_NAME } from '../src/database'

const client = new DynamoDB.DocumentClient()

describe('Database', () => {
  const database = new Database({ client })

  afterEach(() => td.reset())

  const notifications = [
    { id: 11 },
    { id: 12 },
  ]

  describe('excludeExistingRecords', () => {
    it('works', async () => {
      td.replace(database.client, 'batchGet')
      td.when(database.client.batchGet(td.matchers.anything()))
        .thenReturn({
          promise: () => (
            Promise.resolve({
              Responses: {
                [TABLE_NAME]: [notifications[0]],
              },
            })
          ),
        })
      const result = await database.excludeExistingRecords(notifications)
      assert.deepEqual(result, [notifications[1]])
    })
  })

  describe('saveRecords', () => {
    it('works', async () => {
      td.replace(database.client, 'batchWrite')
      td.when(database.client.batchWrite(td.matchers.anything()))
        .thenReturn({
          promise: () => (
            Promise.resolve()
          ),
        })
      await database.saveRecords(notifications)
    })
  })
})
