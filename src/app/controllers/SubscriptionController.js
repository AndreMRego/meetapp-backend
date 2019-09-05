import { Op } from 'sequelize'

import Subscription from '../models/Subscription'
import Meetup from '../models/Meetup'
import User from '../models/User'

import ConfirmationMail from '../jobs/ConfirmationMail'
import Queue from '../../lib/Queue'
class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: { user_id: req.userId },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          attributes: ['id', 'title', 'description', 'localization', 'date'],
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
        },
      ],
      order: [['meetup', 'date']],
    })
    return res.json(subscriptions)
  }

  async store(req, res) {
    const meetup = await Meetup.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    })
    const user = await User.findByPk(req.userId)

    if (meetup.user_id === req.userId) {
      return res
        .status(401)
        .json({ error: "Can't subscribe to you own meetups" })
    }

    /*
     * Check for past dates
     */
    if (meetup.past) {
      return res.status(400).json({ error: 'Past dates are not permitted' })
    }

    /*
     * Check two subscriptions
     */
    const TwoSubscription = await Subscription.findOne({
      where: { user_id: req.userId, meetup_id: meetup.id },
    })

    if (TwoSubscription) {
      return res.status(400).json({ error: 'User has a previous subscription' })
    }

    /*
     * Check same time
     */

    const checkTwoMeetups = await Subscription.findOne({
      where: { user_id: req.userId },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    })

    if (checkTwoMeetups) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to two meetups at the same time" })
    }

    const subscription = await Subscription.create({
      user_id: req.userId,
      meetup_id: meetup.id,
    })
    await Queue.add(ConfirmationMail.key, {
      user,
      meetup,
    })

    return res.json(subscription)
  }
}

export default new SubscriptionController()
