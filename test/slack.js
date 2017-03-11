import 'babel-polyfill'
import assert from 'power-assert'
import fetchMock from 'fetch-mock'

import Slack from '../src/slack'

describe('Slack', () => {
  const webhookUrl = 'http://example.com'
  let slack = new Slack(webhookUrl)
  beforeEach(() => {
    slack = new Slack(webhookUrl)
  })
  afterEach(fetchMock.restore)
  const notificationExample = {
    repositoryName: 'org1/repo1',
    title: 'title1',
    url: 'http://example.com/111',
    comment: 'notification comment1',
    avatorUrl: 'http://example.com/222',
  }
  describe('createMessage', () => {
    it('works', () => {
      const notification1 = notificationExample
      const notifications = [notification1]
      slack.createMessage(notifications)
      assert.deepEqual(slack.message, {
        username: 'Github Notification',
        icon_emoji: ':speech_balloon:',
        attachments: [{
          title: `[${notification1.repositoryName}] ${notification1.title}`,
          title_link: notification1.url,
          text: notification1.comment,
          thumb_url: notification1.avatorUrl,
          color: '#787878',
          fallback: 'new github notification',
        }],
      })
    })
  })

  describe('sendMessage', () => {
    it('returns true if request suceeds', async () => {
      const notifications = [notificationExample]
      fetchMock.post('*', 200)
      const result = await slack.sendMessage(notifications)
      assert(result === true)
    })
    it('returns false if request fails', async () => {
      const notifications = [notificationExample]
      fetchMock.post('*', 500)
      const result = await slack.sendMessage(notifications)
      assert(result === false)
    })
  })
})
