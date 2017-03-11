// @flow
import 'babel-polyfill'
import Main from './main'

const githubToken: string = process.env.GITHUB_TOKEN || ''
const slackWebhookUrl: string = process.env.SLACK_WEBHOOK_URL || ''

const handler = async (event: Object, context: Object, callback: Function) => {
  const options = { githubToken, slackWebhookUrl }
  try {
    const main = new Main(options)
    const sentNotifications = await main.execute()
    callback(null, sentNotifications)
  } catch (e) {
    callback(e)
  }
}

export { handler }
export default handler
