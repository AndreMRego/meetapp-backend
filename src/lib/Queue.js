import Bee from 'bee-queue'
import * as Sentry from '@sentry/node'
import sentryConfig from '../config/sentry'
import ConfirmationMail from '../app/jobs/ConfirmationMail'
import redisConfig from '../config/redis'

Sentry.init(sentryConfig)

const jobs = [ConfirmationMail]

class Queue {
  constructor() {
    this.queues = {}

    this.init()
  }

  /*
   * Cria uma fila para cada um dos jobs
   */
  init() {
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          redis: redisConfig,
        }),
        handle,
      }
    })
  }

  /*
   * Adiciona um job a fila
   */
  add(queue, job) {
    return this.queues[queue].bee.createJob(job).save()
  }

  /*
   * processar um job da fila
   */
  processQueue() {
    jobs.forEach(job => {
      const { bee, handle } = this.queues[job.key]

      bee.on('failed', this.handleFailure).process(handle)
    })
  }

  /*
   * receber o erro
   */
  handleFailure(job, err) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Queue ${job.queue.name}: FAILED`, err)
    }

    Sentry.captureException(err)
  }
}

export default new Queue()
