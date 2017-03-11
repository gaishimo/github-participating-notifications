import 'babel-polyfill'
import assert from 'power-assert'
import td from 'testdouble'
import Github from '../src/github'

const notificationRawRecordBase = {
  id: '111',
  updated_at: '2016-06-08T06:03:17Z',
  reason: 'reason1',
  subject: {
    title: 'title1',
    url: null,
    latest_comment_url: null,
    type: 'type',
  },
  repository: {
    full_name: 'org1/project1',
    name: 'project1',
  },
}

describe('Github', () => {
  let github
  beforeEach(() => {
    github = new Github({ oauthToken: 'dummy' })
  })
  afterEach(() => td.reset())

  describe('fetchNotifications', () => {
    it('can fetch notifications', async () => {
      const dummyNotifications = [{ dummy: 'aaaa' }]
      td.replace(github.me, 'notifications')
      td.when(github.me.notifications(td.matchers.anything()))
        .thenCallback(null, dummyNotifications)
      const notifications = await github.fetchNotifications()
      assert.deepEqual(notifications, dummyNotifications)
    })
  })

  describe('fetchComment', () => {
    it('can fetch comment', async () => {
      const url = 'https://api.github.com/repos/dummy/dummy/comment/111'
      const responseData = {
        body: 'comment-body',
        user: { login: 'user1', avatorUrl: 'http://example.com/avator1.png' },
        htmlUrl: 'http://example.com/1111',
      }
      td.replace(github.client, 'get')
      td.when(github.client.get(url, {}))
        .thenCallback(null, 200, responseData)
      const result = await github.fetchComment(url)
      assert(result === responseData)
    })
  })

  describe('fetchIssueOrPullRequest', () => {
    it('can fetch title', async () => {
      const url = 'https://api.github.com/repos/dummy/dummy/issues/111'
      const title = 'dummy title'
      const resultUrl = 'dummy url'
      td.replace(github.client, 'get')
      td.when(github.client.get(url, {}))
        .thenCallback(null, 200, { title, html_url: resultUrl })
      const result = await github.fetchIssueOrPullRequest(url)
      assert(result.title === title)
      assert(result.url === resultUrl)
    })
  })

  describe('transformRecords', () => {
    it('works if records is empty', async () => {
      github.rawRecords = []
      const result = await github.transformRecords()
      assert.deepEqual(result, [])
    })
    it('works if url is null', async () => {
      const record = notificationRawRecordBase
      github.rawRecords = [record]
      const result = await github.transformRecords()
      assert(result[0].id === Number(record.id))
      assert(result[0].title === record.subject.title)
    })
  })

  describe('transformRecord', () => {
    it('transforms properly', async () => {
      const rawRecord = { ...notificationRawRecordBase, aaa: 'bbb' }
      const result = await github.transformRecord(rawRecord)
      assert.deepEqual(result, {
        id: Number(rawRecord.id),
        title: rawRecord.subject.title,
        repositoryName: rawRecord.repository.full_name,
        reason: rawRecord.reason,
        comment: undefined,
        at: rawRecord.updated_at,
        url: rawRecord.subject.url,
        avatorUrl: 'https://assets-cdn.github.com/images/modules/logos_page/Octocat.png',
        login: undefined,
      })
    })

    it('fetch title if url exists', async () => {
      const rawRecord = {
        ...notificationRawRecordBase,
        subject: {
          ...notificationRawRecordBase.subject,
          url: 'http://example.com',
        },
      }
      td.replace(github.client, 'get')
      td.when(github.client.get(rawRecord.subject.url, {}))
        .thenCallback(null, 200, { title: 'issue title' })
      const result = await github.transformRecord(rawRecord)
      assert(result.title === 'issue title')
    })
  })
})
