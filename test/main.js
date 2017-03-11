import 'babel-polyfill'
import assert from 'power-assert'
import td from 'testdouble'

import Main from '../src/main'

describe('Main', () => {
  describe('execute', () => {
    it('works', async () => {
      const options = {
        githubToken: 'dummy',
        slackWebhookUrl: 'http://example.com',
      }
      const notifications = [{
        repositoryName: 'org1/repo1',
        title: 'title1',
        url: 'http://example.com/111',
        comment: 'notification comment1',
        avatorUrl: 'http://example.com/222',
      }]

      const main = new Main(options)

      td.replace(main.github, 'getNotifications')
      td.when(main.github.getNotifications())
        .thenResolve(notifications)

      td.replace(main.slack, 'sendMessage')
      td.when(main.slack.sendMessage(notifications))
        .thenResolve(true)

      td.replace(main.database, 'excludeExistingRecords')
      td.when(main.database.excludeExistingRecords(notifications))
        .thenResolve(notifications)

      td.replace(main.database, 'saveRecords')
      td.when(main.database.saveRecords(notifications))
        .thenResolve()

      const result = await main.execute()
      assert.deepEqual(result, notifications)
    })
  })
})
