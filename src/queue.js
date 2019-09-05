import 'dotenv/config'

import Queue from './lib/Queue'
/*
 * Executar a  aplicação em um core diferente da fila
 */
Queue.processQueue()
