import { Router } from 'express'
import multer from 'multer'
import multerConfig from './config/multer'

import UserController from './app/controllers/UserController'
import SessionController from './app/controllers/SessionController'
import FileController from './app/controllers/FileController'
import MeetUpController from './app/controllers/MeetUpController'
import OrganizeController from './app/controllers/OrganizeController'
import SubscriptionController from './app/controllers/SubscriptionController'

import authMiddleware from './app/middlewares/auth'

const routes = new Router()
const upload = multer(multerConfig)

routes.post('/users', UserController.store)
routes.post('/sessions', SessionController.store)

routes.use(authMiddleware)
routes.put('/users', UserController.update)

routes.get('/meetups', MeetUpController.index)
routes.get('/meetups/:id', MeetUpController.getItem)
routes.put('/meetups/:id', MeetUpController.update)
routes.post('/meetups', MeetUpController.store)
routes.delete('/meetups/:id', MeetUpController.delete)

routes.get('/organizing', OrganizeController.index)
routes.get('/subscriptions', SubscriptionController.index)
routes.delete('/subscriptions/:id', SubscriptionController.delete)
routes.post('/meetups/:id/subscriptions', SubscriptionController.store)

routes.post('/files', upload.single('file'), FileController.store)

export default routes
